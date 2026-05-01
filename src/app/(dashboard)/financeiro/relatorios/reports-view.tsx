"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  FileText,
  Users,
  Loader2,
  BarChart2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getTransactionsForExport } from "@/actions/financeiro";
import { formatCurrency } from "@/lib/utils/formatters";
import type {
  FinancialReport,
  FinancialReportInput,
  ReportPeriod,
  AccountRow,
} from "@/lib/validators/financeiro";

// ─── Paleta de cores alinhada com design system (warm editorial) ──────────────
const CHART_COLORS = {
  income: "#2a9d8f", // teal
  expenses: "#e76f51", // coral/copper
  net: "#e9c46a", // amber
};

const PIE_COLORS = [
  "#2a9d8f",
  "#e9c46a",
  "#264653",
  "#e76f51",
  "#f4a261",
  "#a8dadc",
  "#457b9d",
  "#1d3557",
  "#6d6875",
  "#b5838d",
];

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  mes_atual: "Mês atual",
  trimestre: "Trimestre",
  ano: "Ano atual",
  personalizado: "Personalizado",
};

// ─── Formatter monetário para tooltips do recharts ────────────────────────────
const formatTooltipValue = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomBarTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold">{formatTooltipValue(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-semibold capitalize text-muted-foreground">
        {payload[0].name}
      </p>
      <p className="text-sm font-bold">
        {formatTooltipValue(payload[0].value)}
      </p>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReportsViewProps {
  report: FinancialReport | null;
  accounts: AccountRow[];
  currentInput: FinancialReportInput;
  canSeeContributors: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportsView({
  report,
  accounts,
  currentInput,
  canSeeContributors,
}: ReportsViewProps) {
  const router = useRouter();
  const [isPdfPending, startPdfTransition] = useTransition();
  const [isCsvPending, startCsvTransition] = useTransition();
  const [period, setPeriod] = useState<ReportPeriod>(
    currentInput.period ?? "ano"
  );
  const [accountId, setAccountId] = useState<string>(
    currentInput.account_id ?? "all"
  );
  const [dateFrom, setDateFrom] = useState(currentInput.date_from ?? "");
  const [dateTo, setDateTo] = useState(currentInput.date_to ?? "");

  // ── Apply filters ────────────────────────────────────────────────────────────
  function applyFilters() {
    const params = new URLSearchParams();
    params.set("period", period);
    if (accountId && accountId !== "all") params.set("account_id", accountId);
    if (period === "personalizado") {
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
    }
    router.push(`/financeiro/relatorios?${params.toString()}`);
  }

  // ── CSV export ───────────────────────────────────────────────────────────────
  function handleCsvExport() {
    startCsvTransition(async () => {
      const result = await getTransactionsForExport({
        period,
        account_id: accountId !== "all" ? accountId : undefined,
        date_from:
          period === "personalizado" ? dateFrom || undefined : undefined,
        date_to: period === "personalizado" ? dateTo || undefined : undefined,
      });

      if (!result || !("data" in result) || !result.data) return;

      const header = [
        "Data",
        "Tipo",
        "Categoria",
        "Descrição",
        "Conta",
        "Membro",
        "Valor (R$)",
        "Notas",
        "Estorno de",
      ].join(";");

      const rows = result.data.map((t) =>
        [
          t.date,
          t.type,
          t.category,
          `"${t.description.replace(/"/g, '""')}"`,
          t.account_name,
          t.member_name ?? "",
          t.value.toFixed(2).replace(".", ","),
          t.notes ? `"${t.notes.replace(/"/g, '""')}"` : "",
          t.reversal_of ?? "",
        ].join(";")
      );

      const csv = [header, ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-financeiro-${period}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ── PDF export ───────────────────────────────────────────────────────────────
  function handlePdfExport() {
    startPdfTransition(async () => {
      const params = new URLSearchParams({ period });
      if (accountId && accountId !== "all") params.set("account_id", accountId);
      if (period === "personalizado") {
        if (dateFrom) params.set("date_from", dateFrom);
        if (dateTo) params.set("date_to", dateTo);
      }

      const res = await fetch(
        `/api/financeiro/report-pdf?${params.toString()}`
      );
      if (!res.ok) return;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-financeiro-${period}-${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ── KPI Summary ──────────────────────────────────────────────────────────────
  const totals = report?.totals ?? { income: 0, expenses: 0, net: 0 };

  const kpis = [
    {
      label: "Total de Entradas",
      value: totals.income,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total de Saídas",
      value: totals.expenses,
      icon: TrendingDown,
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
    {
      label: "Saldo do Período",
      value: totals.net,
      icon: Wallet,
      color: totals.net >= 0 ? "text-primary" : "text-red-400",
      bg: totals.net >= 0 ? "bg-primary/10" : "bg-red-400/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-4">
            {/* Período */}
            <div className="min-w-40 flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Período</Label>
              <Select
                value={period}
                onValueChange={(v: string | null) => {
                  if (v) setPeriod(v as ReportPeriod);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "mes_atual",
                      "trimestre",
                      "ano",
                      "personalizado",
                    ] as ReportPeriod[]
                  ).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PERIOD_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conta */}
            <div className="min-w-45 flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Conta</Label>
              <Select
                value={accountId}
                onValueChange={(v: string | null) => {
                  if (v) setAccountId(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as contas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as contas</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Datas personalizadas */}
            {period === "personalizado" && (
              <>
                <div className="min-w-35 flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">De</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="min-w-35 flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Até</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </>
            )}

            <Button onClick={applyFilters} className="shrink-0">
              Aplicar
            </Button>

            {/* Export buttons */}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCsvExport}
                disabled={isCsvPending}
                className="gap-1.5"
              >
                {isCsvPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Exportar CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePdfExport}
                disabled={isPdfPending}
                className="gap-1.5"
              >
                {isPdfPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                Exportar PDF
              </Button>
            </div>
          </div>

          {report && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-normal">
                {PERIOD_LABELS[period]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {report.date_from} → {report.date_to}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p
                      className={`mt-1 text-2xl font-bold tabular-nums ${kpi.color}`}
                    >
                      {formatCurrency(kpi.value)}
                    </p>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg}`}
                  >
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Bar Chart: Receitas vs Despesas por mês ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart2 className="h-4 w-4 text-primary" />
              Receitas vs Despesas por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!report?.monthly_data?.length ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={report.monthly_data}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    strokeOpacity={0.08}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                    }
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                    formatter={(value) =>
                      value === "income" ? "Receitas" : "Despesas"
                    }
                  />
                  <Bar
                    dataKey="income"
                    name="income"
                    fill={CHART_COLORS.income}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name="expenses"
                    fill={CHART_COLORS.expenses}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Pie Charts ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <PieChartCard
            title="Receitas por Categoria"
            data={report?.income_by_category ?? []}
            total={totals.income}
            colorSet={PIE_COLORS}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
        >
          <PieChartCard
            title="Despesas por Categoria"
            data={report?.expenses_by_category ?? []}
            total={totals.expenses}
            colorSet={PIE_COLORS.slice(3)}
          />
        </motion.div>
      </div>

      {/* ── Top Contribuintes ────────────────────────────────────────────────── */}
      {canSeeContributors && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Users className="h-4 w-4 text-primary" />
                Top 10 Contribuintes
                <Badge
                  variant="secondary"
                  className="ml-auto text-xs font-normal"
                >
                  Tesoureiro / Pastor
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!report?.top_contributors?.length ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma contribuição identificada no período.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="pb-2 text-left font-medium text-muted-foreground">
                          #
                        </th>
                        <th className="pb-2 text-left font-medium text-muted-foreground">
                          Membro
                        </th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">
                          Total
                        </th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">
                          % do total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.top_contributors.map((c, idx) => {
                        const pct =
                          totals.income > 0
                            ? ((c.total / totals.income) * 100).toFixed(1)
                            : "0.0";
                        return (
                          <tr
                            key={c.member_id}
                            className="border-b border-border/30 transition-colors last:border-0 hover:bg-muted/30"
                          >
                            <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 font-medium">
                              {c.member_name}
                            </td>
                            <td className="py-2.5 text-right tabular-nums font-semibold text-emerald-500">
                              {formatCurrency(c.total)}
                            </td>
                            <td className="py-2.5 pl-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-10 text-xs text-muted-foreground">
                                  {pct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ─── PieChartCard ─────────────────────────────────────────────────────────────

function PieChartCard({
  title,
  data,
  total,
  colorSet,
}: {
  title: string;
  data: { category: string; value: number }[];
  total: number;
  colorSet: string[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!data.length ? (
          <EmptyChart />
        ) : (
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="category"
                >
                  {data.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={colorSet[idx % colorSet.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legenda */}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {data.slice(0, 6).map((d, idx) => {
                const pct =
                  total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
                return (
                  <div
                    key={d.category}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: colorSet[idx % colorSet.length] }}
                    />
                    <span className="flex-1 truncate capitalize text-muted-foreground">
                      {d.category}
                    </span>
                    <span className="shrink-0 font-medium">{pct}%</span>
                  </div>
                );
              })}
              {data.length > 6 && (
                <p className="text-xs text-muted-foreground">
                  +{data.length - 6} outras categorias
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── EmptyChart ───────────────────────────────────────────────────────────────

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
      <BarChart2 className="h-8 w-8 opacity-30" />
      <p className="text-sm">Sem dados para o período selecionado.</p>
    </div>
  );
}
