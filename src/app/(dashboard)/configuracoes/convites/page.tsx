import { requireAuth } from "@/lib/auth/session";
import { getInviteLinks } from "@/actions/onboarding";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteLinksPanel } from "./invite-links-panel";

export default async function ConvitesPage() {
  const user = await requireAuth();
  const admin = createAdminClient();

  const [result, tenantResult] = await Promise.all([
    getInviteLinks(),
    admin.from("tenants").select("name").eq("id", user.church_id).maybeSingle(),
  ]);

  const links = result.success ? result.data : [];
  const churchName = tenantResult.data?.name ?? "";
  const isLeadership = [
    "pastor",
    "presbítero",
    "diácono",
    "líder",
    "admin",
  ].includes(user.role);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Links de convite
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Compartilhe um link para que pessoas entrem na sua comunidade.
        </p>
      </div>

      <InviteLinksPanel
        initialLinks={links}
        isLeadership={isLeadership}
        userEmail={user.email ?? ""}
        churchName={churchName}
      />
    </div>
  );
}
