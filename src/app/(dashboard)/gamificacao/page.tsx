import { requireAuth } from "@/lib/auth/session";
import { getLeaderboard } from "@/actions/gamification";
import { PageHeader } from "@/components/layout/PageHeader";
import { GamificationView } from "./gamification-view";
import type { LeaderboardData } from "@/lib/validators/gamification";

export const metadata = {
  title: "Gamificação | Koinos",
};

export default async function GamificacaoPage() {
  await requireAuth();

  const result = await getLeaderboard({ period: "monthly" });

  const initialData: LeaderboardData = ("data" in result
    ? result.data
    : undefined) ?? {
    teams: [],
    individuals: [],
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Gamificação"
        description="Placar das 12 Tribos de Israel: pontuação mensal e anual"
      />
      <GamificationView initialData={initialData} />
    </div>
  );
}
