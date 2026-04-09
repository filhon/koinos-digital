"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import {
  createResourceSchema,
  updateResourceSchema,
  listResourcesSchema,
  allocateResourceSchema,
  deallocateResourceSchema,
  type CreateResourceInput,
  type UpdateResourceInput,
  type ListResourcesInput,
  type AllocateResourceInput,
  type DeallocateResourceInput,
} from "@/lib/validators/resources";
import type { AuthUser } from "@/lib/auth/session";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResourceRow {
  id: string;
  church_id: string;
  name: string;
  responsible_id: string | null;
  status: "disponível" | "indisponível";
  value: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceWithResponsible extends ResourceRow {
  responsible: {
    id: string;
    name: string;
    avatar_url: string | null;
    role: string;
  } | null;
}

export interface ListResourcesResult {
  resources: ResourceWithResponsible[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EventResourceRow {
  id: string;
  event_id: string;
  resource_id: string;
  created_at: string;
  event: {
    id: string;
    name: string;
    date: string;
    start_time: string;
    end_time: string | null;
    modality: "presencial" | "online";
    location: string | null;
    meeting_link: string | null;
  } | null;
  resource?: {
    id: string;
    name: string;
    status: "disponível" | "indisponível";
    responsible: { name: string } | null;
  } | null;
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── listResources ────────────────────────────────────────────────────────────

export const listResources = withPermission(
  async (
    _user: AuthUser,
    input: ListResourcesInput = {}
  ): Promise<ActionResult<ListResourcesResult>> => {
    const parsed = listResourcesSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { status, search, page, pageSize } = parsed.data;
    const supabase = await createClient();
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("resources")
      .select(
        `
        *,
        responsible:members!resources_responsible_id_fkey(id, name, avatar_url, role)
        `,
        { count: "exact" }
      )
      .eq("is_active", true)
      .order("name", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (search?.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        resources: (data ?? []) as ResourceWithResponsible[],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
      error: null,
    };
  },
  { module: "recursos", minRole: "líder" }
);

// ─── getResourceById ──────────────────────────────────────────────────────────

export const getResourceById = withPermission(
  async (
    _user: AuthUser,
    resourceId: string
  ): Promise<ActionResult<ResourceWithResponsible>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("resources")
      .select(
        `
        *,
        responsible:members!resources_responsible_id_fkey(id, name, avatar_url, role)
        `
      )
      .eq("id", resourceId)
      .eq("is_active", true)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ResourceWithResponsible, error: null };
  },
  { module: "recursos", minRole: "líder" }
);

// ─── createResource ───────────────────────────────────────────────────────────

export const createResource = withPermission(
  async (
    user: AuthUser,
    input: CreateResourceInput
  ): Promise<ActionResult<ResourceRow>> => {
    const parsed = createResourceSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("resources")
      .insert({
        church_id: user.church_id,
        name: parsed.data.name,
        responsible_id: parsed.data.responsible_id ?? null,
        value: parsed.data.value ?? null,
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
      entityType: "resource",
      entityId: row.id,
      metadata: { name: row.name },
    }).catch(() => {});

    return { data: row as ResourceRow, error: null };
  },
  { module: "recursos", minRole: "diácono" }
);

// ─── updateResource ───────────────────────────────────────────────────────────

export const updateResource = withPermission(
  async (
    user: AuthUser,
    resourceId: string,
    input: UpdateResourceInput
  ): Promise<ActionResult<ResourceRow>> => {
    const parsed = updateResourceSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from("resources")
      .select("id, name")
      .eq("id", resourceId)
      .eq("is_active", true)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: "Recurso não encontrado" };
    }

    const { data: row, error } = await supabase
      .from("resources")
      .update({
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        responsible_id: parsed.data.responsible_id ?? null,
        value: parsed.data.value ?? null,
      })
      .eq("id", resourceId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "update",
      entityType: "resource",
      entityId: resourceId,
      metadata: { fields: Object.keys(parsed.data) },
    }).catch(() => {});

    return { data: row as ResourceRow, error: null };
  },
  { module: "recursos", minRole: "diácono" }
);

// ─── deleteResource (soft-delete) ────────────────────────────────────────────

export const deleteResource = withPermission(
  async (
    user: AuthUser,
    resourceId: string
  ): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from("resources")
      .select("id, name")
      .eq("id", resourceId)
      .eq("is_active", true)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: "Recurso não encontrado" };
    }

    const { error } = await supabase
      .from("resources")
      .update({ is_active: false })
      .eq("id", resourceId);

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete",
      entityType: "resource",
      entityId: resourceId,
      metadata: { name: existing.name },
    }).catch(() => {});

    return { data: { id: resourceId }, error: null };
  },
  { module: "recursos", minRole: "diácono" }
);

// ─── listEventResources ───────────────────────────────────────────────────────

export const listEventResources = withPermission(
  async (
    _user: AuthUser,
    eventId: string
  ): Promise<ActionResult<EventResourceRow[]>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("event_resources")
      .select(
        `
        *,
        event:events!event_resources_event_id_fkey(
          id, name, date, start_time, end_time, modality, location, meeting_link
        ),
        resource:resources!event_resources_resource_id_fkey(
          id, name, status,
          responsible:members!resources_responsible_id_fkey(name)
        )
        `
      )
      .eq("event_id", eventId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as EventResourceRow[], error: null };
  },
  { module: "recursos", minRole: "líder" }
);

// ─── listResourceEvents ───────────────────────────────────────────────────────

export const listResourceEvents = withPermission(
  async (
    _user: AuthUser,
    resourceId: string
  ): Promise<ActionResult<EventResourceRow[]>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("event_resources")
      .select(
        `
        *,
        event:events!event_resources_event_id_fkey(
          id, name, date, start_time, end_time, modality, location, meeting_link
        )
        `
      )
      .eq("resource_id", resourceId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as EventResourceRow[], error: null };
  },
  { module: "recursos", minRole: "líder" }
);

// ─── allocateResource ─────────────────────────────────────────────────────────

export const allocateResource = withPermission(
  async (
    user: AuthUser,
    input: AllocateResourceInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = allocateResourceSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { resourceId, eventId } = parsed.data;
    const supabase = await createClient();

    // Verificar que o recurso existe e está disponível
    const { data: resource, error: resError } = await supabase
      .from("resources")
      .select("id, name, status")
      .eq("id", resourceId)
      .eq("is_active", true)
      .single();

    if (resError || !resource) {
      return { data: null, error: "Recurso não encontrado" };
    }

    // Verificar que o evento existe e buscar data/horário para checar conflito
    const { data: event, error: evtError } = await supabase
      .from("events")
      .select("id, name, date, start_time, end_time")
      .eq("id", eventId)
      .eq("is_active", true)
      .single();

    if (evtError || !event) {
      return { data: null, error: "Evento não encontrado" };
    }

    // Checar duplicata
    const { data: existing } = await supabase
      .from("event_resources")
      .select("id")
      .eq("resource_id", resourceId)
      .eq("event_id", eventId)
      .maybeSingle();

    if (existing) {
      return { data: null, error: "Recurso já está alocado a este evento" };
    }

    // Checar conflito de horário: mesmo recurso em evento diferente no mesmo dia com overlap de horário
    const { data: conflictingAllocations } = await supabase
      .from("event_resources")
      .select(
        `
        id,
        event:events!event_resources_event_id_fkey(
          id, name, date, start_time, end_time
        )
        `
      )
      .eq("resource_id", resourceId);

    if (conflictingAllocations) {
      for (const allocation of conflictingAllocations) {
        const evRaw = Array.isArray(allocation.event)
          ? allocation.event[0]
          : allocation.event;
        const ev = evRaw as {
          id: string;
          name: string;
          date: string;
          start_time: string;
          end_time: string | null;
        } | null;
        if (!ev || ev.date !== event.date) continue;

        // Verificar overlap de horário
        const evEnd = ev.end_time ?? "23:59:59";
        const newEnd = event.end_time ?? "23:59:59";

        const overlaps = ev.start_time < newEnd && event.start_time < evEnd;
        if (overlaps) {
          return {
            data: null,
            error: `Conflito: recurso já está alocado ao evento "${ev.name}" no mesmo horário`,
          };
        }
      }
    }

    // Inserir alocação
    const { data: row, error } = await supabase
      .from("event_resources")
      .insert({ resource_id: resourceId, event_id: eventId })
      .select("id")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create",
      entityType: "event_resource",
      entityId: row.id,
      metadata: {
        resourceId,
        eventId,
        resourceName: resource.name,
        eventName: event.name,
      },
    }).catch(() => {});

    return { data: { id: row.id }, error: null };
  },
  { module: "recursos", minRole: "diácono" }
);

// ─── deallocateResource ───────────────────────────────────────────────────────

export const deallocateResource = withPermission(
  async (
    user: AuthUser,
    input: DeallocateResourceInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = deallocateResourceSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { resourceId, eventId } = parsed.data;
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from("event_resources")
      .select("id")
      .eq("resource_id", resourceId)
      .eq("event_id", eventId)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: "Alocação não encontrada" };
    }

    const { error } = await supabase
      .from("event_resources")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return { data: null, error: error.message };
    }

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete",
      entityType: "event_resource",
      entityId: existing.id,
      metadata: { resourceId, eventId },
    }).catch(() => {});

    return { data: { id: existing.id }, error: null };
  },
  { module: "recursos", minRole: "diácono" }
);
