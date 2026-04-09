"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import {
  createMinistrySchema,
  updateMinistrySchema,
  addMinistryMemberSchema,
  removeMinistryMemberSchema,
  type CreateMinistryInput,
  type UpdateMinistryInput,
  type AddMinistryMemberInput,
  type RemoveMinistryMemberInput,
} from "@/lib/validators/ministries";
import type { AuthUser } from "@/lib/auth/session";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberSummary {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
}

export interface MinistryRow {
  id: string;
  church_id: string;
  name: string;
  counselor_id: string | null;
  leader_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MinistryWithRelations extends MinistryRow {
  counselor: MemberSummary | null;
  leader: MemberSummary | null;
  member_count: number;
}

export interface MinistryMemberRow {
  id: string; // ministry_members.id
  member: MemberSummary;
}

export interface EventScaleSummary {
  event_ministry_id: string;
  event: {
    id: string;
    name: string;
    date: string;
    start_time: string;
    end_time: string | null;
  };
  assigned_member_ids: string[];
}

export interface MinistryFull extends MinistryWithRelations {
  ministry_members: MinistryMemberRow[];
  upcoming_event_scales: EventScaleSummary[];
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── listMinistries ───────────────────────────────────────────────────────────

export const listMinistries = withPermission(
  async (
    user: AuthUser,
    search?: string
  ): Promise<ActionResult<MinistryWithRelations[]>> => {
    const supabase = await createClient();

    let query = supabase
      .from("ministries")
      .select(
        `
        *,
        counselor:members!ministries_counselor_id_fkey(id, name, avatar_url, role),
        leader:members!ministries_leader_id_fkey(id, name, avatar_url, role)
        `
      )
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (search?.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data: ministries, error: ministriesError } = await query;

    if (ministriesError) {
      return { data: null, error: ministriesError.message };
    }

    // Busca contagem de membros
    const { data: memberRows } = await supabase
      .from("ministry_members")
      .select("ministry_id")
      .eq("church_id", user.church_id);

    const countMap = (memberRows ?? []).reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.ministry_id] = (acc[row.ministry_id] ?? 0) + 1;
        return acc;
      },
      {}
    );

    const result = (ministries ?? []).map((m) => ({
      ...(m as MinistryRow),
      counselor: (m.counselor as MemberSummary) ?? null,
      leader: (m.leader as MemberSummary) ?? null,
      member_count: countMap[m.id] ?? 0,
    }));

    return { data: result, error: null };
  },
  { module: "ministerios", minRole: "visitante" }
);

// ─── getMinistryById ─────────────────────────────────────────────────────────

export const getMinistryById = withPermission(
  async (
    user: AuthUser,
    ministryId: string
  ): Promise<ActionResult<MinistryFull>> => {
    const supabase = await createClient();

    // 1. Ministry com counselor e leader
    const { data: ministry, error: ministryError } = await supabase
      .from("ministries")
      .select(
        `
        *,
        counselor:members!ministries_counselor_id_fkey(id, name, avatar_url, role),
        leader:members!ministries_leader_id_fkey(id, name, avatar_url, role)
        `
      )
      .eq("id", ministryId)
      .eq("is_active", true)
      .single();

    if (ministryError || !ministry) {
      return { data: null, error: "Ministério não encontrado" };
    }

    // 2. Membros do ministério
    const { data: memberRows } = await supabase
      .from("ministry_members")
      .select(
        `
        id,
        member:members!ministry_members_member_id_fkey(id, name, avatar_url, role)
        `
      )
      .eq("ministry_id", ministryId)
      .order("created_at", { ascending: true });

    // 3. Eventos futuros onde este ministério está escalado
    const today = new Date().toISOString().split("T")[0];
    const { data: eventMinistries } = await supabase
      .from("event_ministries")
      .select(
        `
        id,
        event:events!event_ministries_event_id_fkey(id, name, date, start_time, end_time, is_active)
        `
      )
      .eq("ministry_id", ministryId)
      .order("id", { ascending: true });

    // Filtra eventos futuros e ativos
    const upcomingEventMinistries = (eventMinistries ?? []).filter((em) => {
      // Como o relacionamento pode vir como array dependendo dos tipos gerados pelo Supabase, lidamos com isso
      const ev = (Array.isArray(em.event)
        ? em.event[0]
        : em.event) as unknown as { date: string; is_active: boolean } | null;
      return ev && ev.is_active && ev.date >= today;
    });

    // 4. Escalas para esses eventos
    const eventMinistryIds = upcomingEventMinistries.map((em) => em.id);
    let assignedMap: Record<string, string[]> = {};

    if (eventMinistryIds.length > 0) {
      const { data: scaleRows } = await supabase
        .from("scales")
        .select("event_ministry_id, member_id")
        .in("event_ministry_id", eventMinistryIds);

      assignedMap = (scaleRows ?? []).reduce<Record<string, string[]>>(
        (acc, row) => {
          if (!acc[row.event_ministry_id]) acc[row.event_ministry_id] = [];
          acc[row.event_ministry_id].push(row.member_id);
          return acc;
        },
        {}
      );
    }

    const upcoming_event_scales: EventScaleSummary[] = upcomingEventMinistries
      .map((em) => {
        const ev = (Array.isArray(em.event)
          ? em.event[0]
          : em.event) as unknown as {
          id: string;
          name: string;
          date: string;
          start_time: string;
          end_time: string | null;
          is_active: boolean;
        } | null;
        if (!ev) return null;
        return {
          event_ministry_id: em.id,
          event: {
            id: ev.id,
            name: ev.name,
            date: ev.date,
            start_time: ev.start_time,
            end_time: ev.end_time,
          },
          assigned_member_ids: assignedMap[em.id] ?? [],
        };
      })
      .filter(Boolean) as EventScaleSummary[];

    // Ordena por data do evento
    upcoming_event_scales.sort((a, b) =>
      a.event.date.localeCompare(b.event.date)
    );

    const memberCount = (memberRows ?? []).filter(
      (r) => r.member !== null
    ).length;

    return {
      data: {
        ...(ministry as MinistryRow),
        counselor: (ministry.counselor as MemberSummary) ?? null,
        leader: (ministry.leader as MemberSummary) ?? null,
        member_count: memberCount,
        ministry_members: (memberRows ?? [])
          .filter((r) => r.member !== null)
          .map((r) => ({
            id: r.id,
            member: (Array.isArray(r.member)
              ? r.member[0]
              : r.member) as unknown as MemberSummary,
          })),
        upcoming_event_scales,
      },
      error: null,
    };
  },
  { module: "ministerios", minRole: "visitante" }
);

// ─── createMinistry ───────────────────────────────────────────────────────────

export const createMinistry = withPermission(
  async (
    user: AuthUser,
    input: CreateMinistryInput
  ): Promise<ActionResult<MinistryRow>> => {
    const parsed = createMinistrySchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    const { data: row, error } = await supabase
      .from("ministries")
      .insert({
        church_id: user.church_id,
        name: parsed.data.name,
        counselor_id: parsed.data.counselor_id ?? null,
        leader_id: parsed.data.leader_id ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { data: null, error: "Já existe um ministério com este nome" };
      }
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create",
      entityType: "ministry",
      entityId: row.id,
      metadata: { name: row.name },
    }).catch(() => {});

    return { data: row as MinistryRow, error: null };
  },
  { module: "ministerios", minRole: "presbítero" }
);

// ─── updateMinistry ───────────────────────────────────────────────────────────

export const updateMinistry = withPermission(
  async (
    user: AuthUser,
    ministryId: string,
    input: UpdateMinistryInput
  ): Promise<ActionResult<MinistryRow>> => {
    const parsed = updateMinistrySchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from("ministries")
      .select("id, name")
      .eq("id", ministryId)
      .eq("is_active", true)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: "Ministério não encontrado" };
    }

    const { data: row, error } = await supabase
      .from("ministries")
      .update({
        ...parsed.data,
        counselor_id: parsed.data.counselor_id ?? null,
        leader_id: parsed.data.leader_id ?? null,
      })
      .eq("id", ministryId)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { data: null, error: "Já existe um ministério com este nome" };
      }
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "update",
      entityType: "ministry",
      entityId: ministryId,
      metadata: { fields: Object.keys(parsed.data) },
    }).catch(() => {});

    return { data: row as MinistryRow, error: null };
  },
  { module: "ministerios", minRole: "presbítero" }
);

// ─── deleteMinistry (soft-delete) ─────────────────────────────────────────────

export const deleteMinistry = withPermission(
  async (
    user: AuthUser,
    ministryId: string
  ): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from("ministries")
      .select("id, name")
      .eq("id", ministryId)
      .eq("is_active", true)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: "Ministério não encontrado" };
    }

    const { error } = await supabase
      .from("ministries")
      .update({ is_active: false })
      .eq("id", ministryId);

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete",
      entityType: "ministry",
      entityId: ministryId,
      metadata: { name: existing.name },
    }).catch(() => {});

    return { data: { id: ministryId }, error: null };
  },
  { module: "ministerios", minRole: "presbítero" }
);

// ─── addMinistryMember ────────────────────────────────────────────────────────

export const addMinistryMember = withPermission(
  async (
    user: AuthUser,
    input: AddMinistryMemberInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = addMinistryMemberSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    // Verifica que o ministério pertence ao tenant
    const { data: ministry, error: ministryError } = await supabase
      .from("ministries")
      .select("id, leader_id")
      .eq("id", parsed.data.ministryId)
      .eq("is_active", true)
      .single();

    if (ministryError || !ministry) {
      return { data: null, error: "Ministério não encontrado" };
    }

    // Se líder, só pode gerenciar o próprio ministério
    if (user.role === "líder") {
      const { data: memberProfile } = await supabase
        .from("members")
        .select("id")
        .eq("church_id", user.church_id)
        .eq("email", user.email!)
        .maybeSingle();

      if (!memberProfile || ministry.leader_id !== memberProfile.id) {
        return {
          data: null,
          error: "Apenas o líder do ministério pode gerenciar seus componentes",
        };
      }
    }

    const { data: row, error } = await supabase
      .from("ministry_members")
      .insert({
        ministry_id: parsed.data.ministryId,
        member_id: parsed.data.memberId,
        church_id: user.church_id,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { data: null, error: "Membro já pertence a este ministério" };
      }
      return { data: null, error: error.message };
    }

    // TODO(sessão 2.8): disparar notificação para o membro adicionado ao ministério

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "add_ministry_member",
      entityType: "ministry",
      entityId: parsed.data.ministryId,
      metadata: { memberId: parsed.data.memberId },
    }).catch(() => {});

    return { data: { id: row.id }, error: null };
  },
  { module: "ministerios", minRole: "líder" }
);

// ─── removeMinistryMember ─────────────────────────────────────────────────────

export const removeMinistryMember = withPermission(
  async (
    user: AuthUser,
    input: RemoveMinistryMemberInput
  ): Promise<ActionResult<{ ok: true }>> => {
    const parsed = removeMinistryMemberSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    // Verifica que o ministério pertence ao tenant
    const { data: ministry, error: ministryError } = await supabase
      .from("ministries")
      .select("id, leader_id")
      .eq("id", parsed.data.ministryId)
      .eq("is_active", true)
      .single();

    if (ministryError || !ministry) {
      return { data: null, error: "Ministério não encontrado" };
    }

    // Se líder, só pode gerenciar o próprio ministério
    if (user.role === "líder") {
      const { data: memberProfile } = await supabase
        .from("members")
        .select("id")
        .eq("church_id", user.church_id)
        .eq("email", user.email!)
        .maybeSingle();

      if (!memberProfile || ministry.leader_id !== memberProfile.id) {
        return {
          data: null,
          error: "Apenas o líder do ministério pode gerenciar seus componentes",
        };
      }
    }

    const { error } = await supabase
      .from("ministry_members")
      .delete()
      .eq("ministry_id", parsed.data.ministryId)
      .eq("member_id", parsed.data.memberId);

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "remove_ministry_member",
      entityType: "ministry",
      entityId: parsed.data.ministryId,
      metadata: { memberId: parsed.data.memberId },
    }).catch(() => {});

    return { data: { ok: true }, error: null };
  },
  { module: "ministerios", minRole: "líder" }
);
