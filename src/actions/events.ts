"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { createCachedClient } from "@/lib/supabase/cached";
import { withPermission } from "@/lib/auth/with-permission";
import { tag, CACHE_TTL } from "@/lib/cache";
import { getAccessToken } from "@/lib/auth/session";
import { logAudit } from "@/actions/audit";
import { createNotification } from "@/actions/notifications";
import { generateInstanceDates } from "@/lib/utils/recurrence";
import {
  createEventSchema,
  updateEventSchema,
  listEventsSchema,
  recurringEditScopeSchema,
  type CreateEventInput,
  type UpdateEventInput,
  type ListEventsInput,
  type RecurringEditScope,
} from "@/lib/validators/events";
import type { AuthUser } from "@/lib/auth/session";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventRow {
  id: string;
  church_id: string;
  name: string;
  responsible_id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  modality: "presencial" | "online";
  location: string | null;
  meeting_link: string | null;
  description: string | null;
  is_recurring: boolean;
  recurrence_rule: Record<string, unknown> | null;
  parent_event_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventWithResponsible extends EventRow {
  responsible: {
    id: string;
    name: string;
    avatar_url: string | null;
    role: string;
  } | null;
}

export interface ListEventsResult {
  events: EventWithResponsible[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── listEvents ───────────────────────────────────────────────────────────────

export const listEvents = withPermission(
  async (
    user: AuthUser,
    input: ListEventsInput = {}
  ): Promise<ActionResult<ListEventsResult>> => {
    const parsed = listEventsSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { modality, upcoming, page, pageSize } = parsed.data;
    const today = new Date().toISOString().split("T")[0];

    const accessToken = await getAccessToken();
    if (!accessToken) return { data: null, error: "Não autenticado." };

    const cachedFetch = unstable_cache(
      async (token: string) => {
        const supabase = createCachedClient(token);
        const offset = (page - 1) * pageSize;

        let query = supabase
          .from("events")
          .select(
            `
            *,
            responsible:members!events_responsible_id_fkey(id, name, avatar_url, role)
            `,
            { count: "exact" }
          )
          .eq("is_active", true)
          .eq("church_id", user.church_id)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true })
          .range(offset, offset + pageSize - 1);

        if (upcoming) {
          query = query.gte("date", today);
        }

        if (modality !== "all") {
          query = query.eq("modality", modality);
        }

        const { data, error, count } = await query;

        if (error) {
          return { data: null, error: error.message };
        }

        return {
          data: {
            events: (data ?? []) as EventWithResponsible[],
            total: count ?? 0,
            page,
            pageSize,
            totalPages: Math.ceil((count ?? 0) / pageSize),
          },
          error: null,
        };
      },
      [
        "list-events",
        user.church_id,
        modality,
        String(upcoming),
        String(page),
        String(pageSize),
        today,
      ],
      { tags: [tag.events(user.church_id)], revalidate: CACHE_TTL.list }
    );

    return cachedFetch(accessToken);
  },
  { module: "eventos", minRole: "visitante" }
);

// ─── getEventById ─────────────────────────────────────────────────────────────

export const getEventById = withPermission(
  async (
    _user: AuthUser,
    eventId: string
  ): Promise<ActionResult<EventWithResponsible>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        responsible:members!events_responsible_id_fkey(id, name, avatar_url, role)
        `
      )
      .eq("id", eventId)
      .eq("is_active", true)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as EventWithResponsible, error: null };
  },
  { module: "eventos", minRole: "visitante" }
);

// ─── createEvent ─────────────────────────────────────────────────────────────

export const createEvent = withPermission(
  async (
    user: AuthUser,
    input: CreateEventInput
  ): Promise<ActionResult<EventRow>> => {
    const parsed = createEventSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("events")
      .insert({
        church_id: user.church_id,
        name: parsed.data.name,
        responsible_id: parsed.data.responsible_id,
        date: parsed.data.date,
        start_time: parsed.data.start_time,
        end_time: parsed.data.end_time ?? null,
        modality: parsed.data.modality,
        location: parsed.data.location ?? null,
        meeting_link: parsed.data.meeting_link ?? null,
        description: parsed.data.description ?? null,
        is_recurring: parsed.data.is_recurring,
        recurrence_rule: parsed.data.recurrence_rule ?? null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Gerar instâncias se evento for recorrente
    if (parsed.data.is_recurring && parsed.data.recurrence_rule) {
      const instanceError = await _insertRecurringInstances(
        supabase,
        row as EventRow,
        user.church_id
      );
      if (instanceError) {
        // Instâncias não criadas, mas evento pai foi criado — logar e prosseguir
        console.error("Falha ao gerar instâncias recorrentes:", instanceError);
      }
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create",
      entityType: "event",
      entityId: row.id,
      metadata: { name: row.name, modality: row.modality, date: row.date },
    }).catch(() => {});

    revalidateTag(tag.events(user.church_id), "default");
    return { data: row as EventRow, error: null };
  },
  { module: "eventos", minRole: "líder" }
);

// ─── generateRecurringInstances ───────────────────────────────────────────────

export const generateRecurringInstances = withPermission(
  async (
    user: AuthUser,
    parentEventId: string
  ): Promise<ActionResult<{ count: number }>> => {
    const supabase = await createClient();

    const { data: parent, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("id", parentEventId)
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .single();

    if (fetchError || !parent) {
      return { data: null, error: "Evento não encontrado" };
    }

    if (!parent.is_recurring || !parent.recurrence_rule) {
      return { data: null, error: "Evento não é recorrente" };
    }

    const insertError = await _insertRecurringInstances(
      supabase,
      parent as EventRow,
      user.church_id
    );

    if (insertError) {
      return { data: null, error: insertError };
    }

    const baseDate = parseISO(parent.date);
    const dates = generateInstanceDates(
      baseDate,
      parent.recurrence_rule as Parameters<typeof generateInstanceDates>[1]
    );

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create",
      entityType: "recurring_instances",
      entityId: parentEventId,
      metadata: { count: dates.length },
    }).catch(() => {});

    return { data: { count: dates.length }, error: null };
  },
  { module: "eventos", minRole: "líder" }
);

// ─── _insertRecurringInstances (helper interno) ───────────────────────────────

async function _insertRecurringInstances(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  parent: EventRow,
  churchId: string
): Promise<string | null> {
  if (!parent.recurrence_rule) return null;

  const baseDate = parseISO(parent.date);

  let rule: Parameters<typeof generateInstanceDates>[1];
  try {
    rule = parent.recurrence_rule as Parameters<
      typeof generateInstanceDates
    >[1];
  } catch {
    return "Regra de recorrência inválida";
  }

  const dates = generateInstanceDates(baseDate, rule);
  if (dates.length === 0) return null;

  const instances = dates.map((d) => ({
    church_id: churchId,
    name: parent.name,
    responsible_id: parent.responsible_id,
    date: format(d, "yyyy-MM-dd"),
    start_time: parent.start_time,
    end_time: parent.end_time,
    modality: parent.modality,
    location: parent.location,
    meeting_link: parent.meeting_link,
    description: parent.description,
    is_recurring: false,
    recurrence_rule: null,
    parent_event_id: parent.id,
  }));

  const { error } = await supabase.from("events").insert(instances);
  return error ? error.message : null;
}

// ─── updateEvent ─────────────────────────────────────────────────────────────

export const updateEvent = withPermission(
  async (
    user: AuthUser,
    eventId: string,
    input: UpdateEventInput
  ): Promise<ActionResult<EventRow>> => {
    const parsed = updateEventSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from("events")
      .select("id, name, church_id")
      .eq("id", eventId)
      .eq("is_active", true)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: "Evento não encontrado" };
    }

    const { data: row, error } = await supabase
      .from("events")
      .update(parsed.data)
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "update",
      entityType: "event",
      entityId: eventId,
      metadata: { fields: Object.keys(parsed.data) },
    }).catch(() => {});

    revalidateTag(tag.events(user.church_id), "default");
    return { data: row as EventRow, error: null };
  },
  { module: "eventos", minRole: "líder" }
);

// ─── updateRecurringEvents ────────────────────────────────────────────────────

export const updateRecurringEvents = withPermission(
  async (
    user: AuthUser,
    eventId: string,
    scope: RecurringEditScope,
    input: UpdateEventInput
  ): Promise<ActionResult<{ updated: number }>> => {
    const parsedScope = recurringEditScopeSchema.safeParse(scope);
    if (!parsedScope.success) {
      return { data: null, error: "Escopo inválido" };
    }

    const parsed = updateEventSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    // Buscar evento atual
    const { data: current, error: fetchError } = await supabase
      .from("events")
      .select("id, date, parent_event_id, name")
      .eq("id", eventId)
      .eq("is_active", true)
      .single();

    if (fetchError || !current) {
      return { data: null, error: "Evento não encontrado" };
    }

    if (parsedScope.data === "only_this") {
      const { error } = await supabase
        .from("events")
        .update(parsed.data)
        .eq("id", eventId);

      if (error) return { data: null, error: error.message };

      await logAudit({
        churchId: user.church_id,
        userId: user.id,
        action: "update",
        entityType: "event",
        entityId: eventId,
        metadata: { scope, fields: Object.keys(parsed.data) },
      }).catch(() => {});
      return { data: { updated: 1 }, error: null };
    }

    // Para "this_and_following" e "all", não atualizar date/recurrence_rule
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { date: _date, recurrence_rule: _rule, ...safeFields } = parsed.data;

    const topParentId = current.parent_event_id ?? current.id;

    if (parsedScope.data === "this_and_following") {
      // Atualiza evento atual + irmãos com date >= current.date
      const { error: e1 } = await supabase
        .from("events")
        .update(safeFields)
        .eq("id", eventId);

      const { error: e2 } = await supabase
        .from("events")
        .update(safeFields)
        .eq("parent_event_id", topParentId)
        .gte("date", current.date)
        .neq("id", eventId);

      // Se for o próprio pai, atualizar o pai também
      if (topParentId === current.id) {
        await supabase
          .from("events")
          .update(safeFields)
          .eq("id", topParentId)
          .neq("id", eventId);
      }

      if (e1 || e2)
        return {
          data: null,
          error: e1?.message ?? e2?.message ?? "Erro ao atualizar",
        };
    } else {
      // "all": atualiza pai + todas as instâncias
      const { error: e1 } = await supabase
        .from("events")
        .update(safeFields)
        .eq("id", topParentId);

      const { error: e2 } = await supabase
        .from("events")
        .update(safeFields)
        .eq("parent_event_id", topParentId);

      if (e1 || e2)
        return {
          data: null,
          error: e1?.message ?? e2?.message ?? "Erro ao atualizar",
        };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "update",
      entityType: "event",
      entityId: eventId,
      metadata: { scope, fields: Object.keys(safeFields) },
    }).catch(() => {});
    revalidateTag(tag.events(user.church_id), "default");
    return { data: { updated: -1 }, error: null }; // count aproximado
  },
  { module: "eventos", minRole: "líder" }
);

// ─── deleteEvent (soft-delete, avulso) ────────────────────────────────────────

export const deleteEvent = withPermission(
  async (
    user: AuthUser,
    eventId: string
  ): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from("events")
      .select("id, name")
      .eq("id", eventId)
      .eq("is_active", true)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: "Evento não encontrado" };
    }

    const { error } = await supabase
      .from("events")
      .update({ is_active: false })
      .eq("id", eventId);

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete",
      entityType: "event",
      entityId: eventId,
      metadata: { name: existing.name },
    }).catch(() => {});

    revalidateTag(tag.events(user.church_id), "default");
    return { data: { id: eventId }, error: null };
  },
  { module: "eventos", minRole: "líder" }
);

// ─── deleteRecurringEvents ────────────────────────────────────────────────────

export const deleteRecurringEvents = withPermission(
  async (
    user: AuthUser,
    eventId: string,
    scope: RecurringEditScope
  ): Promise<ActionResult<{ deleted: number }>> => {
    const parsedScope = recurringEditScopeSchema.safeParse(scope);
    if (!parsedScope.success) {
      return { data: null, error: "Escopo inválido" };
    }

    const supabase = await createClient();

    const { data: current, error: fetchError } = await supabase
      .from("events")
      .select("id, date, parent_event_id, name")
      .eq("id", eventId)
      .eq("is_active", true)
      .single();

    if (fetchError || !current) {
      return { data: null, error: "Evento não encontrado" };
    }

    if (parsedScope.data === "only_this") {
      const { error } = await supabase
        .from("events")
        .update({ is_active: false })
        .eq("id", eventId);

      if (error) return { data: null, error: error.message };

      await logAudit({
        churchId: user.church_id,
        userId: user.id,
        action: "delete",
        entityType: "event",
        entityId: eventId,
        metadata: { scope, name: current.name },
      }).catch(() => {});
      return { data: { deleted: 1 }, error: null };
    }

    const topParentId = current.parent_event_id ?? current.id;

    if (parsedScope.data === "this_and_following") {
      // Soft-delete: evento atual + irmãos com date >= current.date
      const { error: e1 } = await supabase
        .from("events")
        .update({ is_active: false })
        .eq("id", eventId);

      const { error: e2 } = await supabase
        .from("events")
        .update({ is_active: false })
        .eq("parent_event_id", topParentId)
        .gte("date", current.date)
        .neq("id", eventId);

      // Se current É o pai, soft-delete do próprio pai
      if (topParentId === current.id) {
        await supabase
          .from("events")
          .update({ is_active: false })
          .eq("id", topParentId);
      }

      if (e1 || e2)
        return {
          data: null,
          error: e1?.message ?? e2?.message ?? "Erro ao deletar",
        };
    } else {
      // "all": soft-delete pai + todas as instâncias
      const { error: e1 } = await supabase
        .from("events")
        .update({ is_active: false })
        .eq("id", topParentId);

      const { error: e2 } = await supabase
        .from("events")
        .update({ is_active: false })
        .eq("parent_event_id", topParentId);

      if (e1 || e2)
        return {
          data: null,
          error: e1?.message ?? e2?.message ?? "Erro ao deletar",
        };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete",
      entityType: "event",
      entityId: eventId,
      metadata: { scope, name: current.name },
    }).catch(() => {});
    revalidateTag(tag.events(user.church_id), "default");
    return { data: { deleted: -1 }, error: null };
  },
  { module: "eventos", minRole: "líder" }
);

// ─── Types (associações) ──────────────────────────────────────────────────────

export interface EventMinistryRow {
  id: string;
  event_id: string;
  ministry_id: string;
  ministry: { id: string; name: string } | null;
}

export interface EventMusicGroupRow {
  id: string;
  event_id: string;
  music_group_id: string;
  music_group: { id: string; name: string } | null;
}

// ─── listEventMinistries ──────────────────────────────────────────────────────

export const listEventMinistries = withPermission(
  async (
    _user: AuthUser,
    eventId: string
  ): Promise<ActionResult<EventMinistryRow[]>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("event_ministries")
      .select("id, event_id, ministry_id, ministry:ministries(id, name)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) return { data: null, error: error.message };

    return { data: (data ?? []) as unknown as EventMinistryRow[], error: null };
  },
  { module: "eventos", minRole: "visitante" }
);

// ─── addEventMinistry ─────────────────────────────────────────────────────────

export const addEventMinistry = withPermission(
  async (
    user: AuthUser,
    eventId: string,
    ministryId: string
  ): Promise<ActionResult<EventMinistryRow>> => {
    const supabase = await createClient();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, name, church_id")
      .eq("id", eventId)
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .single();

    if (eventError || !event) {
      return { data: null, error: "Evento não encontrado" };
    }

    const { data: ministry, error: ministryError } = await supabase
      .from("ministries")
      .select(
        "id, name, leader_id, leader:members!ministries_leader_id_fkey(id, name)"
      )
      .eq("id", ministryId)
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .single();

    if (ministryError || !ministry) {
      return { data: null, error: "Ministério não encontrado" };
    }

    const { data: existing } = await supabase
      .from("event_ministries")
      .select("id")
      .eq("event_id", eventId)
      .eq("ministry_id", ministryId)
      .maybeSingle();

    if (existing) {
      return { data: null, error: "Ministério já associado a este evento" };
    }

    const { data: row, error: insertError } = await supabase
      .from("event_ministries")
      .insert({ event_id: eventId, ministry_id: ministryId })
      .select("id, event_id, ministry_id")
      .single();

    if (insertError || !row) {
      return { data: null, error: insertError?.message ?? "Erro ao associar" };
    }

    const leader = ministry.leader as unknown as {
      id: string;
      name: string;
    } | null;
    if (leader?.id && leader.id !== user.id) {
      await createNotification({
        memberId: leader.id,
        churchId: user.church_id,
        type: "ministerio_associado",
        message: `O ministério "${ministry.name}" foi associado ao evento "${event.name}".`,
      }).catch(() => {});
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create",
      entityType: "event_ministry",
      entityId: row.id,
      metadata: {
        eventId,
        ministryId,
        eventName: event.name,
        ministryName: ministry.name,
      },
    }).catch(() => {});

    return {
      data: {
        ...row,
        ministry: { id: ministry.id, name: ministry.name },
      } as EventMinistryRow,
      error: null,
    };
  },
  { module: "eventos", minRole: "líder" }
);

// ─── removeEventMinistry ──────────────────────────────────────────────────────

export const removeEventMinistry = withPermission(
  async (
    user: AuthUser,
    eventMinistryId: string
  ): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const { data: em, error: emError } = await supabase
      .from("event_ministries")
      .select("id, event_id, ministry_id")
      .eq("id", eventMinistryId)
      .single();

    if (emError || !em) {
      return { data: null, error: "Associação não encontrada" };
    }

    const { data: scales } = await supabase
      .from("scales")
      .select("id")
      .eq("event_ministry_id", eventMinistryId)
      .limit(1);

    if (scales && scales.length > 0) {
      return {
        data: null,
        error:
          "Remova os membros da escala antes de desvincular o ministério deste evento.",
      };
    }

    const { error: deleteError } = await supabase
      .from("event_ministries")
      .delete()
      .eq("id", eventMinistryId);

    if (deleteError) {
      return { data: null, error: deleteError.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete",
      entityType: "event_ministry",
      entityId: eventMinistryId,
      metadata: { eventId: em.event_id, ministryId: em.ministry_id },
    }).catch(() => {});

    return { data: { id: eventMinistryId }, error: null };
  },
  { module: "eventos", minRole: "líder" }
);

// ─── listEventMusicGroups ─────────────────────────────────────────────────────

export const listEventMusicGroups = withPermission(
  async (
    _user: AuthUser,
    eventId: string
  ): Promise<ActionResult<EventMusicGroupRow[]>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("event_music_groups")
      .select(
        "id, event_id, music_group_id, music_group:music_groups(id, name)"
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) return { data: null, error: error.message };

    return {
      data: (data ?? []) as unknown as EventMusicGroupRow[],
      error: null,
    };
  },
  { module: "eventos", minRole: "visitante" }
);

// ─── addEventMusicGroup ───────────────────────────────────────────────────────

export const addEventMusicGroup = withPermission(
  async (
    user: AuthUser,
    eventId: string,
    musicGroupId: string
  ): Promise<ActionResult<EventMusicGroupRow>> => {
    const supabase = await createClient();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, church_id")
      .eq("id", eventId)
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .single();

    if (eventError || !event) {
      return { data: null, error: "Evento não encontrado" };
    }

    const { data: group, error: groupError } = await supabase
      .from("music_groups")
      .select("id, name")
      .eq("id", musicGroupId)
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .single();

    if (groupError || !group) {
      return { data: null, error: "Grupo musical não encontrado" };
    }

    const { data: existing } = await supabase
      .from("event_music_groups")
      .select("id")
      .eq("event_id", eventId)
      .eq("music_group_id", musicGroupId)
      .maybeSingle();

    if (existing) {
      return { data: null, error: "Grupo musical já associado a este evento" };
    }

    const { data: row, error: insertError } = await supabase
      .from("event_music_groups")
      .insert({ event_id: eventId, music_group_id: musicGroupId })
      .select("id, event_id, music_group_id")
      .single();

    if (insertError || !row) {
      return { data: null, error: insertError?.message ?? "Erro ao associar" };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create",
      entityType: "event_music_group",
      entityId: row.id,
      metadata: { eventId, musicGroupId, groupName: group.name },
    }).catch(() => {});

    return {
      data: {
        ...row,
        music_group: { id: group.id, name: group.name },
      } as EventMusicGroupRow,
      error: null,
    };
  },
  { module: "eventos", minRole: "líder" }
);

// ─── removeEventMusicGroup ────────────────────────────────────────────────────

export const removeEventMusicGroup = withPermission(
  async (
    user: AuthUser,
    eventMusicGroupId: string
  ): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const { data: emg, error: emgError } = await supabase
      .from("event_music_groups")
      .select("id, event_id, music_group_id")
      .eq("id", eventMusicGroupId)
      .single();

    if (emgError || !emg) {
      return { data: null, error: "Associação não encontrada" };
    }

    const { error: deleteError } = await supabase
      .from("event_music_groups")
      .delete()
      .eq("id", eventMusicGroupId);

    if (deleteError) {
      return { data: null, error: deleteError.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete",
      entityType: "event_music_group",
      entityId: eventMusicGroupId,
      metadata: { eventId: emg.event_id, musicGroupId: emg.music_group_id },
    }).catch(() => {});

    return { data: { id: eventMusicGroupId }, error: null };
  },
  { module: "eventos", minRole: "líder" }
);
