"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as BarTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
  Legend,
} from "recharts";
import { Activity, Users } from "lucide-react";
import { toast } from "sonner";
import { getGamificationAnalytics } from "@/actions/gamification";
import type {
  GamificationAnalyticsData,
  ActionDistributionRow,
  TeamParticipationRow,
} from "@/lib/validators/gamification";
import { TribeBadge } from "../tribe-badge";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

// Hex approximations of the Koinos design system palette, for Recharts compatibility
const CHART_PRIMARY = "#1a5f7e"; // petroleum-dusk
const ACTION_COLORS: Record<string, string> = {
  checkin: "#1a5f7e",
  invite: "#3d9e6e",
  daily_read: "#c47c3c",
  streak_7: "#7c4dcc",
  streak_30: "#c4523a",
};

function getActionColor(actionType: string): string {
  return ACTION_COLORS[actionType] ?? "#6b7280";
}

// ─── Custom tooltip components ────────────────────────────────────────────────

function BarChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-foreground/60">
        {payload[0].value} {payload[0].value === 1 ? "check-in" : "check-ins"}
      </p>
    </div>
  );
}

function PieChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: ActionDistributionRow }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-foreground">{row.label}</p>
      <p className="text-foreground/60">
        {row.total_points.toLocaleString("pt-BR")} pts · {row.percentage}%
      </p>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
            {label}
          </p>
          <p className="mt-2 text-3xl font-medium tabular-nums tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1 text-xs text-foreground/40">{sub}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
      {title}
    </p>
  );
}

// ─── Team participation bar ───────────────────────────────────────────────────

function ParticipationBar({
  row,
  index,
}: {
  row: TeamParticipationRow;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3"
    >
      <div className="flex w-28 shrink-0 items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: row.team_color }}
        />
        <span className="truncate text-xs font-medium text-foreground/80">
          {row.team_name}
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-full bg-muted h-2">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: row.team_color }}
          initial={{ width: 0 }}
          animate={{ width: `${row.rate}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: index * 0.05 }}
        />
      </div>

      <span className="w-24 text-right text-xs tabular-nums text-foreground/60">
        {row.active_members}/{row.total_members} · {row.rate}%
      </span>
    </motion.div>
  );
}

// ─── Top member row ───────────────────────────────────────────────────────────

function TopMemberRow({
  member,
  rank,
}: {
  member: GamificationAnalyticsData["topMembers"][number];
  rank: number;
}) {
  const isTop3 = rank <= 3;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.04 }}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5",
        isTop3 ? "bg-muted/40" : "hover:bg-muted/30"
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          rank === 1 && "bg-yellow-400/15 text-yellow-600 dark:text-yellow-400",
          rank === 2 && "bg-zinc-300/30 text-zinc-600 dark:text-zinc-400",
          rank === 3 && "bg-orange-300/20 text-orange-700 dark:text-orange-400",
          rank > 3 && "text-foreground/35"
        )}
      >
        {rank}
      </span>

      <div className="relative h-8 w-8 shrink-0">
        {member.avatar_url ? (
          <Image
            src={member.avatar_url}
            alt={member.member_name}
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{
              backgroundColor: member.team_color ?? CHART_PRIMARY,
            }}
          >
            {member.member_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {member.member_name}
        </p>
        {member.team_name && member.team_color && (
          <TribeBadge
            teamName={member.team_name}
            teamColor={member.team_color}
          />
        )}
      </div>

      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: member.team_color ?? CHART_PRIMARY }}
      >
        {member.total_points.toLocaleString("pt-BR")}
        <span className="ml-0.5 text-[10px] font-normal text-foreground/40">
          pts
        </span>
      </span>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return <p className="py-6 text-center text-sm text-foreground/40">{label}</p>;
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface AnalyticsViewProps {
  initialData: GamificationAnalyticsData;
}

export function AnalyticsView({ initialData }: AnalyticsViewProps) {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [data, setData] = useState<GamificationAnalyticsData>(initialData);
  const [isPending, startTransition] = useTransition();

  function switchPeriod(next: "month" | "year") {
    if (next === period) return;
    setPeriod(next);
    startTransition(async () => {
      const result = await getGamificationAnalytics({ period: next });
      if ("data" in result && result.data) setData(result.data);
      else if ("error" in result)
        toast.error(result.error ?? "Erro ao carregar analytics.");
      else toast.error("Erro ao carregar analytics.");
    });
  }

  const periodLabel = period === "month" ? "este mês" : "este ano";

  const barData = data.monthlyCheckins.map((m) => ({
    name: m.month_label,
    "Check-ins": m.count,
  }));

  const pieData = data.actionDistribution.map((a) => ({
    name: a.label,
    value: a.total_points,
    ...a,
  }));

  return (
    <div className="space-y-8">
      {/* Period toggle */}
      <div className="flex items-center gap-2">
        {(["month", "year"] as const).map((p) => (
          <button
            key={p}
            onClick={() => switchPeriod(p)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              period === p
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-foreground/60 hover:text-foreground"
            )}
          >
            {p === "month" ? "Este mês" : "Este ano"}
          </button>
        ))}
        {isPending && (
          <span className="text-xs text-foreground/40 animate-pulse">
            Carregando…
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          {/* KPI cards */}
          <section className="grid grid-cols-2 gap-4">
            <KpiCard
              label="Pontos distribuídos"
              value={data.totalPoints.toLocaleString("pt-BR")}
              sub={periodLabel}
              icon={Activity}
            />
            <KpiCard
              label="Membros ativos"
              value={data.activeMembers.toLocaleString("pt-BR")}
              sub="ao menos 1 ação"
              icon={Users}
            />
          </section>

          {/* Charts */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Bar chart: check-ins por mês */}
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <SectionHeader title="Check-ins por mês" />
              <p className="mt-0.5 mb-4 text-[11px] text-foreground/40">
                últimos 6 meses
              </p>
              {barData.length === 0 ||
              barData.every((d) => d["Check-ins"] === 0) ? (
                <EmptyState label="Nenhum check-in registrado." />
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={barData}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.88 0.01 220 / 0.4)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "oklch(0.52 0.016 220)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "oklch(0.52 0.016 220)" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <BarTooltip
                      content={<BarChartTooltip />}
                      cursor={{ fill: "oklch(0.32 0.096 224 / 0.06)" }}
                    />
                    <Bar
                      dataKey="Check-ins"
                      fill={CHART_PRIMARY}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart: distribuição de pontos por tipo */}
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <SectionHeader title="Distribuição de pontos" />
              <p className="mt-0.5 mb-4 text-[11px] text-foreground/40">
                por tipo de ação · {periodLabel}
              </p>
              {pieData.length === 0 ? (
                <EmptyState label="Nenhum ponto registrado." />
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={getActionColor(entry.action_type)}
                        />
                      ))}
                    </Pie>
                    <PieTooltip content={<PieChartTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span
                          style={{
                            fontSize: 11,
                            color: "oklch(0.42 0.016 220)",
                          }}
                        >
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Top 10 members */}
          <section>
            <SectionHeader title="Top 10 membros" />
            <p className="mt-0.5 mb-4 text-[11px] text-foreground/40">
              por pontuação · {periodLabel}
            </p>
            {data.topMembers.length === 0 ? (
              <EmptyState label="Nenhum ponto registrado no período." />
            ) : (
              <div className="rounded-xl border border-border/60 bg-card p-2">
                <div className="space-y-0.5">
                  {data.topMembers.map((member, i) => (
                    <TopMemberRow
                      key={member.member_id}
                      member={member}
                      rank={i + 1}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Team participation */}
          <section>
            <SectionHeader title="Taxa de participação por tribo" />
            <p className="mt-0.5 mb-4 text-[11px] text-foreground/40">
              membros com ao menos 1 ponto · {periodLabel}
            </p>
            {data.teamParticipation.length === 0 ? (
              <EmptyState label="Nenhuma tribo encontrada." />
            ) : (
              <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3.5">
                {data.teamParticipation.map((row, i) => (
                  <ParticipationBar key={row.team_id} row={row} index={i} />
                ))}
              </div>
            )}
          </section>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
