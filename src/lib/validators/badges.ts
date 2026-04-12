import { z } from "zod";

// ─── Badge (tabela global) ────────────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  trigger_type:
    | "first_checkin"
    | "invite_count"
    | "streak_days"
    | "tenure_days";
  trigger_config: Record<string, unknown>;
}

// ─── Badge com status de desbloqueio para o membro ───────────────────────────

export interface BadgeWithStatus extends Badge {
  unlocked: boolean;
  unlocked_at: string | null;
}

// ─── Resultado da função check_and_award_badges ───────────────────────────────

export interface AwardedBadge {
  badge_id: string;
  name: string;
  icon: string;
  description: string;
}

export const checkBadgesResultSchema = z.object({
  awarded: z.array(
    z.object({
      badge_id: z.string(),
      name: z.string(),
      icon: z.string(),
      description: z.string(),
    })
  ),
});

export type CheckBadgesResult = z.infer<typeof checkBadgesResultSchema>;
