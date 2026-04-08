"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import type { AuthUser } from "@/lib/auth/session";
import type { EventWithResponsible } from "@/actions/events";

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── listEventsInRange ────────────────────────────────────────────────────────
// Busca eventos ativos dentro de um intervalo de datas (para a agenda).
// Range otimizado: client envia apenas o intervalo visível (mês ou semana).

export const listEventsInRange = withPermission(
  async (
    _user: AuthUser,
    input: { dateFrom: string; dateTo: string }
  ): Promise<ActionResult<EventWithResponsible[]>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select(
        `*,
        responsible:members!events_responsible_id_fkey(id, name, avatar_url, role)`
      )
      .eq("is_active", true)
      .gte("date", input.dateFrom)
      .lte("date", input.dateTo)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as EventWithResponsible[], error: null };
  },
  { module: "agenda", minRole: "visitante" }
);
