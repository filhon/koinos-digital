import Link from "next/link";
import { BarChart2 } from "lucide-react";
import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getLeaderboard } from "@/actions/gamification";
import { PageHeader } from "@/components/layout/PageHeader";
import { GamificationView } from "./gamification-view";
import type { LeaderboardData } from "@/lib/validators/gamification";

export const metadata = {
  title: "Gamificação | Koinos",
};

const ANALYTICS_ROLES = ["admin", "pastor", "presbítero"] as const;

export default async function GamificacaoPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const canViewAnalytics = ANALYTICS_ROLES.includes(
    user.role as (typeof ANALYTICS_ROLES)[number]
  );

  const result = await getLeaderboard({ period: "monthly" });

  const initialData: LeaderboardData = ("data" in result
    ? result.data
    : undefined) ?? {
    teams: [],
    individuals: [],
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Gamificação"
          description="Placar das 12 Tribos de Israel: pontuação mensal e anual"
        />
        {canViewAnalytics && (
          <Link
            href="/dashboard/gamificacao/analytics"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          >
            <BarChart2 className="h-4 w-4" />
            Analytics
          </Link>
        )}
      </div>
      <GamificationView initialData={initialData} />
    </div>
  );
}
