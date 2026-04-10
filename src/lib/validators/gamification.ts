import { z } from "zod";

export const getLeaderboardSchema = z.object({
  period: z.enum(["monthly", "annual"]).default("monthly"),
});

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
