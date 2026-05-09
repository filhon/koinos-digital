import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getGamificationAnalytics } from "@/actions/gamification";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumGate } from "@/components/ui/premium-gate";
import { AnalyticsView } from "./analytics-view";
import type { GamificationAnalyticsData } from "@/lib/validators/gamification";

export const metadata = {
  title: "Analytics da Liga | Koinos",
};

const ALLOWED_ROLES = ["admin", "pastor", "presbítero"] as const;

export default async function LigaAnalyticsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])) {
    redirect("/403");
  }

  const result = await getGamificationAnalytics({ period: "month" });

  const initialData: GamificationAnalyticsData = ("data" in result
    ? result.data
    : null) ?? {
    totalPoints: 0,
    activeMembers: 0,
    topMembers: [],
    actionDistribution: [],
    teamParticipation: [],
    monthlyCheckins: [],
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Analytics da Liga"
        description="Métricas de engajamento da congregação por período"
      />
      <PremiumGate feature="analytics_gamificacao">
        <AnalyticsView initialData={initialData} />
      </PremiumGate>
    </div>
  );
}
