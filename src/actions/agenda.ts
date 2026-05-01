"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withPermission } from "@/lib/auth/with-permission";
import type { AuthUser } from "@/lib/auth/session";
import type { EventWithResponsible } from "@/actions/events";

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── listEventsInRange ────────────────────────────────────────────────────────
// Busca eventos ativos dentro de um intervalo de datas (para a agenda).
// all_units: true → inclui eventos de todas as congregações (matriz pastor only).

export const listEventsInRange = withPermission(
  async (
    user: AuthUser,
    input: { dateFrom: string; dateTo: string; all_units?: boolean }
  ): Promise<ActionResult<EventWithResponsible[]>> => {
    const SELECT = `*,
      responsible:members!events_responsible_id_fkey(id, name, avatar_url, role)`;

    // Cross-congregation mode: matriz pastor quer ver todos os eventos
    if (input.all_units && user.parent_tenant_id === null) {
      const admin = createAdminClient();

      const { data: children } = await admin
        .from("tenants")
        .select("id")
        .eq("parent_tenant_id", user.church_id)
        .eq("is_active", true);

      const churchIds = [user.church_id, ...(children ?? []).map((c) => c.id)];

      const { data, error } = await admin
        .from("events")
        .select(SELECT)
        .eq("is_active", true)
        .in("church_id", churchIds)
        .gte("date", input.dateFrom)
        .lte("date", input.dateTo)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) return { data: null, error: error.message };
      return { data: (data ?? []) as EventWithResponsible[], error: null };
    }

    // Default: apenas eventos da própria church (RLS em vigor)
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select(SELECT)
      .eq("is_active", true)
      .gte("date", input.dateFrom)
      .lte("date", input.dateTo)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data: (data ?? []) as EventWithResponsible[], error: null };
  },
  { module: "agenda", minRole: "visitante" }
);
