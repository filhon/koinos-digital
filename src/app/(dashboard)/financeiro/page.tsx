import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import {
  getFinanceKPIs,
  listAccounts,
  getFinanceBreakdown,
} from "@/actions/financeiro";
import { PageHeader } from "@/components/layout/PageHeader";
import { FinanceKPICards } from "./finance-kpi-cards";
import { TransactionsPanel } from "./transactions-panel";
import { FinanceSkeleton } from "./finance-skeleton";
import { FinanceBreakdown } from "./finance-breakdown";
import type { ListTransactionsInput } from "@/lib/validators/financeiro";

interface FinanceiroPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function FinanceiroPage({
  searchParams,
}: FinanceiroPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");

  const ALLOWED_ROLES = [
    "admin",
    "pastor",
    "presbítero",
    "diácono",
    "tesoureiro",
  ];
  if (!ALLOWED_ROLES.includes(user.role)) redirect("/403");

  const canWrite = ["admin", "pastor", "tesoureiro"].includes(user.role);

  const params = await searchParams;
  const filters: ListTransactionsInput = {
    account_id: params.account_id,
    type: params.type as ListTransactionsInput["type"],
    category: params.category,
    date_from: params.date_from,
    date_to: params.date_to,
    page: params.page ? Number(params.page) : 1,
    limit: 20,
  };

  // Busca dados em paralelo; breakdown apenas para matriz
  const isMatrix = user.parent_tenant_id === null;

  const [kpisResult, accountsResult, breakdownResult] = await Promise.all([
    getFinanceKPIs(),
    listAccounts(),
    isMatrix ? getFinanceBreakdown() : Promise.resolve(null),
  ]);

  const kpis =
    kpisResult && "data" in kpisResult && kpisResult.data
      ? kpisResult.data
      : {
          total_balance: 0,
          annual_income: 0,
          annual_expenses: 0,
          net_annual: 0,
        };

  const accounts =
    accountsResult && "data" in accountsResult && accountsResult.data
      ? accountsResult.data
      : [];

  const breakdownUnits =
    breakdownResult &&
    "data" in breakdownResult &&
    breakdownResult.data &&
    breakdownResult.data.length > 1
      ? breakdownResult.data
      : [];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <PageHeader
        title="Financeiro"
        description="Gestão de contas e fluxo de caixa"
        breadcrumbs={[{ label: "Financeiro" }]}
      />

      {/* KPI Cards */}
      <FinanceKPICards kpis={kpis} />

      {/* Breakdown por unidade (apenas matriz com shared_finances) */}
      {breakdownUnits.length > 0 && <FinanceBreakdown units={breakdownUnits} />}

      {/* Transações */}
      <Suspense fallback={<FinanceSkeleton />}>
        <TransactionsPanel
          initialFilters={filters}
          accounts={accounts}
          canWrite={canWrite}
        />
      </Suspense>
    </div>
  );
}
