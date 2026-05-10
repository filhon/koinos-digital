import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { OnboardingChecklist } from "@/components/layout/OnboardingTour";
import { checkAndUpdateProgress } from "@/actions/onboarding-progress";
import type {
  OnboardingProgressData,
  StepConditions,
} from "@/actions/onboarding-progress";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("members")
    .select("name, avatar_url, created_at")
    .eq("church_id", user.church_id)
    .eq("email", user.email ?? "")
    .maybeSingle();

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const createdAt = member?.created_at
    ? new Date(member.created_at as string).getTime()
    : now;
  const isRecentPastor =
    user.role === "pastor" && now - createdAt < THIRTY_DAYS_MS;

  // Only run the onboarding check for recent pastors
  let onboardingProgress: OnboardingProgressData | null = null;
  let stepConditions: StepConditions | null = null;
  if (isRecentPastor) {
    const result = await checkAndUpdateProgress();
    onboardingProgress = result.progress;
    stepConditions = result.conditions;
  }

  const showChecklist =
    isRecentPastor && onboardingProgress?.completed_at == null;

  return (
    <AppShell
      userEmail={user.email}
      userName={member?.name as string | undefined}
      userAvatar={member?.avatar_url as string | undefined}
    >
      {showChecklist && stepConditions && (
        <OnboardingChecklist
          initialProgress={onboardingProgress}
          conditions={stepConditions}
          memberId={user.id}
        />
      )}
      {children}
    </AppShell>
  );
}
