"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import type { AuthUser } from "@/lib/auth/session";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationRow {
  id: string;
  member_id: string;
  church_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── createNotification (helper interno) ─────────────────────────────────────
// Não é exposto como Server Action pública. Chamado internamente por actions
// que precisam notificar membros (ex: addEventMinistry).

export async function createNotification(opts: {
  memberId: string;
  churchId: string;
  type: string;
  message: string;
}): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    member_id: opts.memberId,
    church_id: opts.churchId,
    type: opts.type,
    message: opts.message,
  });
}

// ─── getNotifications ─────────────────────────────────────────────────────────

export const getNotifications = withPermission(
  async (
    user: AuthUser
  ): Promise<
    ActionResult<{ notifications: NotificationRow[]; unreadCount: number }>
  > => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("member_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return { data: null, error: error.message };

    const notifications = (data ?? []) as NotificationRow[];
    const unreadCount = notifications.filter((n) => !n.read).length;

    return { data: { notifications, unreadCount }, error: null };
  },
  { minRole: "visitante" }
);

// ─── markNotificationRead ─────────────────────────────────────────────────────

export const markNotificationRead = withPermission(
  async (
    user: AuthUser,
    notificationId: string
  ): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("member_id", user.id);

    if (error) return { data: null, error: error.message };

    return { data: { id: notificationId }, error: null };
  },
  { minRole: "visitante" }
);

// ─── markAllNotificationsRead ─────────────────────────────────────────────────

export const markAllNotificationsRead = withPermission(
  async (user: AuthUser): Promise<ActionResult<{ count: number }>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("member_id", user.id)
      .eq("read", false)
      .select("id");

    if (error) return { data: null, error: error.message };

    return { data: { count: (data ?? []).length }, error: null };
  },
  { minRole: "visitante" }
);
