import { z } from "zod";

export const getLeaderboardSchema = z.object({
  period: z.enum(["monthly", "annual"]).default("monthly"),
});

export const getGamificationAnalyticsSchema = z.object({
  period: z.enum(["month", "year"]).default("month"),
});

export type GetGamificationAnalyticsInput = z.infer<
  typeof getGamificationAnalyticsSchema
>;

export type GetLeaderboardInput = z.infer<typeof getLeaderboardSchema>;

// ─── Result types ─────────────────────────────────────────────────────────────

export interface TeamRankRow {
  team_id: string;
  team_name: string;
  team_color: string;
  total_points: number;
  member_count: number;
}

export interface IndividualRankRow {
  member_id: string;
  member_name: string;
  avatar_url: string | null;
  team_id: string;
  team_name: string;
  team_color: string;
  total_points: number;
}

export interface LeaderboardData {
  teams: TeamRankRow[];
  individuals: IndividualRankRow[];
}

// ─── Analytics types ──────────────────────────────────────────────────────────

export interface ActiveMemberRow {
  member_id: string;
  member_name: string;
  avatar_url: string | null;
  team_name: string | null;
  team_color: string | null;
  total_points: number;
}

export interface ActionDistributionRow {
  action_type: string;
  label: string;
  total_points: number;
  percentage: number;
}

export interface TeamParticipationRow {
  team_id: string;
  team_name: string;
  team_color: string;
  active_members: number;
  total_members: number;
  rate: number;
}

export interface MonthlyCheckinRow {
  month_label: string;
  month_key: string;
  count: number;
}

export interface GamificationAnalyticsData {
  totalPoints: number;
  activeMembers: number;
  topMembers: ActiveMemberRow[];
  actionDistribution: ActionDistributionRow[];
  teamParticipation: TeamParticipationRow[];
  monthlyCheckins: MonthlyCheckinRow[];
}
