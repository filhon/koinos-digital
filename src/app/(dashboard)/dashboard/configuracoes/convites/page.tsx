import { requireAuth } from "@/lib/auth/session";
import { getInviteLinks } from "@/actions/onboarding";
import { InviteLinksPanel } from "./invite-links-panel";

export default async function ConvitesPage() {
  const user = await requireAuth();
  const result = await getInviteLinks();

  const links = result.success ? result.data : [];
  const isLeadership = ["pastor", "presbítero", "diácono", "líder", "admin"].includes(
    user.role
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
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
      />
    </div>
  );
}
