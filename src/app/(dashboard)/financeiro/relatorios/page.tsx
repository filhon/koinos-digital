import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getFinancialReport, listAccounts } from "@/actions/financeiro";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumGate } from "@/components/ui/premium-gate";
import { ReportsView } from "./reports-view";
import type {
  FinancialReportInput,
  ReportPeriod,
} from "@/lib/validators/financeiro";

interface RelatoriosPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function RelatoriosPage({
  searchParams,
}: RelatoriosPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");

  const ALLOWED = ["admin", "pastor", "presbítero", "diácono", "tesoureiro"];
  if (!ALLOWED.includes(user.role)) redirect("/403");

  const canSeeContributors = ["admin", "pastor", "tesoureiro"].includes(
    user.role
  );

  const params = await searchParams;
  const period = (params.period as ReportPeriod) ?? "ano";

  const input: FinancialReportInput = {
    period,
    account_id: params.account_id || undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
  };

  const [reportResult, accountsResult] = await Promise.all([
    getFinancialReport(input),
    listAccounts(),
  ]);

  const report =
    reportResult && "data" in reportResult && reportResult.data
      ? reportResult.data
      : null;

  const accounts =
    accountsResult && "data" in accountsResult && accountsResult.data
      ? accountsResult.data
      : [];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <PageHeader
        title="Relatórios Financeiros"
        description="Análise avançada de receitas, despesas e contribuições"
        breadcrumbs={[
          { label: "Financeiro", href: "/financeiro" },
          { label: "Relatórios" },
        ]}
      />

      <PremiumGate feature="financeiro_avancado">
        <ReportsView
          report={report}
          accounts={accounts}
          currentInput={input}
          canSeeContributors={canSeeContributors}
        />
      </PremiumGate>
    </div>
  );
}
