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
import {
  scaleSuggestionAISchema,
  suggestScaleInputSchema,
  type SuggestScaleInput,
  type ScaleSuggestionResult,
} from "@/lib/validators/ai";
import { createNotification } from "@/actions/notifications";
import type { AuthUser } from "@/lib/auth/session";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

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

// ─── suggestScale ─────────────────────────────────────────────────────────────

export const suggestScale = withPermission(
  async (
    user: AuthUser,
    input: SuggestScaleInput
  ): Promise<ActionResult<ScaleSuggestionResult[]>> => {
    const parsed = suggestScaleInputSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { eventMinistryId, context } = parsed.data;
    const supabase = await createClient();

    // 1. Busca event_ministry com evento e ministério
    const { data: em, error: emError } = await supabase
      .from("event_ministries")
      .select(
        `
        id,
        ministry_id,
        event:events!event_ministries_event_id_fkey(id, name, date, description),
        ministry:ministries!event_ministries_ministry_id_fkey(id, name)
        `
      )
      .eq("id", eventMinistryId)
      .single();

    if (emError || !em) {
      return { data: null, error: "Escala não encontrada" };
    }

    const ministry = (
      Array.isArray(em.ministry) ? em.ministry[0] : em.ministry
    ) as { id: string; name: string } | null;

    const event = (Array.isArray(em.event) ? em.event[0] : em.event) as {
      id: string;
      name: string;
      date: string;
      description: string | null;
    } | null;

    if (!ministry || !event) {
      return {
        data: null,
        error: "Dados do evento ou ministério não encontrados",
      };
    }

    // 2. Busca membros do ministério
    const { data: mmRows, error: mmError } = await supabase
      .from("ministry_members")
      .select(
        "member:members!ministry_members_member_id_fkey(id, name, avatar_url, is_active)"
      )
      .eq("ministry_id", ministry.id);

    if (mmError) {
      return { data: null, error: "Erro ao buscar componentes do ministério" };
    }

    type MemberInfo = {
      id: string;
      name: string;
      avatar_url: string | null;
      is_active: boolean;
    };

    const members: MemberInfo[] = (mmRows ?? [])
      .map((mm) => {
        const m = Array.isArray(mm.member) ? mm.member[0] : mm.member;
        return m as MemberInfo | null;
      })
      .filter((m): m is MemberInfo => m !== null && m.is_active !== false);

    if (!members.length) {
      return { data: null, error: "Nenhum componente ativo neste ministério" };
    }

    // 3. Busca últimas 4 escalas do ministério (excluindo a atual)
    const { data: allEMs } = await supabase
      .from("event_ministries")
      .select("id, event:events!event_ministries_event_id_fkey(date)")
      .eq("ministry_id", ministry.id)
      .neq("id", eventMinistryId);

    const recentEmIds = (allEMs ?? [])
      .filter((row) => {
        const ev = Array.isArray(row.event) ? row.event[0] : row.event;
        return !!(ev as { date?: string } | null)?.date;
      })
      .sort((a, b) => {
        const dateA =
          (
            (Array.isArray(a.event) ? a.event[0] : a.event) as {
              date: string;
            } | null
          )?.date ?? "";
        const dateB =
          (
            (Array.isArray(b.event) ? b.event[0] : b.event) as {
              date: string;
            } | null
          )?.date ?? "";
        return dateB.localeCompare(dateA);
      })
      .slice(0, 4)
      .map((row) => row.id);

    // 4. Conta participações por membro nos últimos 4 eventos
    const participationMap = new Map<string, number>(
      members.map((m) => [m.id, 0])
    );

    if (recentEmIds.length > 0) {
      const { data: historicScales } = await supabase
        .from("scales")
        .select("member_id")
        .in("event_ministry_id", recentEmIds);

      (historicScales ?? []).forEach(({ member_id }) => {
        participationMap.set(
          member_id,
          (participationMap.get(member_id) ?? 0) + 1
        );
      });
    }

    // 5. Monta o prompt
    const membersContext = members
      .map((m) => {
        const count = participationMap.get(m.id) ?? 0;
        return `- ${m.name} (ID: ${m.id}) — escalado ${count} vez(es) nos últimos ${recentEmIds.length} evento(s)`;
      })
      .join("\n");

    const prompt = `
Você é um assistente de gestão ministerial para uma igreja evangélica brasileira.
Sua tarefa é sugerir quais membros devem ser escalados para servir em um evento, baseando-se no histórico de participação e no princípio de distribuição equitativa do serviço.

EVENTO: "${event.name}" — ${event.date}
MINISTÉRIO: "${ministry.name}"
${context ? `CONTEXTO ESPECIAL: "${context}"` : ""}
${event.description ? `DESCRIÇÃO DO EVENTO: "${event.description}"` : ""}

MEMBROS DISPONÍVEIS (com histórico dos últimos ${recentEmIds.length} evento(s)):
${membersContext}

CRITÉRIOS:
1. Priorize membros com MENOS participações recentes para garantir distribuição justa do serviço.
2. Considere o contexto especial, se fornecido (ex: um culto missionário pode exigir perfil distinto).
3. Sugira entre 2 e ${Math.min(members.length, 5)} membros.
4. A justificativa deve ser breve, pastoral e motivacional (máx. 150 caracteres).
5. Use os IDs exatos conforme listados acima — sem inventar novos IDs.
`;

    // 6. Chama Claude com fallback para Gemini 2.5 Flash
    let rawSuggestions: { memberId: string; reason: string }[];

    try {
      const { object } = await generateObject({
        model: anthropic("claude-sonnet-4-6"),
        schema: scaleSuggestionAISchema,
        prompt,
      });
      rawSuggestions = object.suggestions;
    } catch (primaryErr) {
      console.error(
        "[suggestScale] Claude falhou, tentando Gemini:",
        primaryErr
      );
      try {
        const { object } = await generateObject({
          model: google("gemini-2.5-flash"),
          schema: scaleSuggestionAISchema,
          prompt,
        });
        rawSuggestions = object.suggestions;
      } catch (fallbackErr) {
        console.error("[suggestScale] Gemini também falhou:", fallbackErr);
        return {
          data: null,
          error:
            "O serviço de IA está indisponível no momento. Tente novamente.",
        };
      }
    }

    // 7. Valida IDs retornados contra membros reais do ministério
    const memberMap = new Map(members.map((m) => [m.id, m]));
    const suggestions: ScaleSuggestionResult[] = rawSuggestions
      .filter((s) => memberMap.has(s.memberId))
      .map((s) => {
        const m = memberMap.get(s.memberId)!;
        return {
          memberId: m.id,
          memberName: m.name,
          memberAvatar: m.avatar_url,
          reason: s.reason,
        };
      });

    if (!suggestions.length) {
      return {
        data: null,
        error: "A IA não retornou sugestões válidas. Tente novamente.",
      };
    }

    return { data: suggestions, error: null };
  },
  { module: "escalas", minRole: "líder" }
);

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

    // Verifica o event_ministry, pega event name e ministry name
    const { data: eventMinistry, error: emError } = await supabase
      .from("event_ministries")
      .select(
        `
        id,
        event:events!event_ministries_event_id_fkey(id, name),
        ministry:ministries!event_ministries_ministry_id_fkey(id, name, leader_id)
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
      name: string;
      leader_id: string | null;
    } | null;

    const event = (Array.isArray(eventMinistry.event)
      ? eventMinistry.event[0]
      : eventMinistry.event) as unknown as {
      id: string;
      name: string;
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

    // Verifica se já existe (para distinguir INSERT de UPDATE)
    const { data: existing } = await supabase
      .from("scales")
      .select("id")
      .eq("event_ministry_id", parsed.data.eventMinistryId)
      .eq("member_id", parsed.data.memberId)
      .maybeSingle();

    const isNewInsert = !existing;

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

    // Notifica o membro escalado apenas em inserções novas
    if (isNewInsert && event?.name && ministry?.name) {
      createNotification({
        memberId: parsed.data.memberId,
        churchId: user.church_id,
        type: "scale_assignment",
        message: `Você foi adicionado à escala de ${event.name} (${ministry.name})`,
      }).catch(() => {});
    }

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
