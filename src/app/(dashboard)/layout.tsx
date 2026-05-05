import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { OnboardingTour } from "@/components/layout/OnboardingTour";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Verifica se o membro é novo (criado há menos de 7 dias)
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("members")
    .select("name, avatar_url, created_at")
    .eq("church_id", user.church_id)
    .eq("email", user.email ?? "")
    .maybeSingle();

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const isNew = member?.created_at
    ? now - new Date(member.created_at as string).getTime() <
      7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <AppShell
      userEmail={user.email}
      userName={member?.name as string | undefined}
      userAvatar={member?.avatar_url as string | undefined}
    >
      <OnboardingTour userRole={user.role} isNew={isNew} />
      {children}
    </AppShell>
  );
}
