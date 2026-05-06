"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withPermission } from "@/lib/auth/with-permission";
import type { AuthUser } from "@/lib/auth/session";
import {
  getLeaderboardSchema,
  getGamificationAnalyticsSchema,
  type GetLeaderboardInput,
  type LeaderboardData,
  type TeamRankRow,
  type IndividualRankRow,
  type GetGamificationAnalyticsInput,
  type GamificationAnalyticsData,
  type ActiveMemberRow,
  type ActionDistributionRow,
  type TeamParticipationRow,
  type MonthlyCheckinRow,
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

// ─── getGamificationAnalytics ─────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  checkin: "Check-in",
  invite: "Convite",
  daily_read: "Leitura Diária",
  streak_7: "Sequência 7 dias",
  streak_30: "Sequência 30 dias",
};

const PT_MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const getGamificationAnalytics = withPermission(
  async (
    user: AuthUser,
    input: GetGamificationAnalyticsInput = { period: "month" }
  ): Promise<ActionResult<GamificationAnalyticsData>> => {
    const parsed = getGamificationAnalyticsSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { period } = parsed.data;
    const supabase = await createClient();

    const now = new Date();
    const startDate =
      period === "month"
        ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
        : new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

    // Window for check-in chart: always last 6 calendar months
    const checkinStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)
    );

    const [eventsResult, teamsResult, checkinEventsResult] = await Promise.all([
      supabase
        .from("score_events")
        .select("member_id, team_id, points, action_type")
        .eq("church_id", user.church_id)
        .gte("created_at", startDate.toISOString()),
      supabase
        .from("teams")
        .select("id, name, color, member_teams(member_id)")
        .eq("church_id", user.church_id),
      supabase
        .from("score_events")
        .select("created_at")
        .eq("church_id", user.church_id)
        .eq("action_type", "checkin")
        .gte("created_at", checkinStart.toISOString()),
    ]);

    if (eventsResult.error)
      return { data: null, error: eventsResult.error.message };
    if (teamsResult.error)
      return { data: null, error: teamsResult.error.message };

    const events = eventsResult.data ?? [];
    const teams = teamsResult.data ?? [];
    const checkinEvents = checkinEventsResult.data ?? [];

    // ── Total points + active members ──────────────────────────────────────
    const totalPoints = events.reduce((sum, e) => sum + (e.points ?? 0), 0);
    const activeMemberIds = new Set(
      events.map((e) => e.member_id).filter(Boolean)
    );
    const activeMembers = activeMemberIds.size;

    // ── Top 10 members by points ───────────────────────────────────────────
    const memberPointsMap = new Map<string, number>();
    for (const e of events) {
      if (!e.member_id) continue;
      memberPointsMap.set(
        e.member_id,
        (memberPointsMap.get(e.member_id) ?? 0) + (e.points ?? 0)
      );
    }
    const top10Ids = Array.from(memberPointsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    // ── Action distribution ────────────────────────────────────────────────
    const actionPointsMap = new Map<string, number>();
    for (const e of events) {
      if (!e.action_type) continue;
      actionPointsMap.set(
        e.action_type,
        (actionPointsMap.get(e.action_type) ?? 0) + (e.points ?? 0)
      );
    }
    const actionTotal = Array.from(actionPointsMap.values()).reduce(
      (s, v) => s + v,
      0
    );
    const actionDistribution: ActionDistributionRow[] = Array.from(
      actionPointsMap.entries()
    )
      .sort((a, b) => b[1] - a[1])
      .map(([type, pts]) => ({
        action_type: type,
        label: ACTION_LABELS[type] ?? type,
        total_points: pts,
        percentage: actionTotal > 0 ? Math.round((pts / actionTotal) * 100) : 0,
      }));

    // ── Monthly check-ins (last 6 months) ─────────────────────────────────
    const monthCountMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
      );
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      monthCountMap.set(key, 0);
    }
    for (const e of checkinEvents) {
      if (!e.created_at) continue;
      const d = new Date(e.created_at);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (monthCountMap.has(key)) {
        monthCountMap.set(key, (monthCountMap.get(key) ?? 0) + 1);
      }
    }
    const monthlyCheckins: MonthlyCheckinRow[] = Array.from(
      monthCountMap.entries()
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => {
        const monthIdx = parseInt(key.split("-")[1]) - 1;
        return { month_label: PT_MONTHS[monthIdx], month_key: key, count };
      });

    // ── Team participation ─────────────────────────────────────────────────
    const activeByTeam = new Map<string, Set<string>>();
    for (const e of events) {
      if (!e.team_id || !e.member_id) continue;
      if (!activeByTeam.has(e.team_id)) activeByTeam.set(e.team_id, new Set());
      activeByTeam.get(e.team_id)!.add(e.member_id);
    }
    const teamParticipation: TeamParticipationRow[] = teams
      .map((team) => {
        const memberTeams = Array.isArray(team.member_teams)
          ? (team.member_teams as { member_id: string }[])
          : [];
        const totalMembersCount = memberTeams.length;
        const activeSet = activeByTeam.get(team.id) ?? new Set<string>();
        return {
          team_id: team.id,
          team_name: team.name,
          team_color: (team as { color?: string }).color ?? "#6b7280",
          active_members: activeSet.size,
          total_members: totalMembersCount,
          rate:
            totalMembersCount > 0
              ? Math.round((activeSet.size / totalMembersCount) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.rate - a.rate);

    // ── Top 10 member details ──────────────────────────────────────────────
    let topMembers: ActiveMemberRow[] = [];
    if (top10Ids.length > 0) {
      const [membersResult, teamMappingResult] = await Promise.all([
        supabase
          .from("members")
          .select("id, name, avatar_url")
          .in("id", top10Ids),
        supabase
          .from("member_teams")
          .select("member_id, teams(id, name, color)")
          .in("member_id", top10Ids),
      ]);

      const memberMap = new Map(
        (membersResult.data ?? []).map((m) => [m.id, m])
      );
      const memberTeamMap = new Map<string, { name: string; color: string }>();
      for (const mt of teamMappingResult.data ?? []) {
        const t = (Array.isArray(mt.teams) ? mt.teams[0] : mt.teams) as {
          id: string;
          name: string;
          color: string;
        } | null;
        if (t && mt.member_id)
          memberTeamMap.set(mt.member_id as string, {
            name: t.name,
            color: t.color,
          });
      }

      topMembers = top10Ids
        .map((id) => {
          const m = memberMap.get(id);
          if (!m) return null;
          const t = memberTeamMap.get(id);
          return {
            member_id: id,
            member_name: m.name,
            avatar_url: m.avatar_url ?? null,
            team_name: t?.name ?? null,
            team_color: t?.color ?? null,
            total_points: memberPointsMap.get(id) ?? 0,
          };
        })
        .filter((m): m is ActiveMemberRow => m !== null);
    }

    return {
      data: {
        totalPoints,
        activeMembers,
        topMembers,
        actionDistribution,
        teamParticipation,
        monthlyCheckins,
      },
      error: null,
    };
  },
  { minRole: "presbítero" }
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
