"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withPermission } from "@/lib/auth/with-permission";
import type { AuthUser } from "@/lib/auth/session";
import {
  getLeaderboardSchema,
  type GetLeaderboardInput,
  type LeaderboardData,
  type TeamRankRow,
  type IndividualRankRow,
} from "@/lib/validators/gamification";

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── getLeaderboard ───────────────────────────────────────────────────────────

export const getLeaderboard = withPermission(
  async (
    user: AuthUser,
    input: GetLeaderboardInput = { period: "monthly" }
  ): Promise<ActionResult<LeaderboardData>> => {
    const parsed = getLeaderboardSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { period } = parsed.data;
    const supabase = await createClient();

    const [teamsResult, individualsResult] = await Promise.all([
      supabase.rpc("get_team_leaderboard", {
        p_church_id: user.church_id,
        p_period: period,
      }),
      supabase.rpc("get_individual_leaderboard", {
        p_church_id: user.church_id,
        p_period: period,
      }),
    ]);

    if (teamsResult.error)
      return { data: null, error: teamsResult.error.message };
    if (individualsResult.error)
      return { data: null, error: individualsResult.error.message };

    const teams: TeamRankRow[] = (teamsResult.data ?? []).map(
      (row: Record<string, unknown>) => ({
        team_id: row.team_id as string,
        team_name: row.team_name as string,
        team_color: row.team_color as string,
        total_points: Number(row.total_points ?? 0),
        member_count: Number(row.member_count ?? 0),
      })
    );

    const individuals: IndividualRankRow[] = (individualsResult.data ?? []).map(
      (row: Record<string, unknown>) => ({
        member_id: row.member_id as string,
        member_name: row.member_name as string,
        avatar_url: (row.avatar_url as string | null) ?? null,
        team_id: row.team_id as string,
        team_name: row.team_name as string,
        team_color: row.team_color as string,
        total_points: Number(row.total_points ?? 0),
      })
    );

    return { data: { teams, individuals }, error: null };
  },
  { minRole: "visitante" }
);

// ─── getMyTeam ────────────────────────────────────────────────────────────────
// Retorna a equipe do membro logado (para exibir o badge em todo o app).

export const getMyTeam = withPermission(
  async (
    user: AuthUser
  ): Promise<
    ActionResult<{
      team_id: string;
      team_name: string;
      team_color: string;
    } | null>
  > => {
    const supabase = await createClient();

    if (!user.email) return { data: null, error: null };

    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("church_id", user.church_id)
      .eq("email", user.email)
      .maybeSingle();

    if (!member) return { data: null, error: null };

    const { data, error } = await supabase
      .from("member_teams")
      .select("team_id, teams(id, name, color)")
      .eq("member_id", member.id)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: null };

    const team = data.teams as unknown as {
      id: string;
      name: string;
      color: string;
    } | null;
    if (!team) return { data: null, error: null };

    return {
      data: {
        team_id: team.id,
        team_name: team.name,
        team_color: team.color,
      },
      error: null,
    };
  },
  { minRole: "visitante" }
);

// ─── awardInvitePoints ────────────────────────────────────────────────────────
// Chamada pelo onboarding quando um visitante se registra via link pessoal.
// Usamos admin client para chamar a função SECURITY DEFINER sem expor service role ao client.

export async function awardInvitePoints(
  inviterMemberId: string,
  churchId: string
): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("award_invite_points", {
    p_inviter_member_id: inviterMemberId,
    p_church_id: churchId,
  });
}
