import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { listAccounts } from "@/actions/financeiro";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountsPanel } from "./accounts-panel";

export default async function ContasPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const ALLOWED = ["admin", "pastor", "presbítero", "diácono", "tesoureiro"];
  if (!ALLOWED.includes(user.role)) redirect("/403");

  const canWrite = ["admin", "pastor", "tesoureiro"].includes(user.role);

  const result = await listAccounts();
  const accounts = result && "data" in result && result.data ? result.data : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Contas"
        description="Gerencie as contas bancárias e caixas da igreja"
        breadcrumbs={[
          { label: "Financeiro", href: "/financeiro" },
          { label: "Contas" },
        ]}
      />
      <AccountsPanel accounts={accounts} canWrite={canWrite} />
    </div>
  );
}
