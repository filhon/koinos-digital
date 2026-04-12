"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withPermission } from "@/lib/auth/with-permission";
import type { AuthUser } from "@/lib/auth/session";
import type {
  BadgeWithStatus,
  CheckBadgesResult,
} from "@/lib/validators/badges";
import type { SupabaseClient } from "@supabase/supabase-js";

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getMemberId(
  supabase: SupabaseClient,
  user: AuthUser
): Promise<string | null> {
  if (!user.email) return null;
  const { data } = await supabase
    .from("members")
    .select("id")
    .eq("church_id", user.church_id)
    .eq("email", user.email)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

// ─── getMyBadges ──────────────────────────────────────────────────────────────
// Retorna todos os badges com status de desbloqueio para o membro logado.

export const getMyBadges = withPermission(
  async (user: AuthUser): Promise<ActionResult<BadgeWithStatus[]>> => {
    const supabase = await createClient();

    // Todos os badges globais
    const { data: allBadges, error: badgesError } = await supabase
      .from("badges")
      .select(
        "id, name, description, icon, trigger_type, trigger_config, created_at"
      )
      .order("created_at", { ascending: true });

    if (badgesError) return { data: null, error: badgesError.message };

    const memberId = await getMemberId(supabase, user);

    const unlockedAt: Record<string, string> = {};

    if (memberId) {
      const { data: memberBadges } = await supabase
        .from("member_badges")
        .select("badge_id, unlocked_at")
        .eq("member_id", memberId);

      (memberBadges ?? []).forEach((mb: Record<string, unknown>) => {
        unlockedAt[mb.badge_id as string] = mb.unlocked_at as string;
      });
    }

    const badges: BadgeWithStatus[] = (allBadges ?? []).map(
      (b: Record<string, unknown>) => ({
        id: b.id as string,
        name: b.name as string,
        description: b.description as string,
        icon: b.icon as string,
        trigger_type: b.trigger_type as BadgeWithStatus["trigger_type"],
        trigger_config: (b.trigger_config as Record<string, unknown>) ?? {},
        unlocked: (b.id as string) in unlockedAt,
        unlocked_at: unlockedAt[b.id as string] ?? null,
      })
    );

    return { data: badges, error: null };
  },
  { minRole: "visitante" }
);

// ─── checkAndAwardBadges ──────────────────────────────────────────────────────
// Verifica todas as condições e concede badges ainda não desbloqueados.
// Retorna a lista de badges recém-desbloqueados nesta chamada.

export const checkAndAwardBadges = withPermission(
  async (user: AuthUser): Promise<ActionResult<CheckBadgesResult>> => {
    const supabase = await createClient();
    const memberId = await getMemberId(supabase, user);

    if (!memberId) {
      return { data: { awarded: [] }, error: null };
    }

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_and_award_badges", {
      p_member_id: memberId,
      p_church_id: user.church_id,
    });

    if (error) return { data: null, error: error.message };

    const result = data as { awarded: CheckBadgesResult["awarded"] };

    return {
      data: { awarded: result?.awarded ?? [] },
      error: null,
    };
  },
  { minRole: "visitante" }
);
