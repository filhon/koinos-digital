"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
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
