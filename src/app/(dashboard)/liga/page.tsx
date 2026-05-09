import Link from "next/link";
import { BarChart2 } from "lucide-react";
import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getLeaderboard, getMyProgress } from "@/actions/gamification";
import { PageHeader } from "@/components/layout/PageHeader";
import { GamificationView } from "./gamification-view";
import { MyProgressCard } from "./my-progress-card";
import type {
  LeaderboardData,
  MyProgressData,
} from "@/lib/validators/gamification";

export const metadata = {
  title: "Liga | Koinos",
};

const ANALYTICS_ROLES = ["admin", "pastor", "presbítero"] as const;

export default async function LigaPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const canViewAnalytics = ANALYTICS_ROLES.includes(
    user.role as (typeof ANALYTICS_ROLES)[number]
  );

  const [leaderboardResult, progressResult] = await Promise.all([
    getLeaderboard({ period: "monthly" }),
    getMyProgress(),
  ]);

  const initialData: LeaderboardData = ("data" in leaderboardResult
    ? leaderboardResult.data
    : undefined) ?? {
    teams: [],
    individuals: [],
  };

  const myProgress: MyProgressData =
    "data" in progressResult && progressResult.data
      ? progressResult.data
      : {
          myPoints: 0,
          myRank: null,
          actionBreakdown: [],
          currentStreak: 0,
          longestStreak: 0,
          badgeCount: 0,
        };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Liga"
          description="Placar das 12 Tribos de Israel: pontuação mensal e anual"
        />
        {canViewAnalytics && (
          <Link
            href="/dashboard/liga/analytics"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          >
            <BarChart2 className="h-4 w-4" />
            Analytics
          </Link>
        )}
      </div>
      <MyProgressCard data={myProgress} />
      <GamificationView initialData={initialData} />
    </div>
  );
}
