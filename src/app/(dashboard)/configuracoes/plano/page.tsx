import { getSubscriptionStatus } from "@/actions/billing";
import { getUser } from "@/lib/auth/session";
import PlanPanel from "./plan-panel";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string };
}) {
  const user = await getUser();
  if (!user) return null;

  const subscription = await getSubscriptionStatus(
    user.parent_tenant_id || user.church_id
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-accent-900 dark:text-accent-100">
        Assinatura & Plano
      </h1>
      <p className="text-muted-foreground">
        Gerencie sua assinatura, visualize faturas e altere seu plano.
      </p>

      {searchParams.success && (
        <div className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 p-4 rounded-md">
          Assinatura realizada com sucesso! Obrigado por confiar no Koinos.
        </div>
      )}

      {searchParams.canceled && (
        <div className="bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 p-4 rounded-md">
          O processo de assinatura foi cancelado. Você ainda está no seu plano
          atual.
        </div>
      )}

      <PlanPanel
        churchId={user.parent_tenant_id || user.church_id}
        subscription={subscription}
      />
    </div>
  );
}
