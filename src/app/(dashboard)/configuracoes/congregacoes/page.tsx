import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { listCongregations } from "@/actions/congregacoes";
import { PageHeader } from "@/components/layout/PageHeader";
import { CongregacoesPanel } from "./congregacoes-panel";
import { PremiumGate } from "@/components/ui/premium-gate";

export const metadata = { title: "Congregações — Koinos" };

export default async function CongregacoesPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  // Apenas pastor da Igreja Matriz
  if (user.role !== "pastor" && user.role !== "admin") redirect("/403");
  if (user.parent_tenant_id !== null) redirect("/403");

  const result = await listCongregations();
  const congregations =
    result && !("code" in result) && result.data ? result.data : [];

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://app.koinos.digital";

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Congregações"
        description="Gerencie as congregações vinculadas à sua Igreja Matriz"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Configurações", href: "/configuracoes" },
          { label: "Congregações" },
        ]}
      />

      <PremiumGate feature="multi_congregacao">
        <div className="mt-6">
          <CongregacoesPanel initialData={congregations} appUrl={appUrl} />
        </div>
      </PremiumGate>
    </div>
  );
}
