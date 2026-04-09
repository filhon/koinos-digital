"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import { createNotification } from "@/actions/notifications";
import {
  createEventSchema,
  updateEventSchema,
  listEventsSchema,
  type CreateEventInput,
  type UpdateEventInput,
  type ListEventsInput,
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
    _user: AuthUser,
    input: ListEventsInput = {}
  ): Promise<ActionResult<ListEventsResult>> => {
    const parsed = listEventsSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { modality, upcoming, page, pageSize } = parsed.data;
    const supabase = await createClient();
    const offset = (page - 1) * pageSize;
    const today = new Date().toISOString().split("T")[0];

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

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create",
      entityType: "event",
      entityId: row.id,
      metadata: { name: row.name, modality: row.modality, date: row.date },
    }).catch(() => {});

    return { data: row as EventRow, error: null };
  },
  { module: "eventos", minRole: "líder" }
);

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

    // Verificar que o evento pertence ao church_id do usuário
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

    return { data: row as EventRow, error: null };
  },
  { module: "eventos", minRole: "líder" }
);

// ─── deleteEvent (soft-delete) ────────────────────────────────────────────────

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

    return { data: { id: eventId }, error: null };
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

    // Verificar que o evento existe e pertence à igreja
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

    // Verificar que o ministério existe e pertence à igreja
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

    // Verificar duplicata
    const { data: existing } = await supabase
      .from("event_ministries")
      .select("id")
      .eq("event_id", eventId)
      .eq("ministry_id", ministryId)
      .maybeSingle();

    if (existing) {
      return { data: null, error: "Ministério já associado a este evento" };
    }

    // Inserir associação
    const { data: row, error: insertError } = await supabase
      .from("event_ministries")
      .insert({ event_id: eventId, ministry_id: ministryId })
      .select("id, event_id, ministry_id")
      .single();

    if (insertError || !row) {
      return { data: null, error: insertError?.message ?? "Erro ao associar" };
    }

    // Notificar líder do ministério
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

    // Verificar que a associação existe
    const { data: em, error: emError } = await supabase
      .from("event_ministries")
      .select("id, event_id, ministry_id")
      .eq("id", eventMinistryId)
      .single();

    if (emError || !em) {
      return { data: null, error: "Associação não encontrada" };
    }

    // Verificar se a escala tem membros atribuídos
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

    // Remover associação
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

    // Verificar que o evento existe
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

    // Verificar que o grupo existe e pertence à igreja
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

    // Verificar duplicata
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
