"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import {
  upsertScaleMemberSchema,
  removeScaleMemberSchema,
  type UpsertScaleMemberInput,
  type RemoveScaleMemberInput,
} from "@/lib/validators/ministries";
import type { AuthUser } from "@/lib/auth/session";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MyScaleEntry {
  scale_id: string;
  event_ministry_id: string;
  event: {
    id: string;
    name: string;
    date: string;
    start_time: string;
    end_time: string | null;
  };
  ministry: {
    id: string;
    name: string;
  };
}

export interface MyScaleMonth {
  /** "2026-04" */
  monthKey: string;
  /** "Abril 2026" */
  label: string;
  entries: MyScaleEntry[];
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── getMyScale ───────────────────────────────────────────────────────────────

export const getMyScale = withPermission(
  async (user: AuthUser): Promise<ActionResult<MyScaleEntry[]>> => {
    const supabase = await createClient();

    // Busca o member_id do usuário via email
    const { data: memberProfile, error: memberError } = await supabase
      .from("members")
      .select("id")
      .eq("church_id", user.church_id)
      .eq("email", user.email!)
      .maybeSingle();

    if (memberError || !memberProfile) {
      return { data: [], error: null }; // Sem perfil = sem escala
    }

    const { data: scaleRows, error } = await supabase
      .from("scales")
      .select(
        `
        id,
        event_ministry_id,
        event_ministry:event_ministries!scales_event_ministry_id_fkey(
          id,
          ministry:ministries!event_ministries_ministry_id_fkey(id, name),
          event:events!event_ministries_event_id_fkey(id, name, date, start_time, end_time, is_active)
        )
        `
      )
      .eq("member_id", memberProfile.id)
      .eq("church_id", user.church_id);

    if (error) {
      return { data: null, error: error.message };
    }

    const today = new Date().toISOString().split("T")[0];

    const entries: MyScaleEntry[] = (scaleRows ?? [])
      .filter((row) => {
        const em = (
          Array.isArray(row.event_ministry)
            ? row.event_ministry[0]
            : row.event_ministry
        ) as { event?: unknown; ministry?: unknown } | null;
        const ev = (
          em && Array.isArray(em.event) ? em.event[0] : em?.event
        ) as { date: string; is_active: boolean } | null;
        return ev?.is_active && (ev.date ?? "") >= today;
      })
      .map((row) => {
        const em = (
          Array.isArray(row.event_ministry)
            ? row.event_ministry[0]
            : row.event_ministry
        ) as { event?: unknown; ministry?: unknown } | null;
        const ev = (
          em && Array.isArray(em.event) ? em.event[0] : em?.event
        ) as {
          id: string;
          name: string;
          date: string;
          start_time: string;
          end_time: string | null;
        } | null;
        const min = (
          em && Array.isArray(em.ministry) ? em.ministry[0] : em?.ministry
        ) as { id: string; name: string } | null;

        return {
          scale_id: row.id,
          event_ministry_id: row.event_ministry_id,
          event: {
            id: ev?.id ?? "",
            name: ev?.name ?? "",
            date: ev?.date ?? "",
            start_time: ev?.start_time ?? "",
            end_time: ev?.end_time ?? null,
          },
          ministry: {
            id: min?.id ?? "",
            name: min?.name ?? "",
          },
        };
      })
      .sort((a, b) => a.event.date.localeCompare(b.event.date));

    return { data: entries, error: null };
  },
  { module: "escalas", minRole: "visitante" }
);

// ─── upsertScaleMember ────────────────────────────────────────────────────────

export const upsertScaleMember = withPermission(
  async (
    user: AuthUser,
    input: UpsertScaleMemberInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = upsertScaleMemberSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    // Verifica o event_ministry e pega o ministry associado
    const { data: eventMinistry, error: emError } = await supabase
      .from("event_ministries")
      .select(
        `
        id,
        ministry:ministries!event_ministries_ministry_id_fkey(id, leader_id)
        `
      )
      .eq("id", parsed.data.eventMinistryId)
      .single();

    if (emError || !eventMinistry) {
      return { data: null, error: "Escala não encontrada" };
    }

    const ministry = (Array.isArray(eventMinistry.ministry)
      ? eventMinistry.ministry[0]
      : eventMinistry.ministry) as unknown as {
      id: string;
      leader_id: string | null;
    } | null;

    // Se líder, valida que é o líder deste ministério
    if (user.role === "líder") {
      const { data: memberProfile } = await supabase
        .from("members")
        .select("id")
        .eq("church_id", user.church_id)
        .eq("email", user.email!)
        .maybeSingle();

      if (!memberProfile || ministry?.leader_id !== memberProfile.id) {
        return {
          data: null,
          error: "Apenas o líder do ministério pode editar a escala",
        };
      }
    }

    // Upsert: ignora se já existe
    const { data: row, error } = await supabase
      .from("scales")
      .upsert(
        {
          event_ministry_id: parsed.data.eventMinistryId,
          member_id: parsed.data.memberId,
          church_id: user.church_id,
        },
        { onConflict: "event_ministry_id,member_id" }
      )
      .select("id")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // TODO(sessão 2.8): disparar notificação para o membro escalado

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "upsert_scale_member",
      entityType: "scale",
      entityId: row.id,
      metadata: {
        eventMinistryId: parsed.data.eventMinistryId,
        memberId: parsed.data.memberId,
      },
    }).catch(() => {});

    return { data: { id: row.id }, error: null };
  },
  { module: "escalas", minRole: "líder" }
);

// ─── removeScaleMember ────────────────────────────────────────────────────────

export const removeScaleMember = withPermission(
  async (
    user: AuthUser,
    input: RemoveScaleMemberInput
  ): Promise<ActionResult<{ ok: true }>> => {
    const parsed = removeScaleMemberSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    // Verifica o event_ministry e pega o ministry associado
    const { data: eventMinistry, error: emError } = await supabase
      .from("event_ministries")
      .select(
        `
        id,
        ministry:ministries!event_ministries_ministry_id_fkey(id, leader_id)
        `
      )
      .eq("id", parsed.data.eventMinistryId)
      .single();

    if (emError || !eventMinistry) {
      return { data: null, error: "Escala não encontrada" };
    }

    const ministry = (Array.isArray(eventMinistry.ministry)
      ? eventMinistry.ministry[0]
      : eventMinistry.ministry) as unknown as {
      id: string;
      leader_id: string | null;
    } | null;

    // Se líder, valida que é o líder deste ministério
    if (user.role === "líder") {
      const { data: memberProfile } = await supabase
        .from("members")
        .select("id")
        .eq("church_id", user.church_id)
        .eq("email", user.email!)
        .maybeSingle();

      if (!memberProfile || ministry?.leader_id !== memberProfile.id) {
        return {
          data: null,
          error: "Apenas o líder do ministério pode editar a escala",
        };
      }
    }

    const { error } = await supabase
      .from("scales")
      .delete()
      .eq("event_ministry_id", parsed.data.eventMinistryId)
      .eq("member_id", parsed.data.memberId);

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "remove_scale_member",
      entityType: "scale",
      entityId: parsed.data.eventMinistryId,
      metadata: {
        eventMinistryId: parsed.data.eventMinistryId,
        memberId: parsed.data.memberId,
      },
    }).catch(() => {});

    return { data: { ok: true }, error: null };
  },
  { module: "escalas", minRole: "líder" }
);
