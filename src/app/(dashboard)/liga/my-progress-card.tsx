"use client";

import { motion } from "framer-motion";
import { Flame, BookOpen, QrCode, UserPlus, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MyProgressData } from "@/lib/validators/gamification";

// ─── Static activity catalogue ────────────────────────────────────────────────

const PT_MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

interface ActivityDef {
  type: string;
  label: string;
  hint: string;
  pointsLabel: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const ACTIVITIES: ActivityDef[] = [
  {
    type: "checkin",
    label: "Presença em cultos",
    hint: "Faça check-in pelo QR code nos cultos",
    pointsLabel: "10 pts por culto",
    Icon: QrCode,
  },
  {
    type: "daily_reading",
    label: "Leitura diária",
    hint: "Marque o devocional como concluído cada dia",
    pointsLabel: "10 pts por dia",
    Icon: BookOpen,
  },
  {
    type: "invite",
    label: "Convidar um amigo",
    hint: "Compartilhe seu link pessoal de convite",
    pointsLabel: "50 pts por convite aceito",
    Icon: UserPlus,
  },
];

// ─── Activity row ─────────────────────────────────────────────────────────────

function ActivityRow({
  def,
  count,
  points,
  index,
}: {
  def: ActivityDef;
  count: number;
  points: number;
  index: number;
}) {
  const earned = count > 0;
  const { Icon, label, hint, pointsLabel } = def;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: 0.12 + index * 0.08,
        duration: 0.35,
        ease: "easeOut",
      }}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
        earned && "bg-success/8"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          earned
            ? "bg-success/15 text-success-dark"
            : "bg-muted text-muted-foreground/60"
        )}
      >
        {earned ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <Icon className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Label + hint */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium leading-tight",
            earned ? "text-foreground" : "text-foreground/55"
          )}
        >
          {label}
        </p>
        <p className="mt-0.5 text-xs leading-tight text-muted-foreground/70">
          {earned ? `${count} ${count === 1 ? "vez" : "vezes"} este mês` : hint}
        </p>
      </div>

      {/* Points */}
      <div className="shrink-0 text-right">
        {earned ? (
          <span className="text-sm font-semibold tabular-nums text-success-dark">
            +{points.toLocaleString("pt-BR")}
          </span>
        ) : (
          <span className="text-xs tabular-nums text-muted-foreground/50">
            {pointsLabel}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Streak section ───────────────────────────────────────────────────────────

function StreakRow({ currentStreak }: { currentStreak: number }) {
  const active = currentStreak > 0;
  const nextMilestone = currentStreak < 7 ? 7 : currentStreak < 30 ? 30 : null;
  const daysToNext = nextMilestone ? nextMilestone - currentStreak : null;
  const bonusAtNext = nextMilestone === 7 ? 20 : 100;
  const showDots = nextMilestone === 7 && active;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.42, duration: 0.35, ease: "easeOut" }}
      className="mx-5 mb-5 rounded-xl bg-muted/50 px-4 py-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Flame
            className={cn(
              "h-4 w-4 shrink-0",
              active ? "text-warning" : "text-muted-foreground/40"
            )}
          />
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-medium leading-tight",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {active
                ? `Sequência de ${currentStreak} ${currentStreak === 1 ? "dia" : "dias"}`
                : "Sem sequência ativa"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/70 leading-tight">
              {active && daysToNext !== null
                ? `Faltam ${daysToNext} ${daysToNext === 1 ? "dia" : "dias"} para +${bonusAtNext} pts de bônus`
                : active && nextMilestone === null
                  ? "Sequência máxima atingida!"
                  : "Leia o devocional hoje e comece uma sequência"}
            </p>
          </div>
        </div>

        {/* 7-day progress dots */}
        {showDots && (
          <div className="flex shrink-0 items-center gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i < currentStreak ? "bg-warning" : "bg-border"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface MyProgressCardProps {
  data: MyProgressData;
}

export function MyProgressCard({ data }: MyProgressCardProps) {
  const now = new Date();
  const monthName = PT_MONTHS[now.getMonth()];

  const { myPoints, myRank, actionBreakdown, currentStreak } = data;

  const breakdownByType = new Map(
    actionBreakdown.map((item) => [item.action_type, item])
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div>
          <h2
            className="text-base font-normal tracking-tight text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
            }}
          >
            Seu progresso em {monthName}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {myPoints > 0
              ? `${myPoints.toLocaleString("pt-BR")} pontos acumulados`
              : "Comece a pontuar com as atividades abaixo"}
          </p>
        </div>

        {myRank !== null && (
          <div className="shrink-0 flex items-baseline gap-0.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1.5">
            <span className="text-xs text-muted-foreground">#</span>
            <span className="text-sm font-bold tabular-nums text-foreground/80">
              {myRank}
            </span>
            <span className="ml-1 text-[10px] text-muted-foreground/70 whitespace-nowrap">
              no ranking
            </span>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 h-px bg-border/40" />

      {/* ── Activities ── */}
      <div className="px-5 pt-4 pb-3">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
          Como ganhar pontos
        </p>
        <div className="space-y-0.5">
          {ACTIVITIES.map((def, i) => {
            const bd = breakdownByType.get(def.type);
            return (
              <ActivityRow
                key={def.type}
                def={def}
                count={bd?.count ?? 0}
                points={bd?.points ?? 0}
                index={i}
              />
            );
          })}
        </div>
      </div>

      {/* ── Streak ── */}
      <StreakRow currentStreak={currentStreak} />
    </motion.div>
  );
}
