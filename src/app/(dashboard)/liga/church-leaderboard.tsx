"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Medal,
  Award,
  Building2,
  HelpCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getChurchLeaderboard } from "@/actions/gamification";
import type { ChurchRankRow } from "@/lib/validators/gamification";
import { cn } from "@/lib/utils";

// ─── Color helpers ────────────────────────────────────────────────────────────

const RANK_COLORS: Record<number, string> = {
  1: "#f59e0b", // ouro
  2: "#94a3b8", // prata
  3: "#b45309", // bronze
};
const MUTED_COLOR = "oklch(0.55 0.06 220)";

function rankColor(rank: number): string {
  return RANK_COLORS[rank] ?? MUTED_COLOR;
}

function churchInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ─── Pódio ───────────────────────────────────────────────────────────────────

const PODIUM = {
  0: { height: "h-28", crown: true, Icon: Crown, rankNum: 1 },
  1: { height: "h-20", crown: false, Icon: Medal, rankNum: 2 },
  2: { height: "h-14", crown: false, Icon: Award, rankNum: 3 },
} as const;

function PodiumSlot({
  church,
  position,
  isOwn,
}: {
  church: ChurchRankRow;
  position: 0 | 1 | 2;
  isOwn: boolean;
}) {
  const cfg = PODIUM[position];
  const color = rankColor(cfg.rankNum);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.1, duration: 0.35, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col items-center gap-2",
        position === 0 && "scale-105 z-10"
      )}
    >
      {cfg.crown && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.45, type: "spring", stiffness: 300 }}
          className="absolute -top-6 text-yellow-400"
        >
          <Crown className="h-6 w-6 fill-yellow-400" />
        </motion.div>
      )}

      <div className="flex flex-col items-center gap-1 text-center">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg",
            isOwn && "ring-2 ring-offset-2 ring-offset-transparent"
          )}
          style={{
            backgroundColor: color,
            ...(isOwn
              ? { outline: `2px solid ${color}`, outlineOffset: "3px" }
              : {}),
          }}
        >
          {churchInitials(church.church_name)}
        </div>
        <span
          className="max-w-[80px] truncate text-xs font-semibold leading-tight"
          style={{ color }}
        >
          {church.church_name}
        </span>
        <span className="text-[11px] text-foreground/50">
          {church.active_members}{" "}
          {church.active_members === 1 ? "ativo" : "ativos"}
        </span>
      </div>

      <div
        className="rounded-full px-3 py-1 text-xs font-bold text-white shadow"
        style={{ backgroundColor: color }}
      >
        {Math.round(church.normalized_score).toLocaleString("pt-BR")} pts
      </div>

      {/* Bloco do pódio */}
      <div
        className={cn(
          "w-20 rounded-t-lg flex items-center justify-center",
          cfg.height
        )}
        style={{
          background: `linear-gradient(180deg, ${color}28 0%, ${color}10 100%)`,
          border: `1px solid ${color}38`,
          borderBottom: "none",
        }}
      >
        <span className="text-2xl font-bold" style={{ color: `${color}70` }}>
          {cfg.rankNum}º
        </span>
      </div>
    </motion.div>
  );
}

// ─── Linha da lista ───────────────────────────────────────────────────────────

function ChurchRow({
  church,
  maxScore,
  isOwn,
}: {
  church: ChurchRankRow;
  maxScore: number;
  isOwn: boolean;
}) {
  const pct = maxScore > 0 ? (church.normalized_score / maxScore) * 100 : 0;
  const color = rankColor(Number(church.rank));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Number(church.rank) * 0.04 }}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5",
        isOwn
          ? "bg-primary/5 ring-1 ring-primary/15"
          : "hover:bg-muted/40 transition-colors"
      )}
    >
      {/* Rank */}
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          church.rank === 1 &&
            "bg-yellow-400/20 text-yellow-600 dark:text-yellow-400",
          church.rank === 2 &&
            "bg-slate-300/40 text-slate-600 dark:text-slate-400",
          church.rank === 3 &&
            "bg-orange-300/30 text-orange-700 dark:text-orange-400",
          church.rank > 3 && "text-foreground/40"
        )}
      >
        {church.rank}
      </span>

      {/* Ícone + nome */}
      <div className="flex w-28 shrink-0 items-center gap-2">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {churchInitials(church.church_name)}
        </div>
        <div className="min-w-0">
          <span
            className={cn(
              "block truncate text-xs leading-tight",
              isOwn
                ? "font-semibold text-foreground"
                : "font-medium text-foreground/80"
            )}
          >
            {church.church_name}
          </span>
          {isOwn && (
            <span className="text-[9px] font-medium text-primary/70 leading-none">
              sua igreja
            </span>
          )}
        </div>
      </div>

      {/* Barra */}
      <div
        className="relative flex-1 overflow-hidden rounded-full bg-muted"
        style={{ height: 7 }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{
            duration: 0.75,
            ease: "easeOut",
            delay: Number(church.rank) * 0.05,
          }}
        />
      </div>

      {/* Pontos normalizados */}
      <span className="w-14 text-right text-xs font-semibold tabular-nums text-foreground/70">
        {Math.round(church.normalized_score).toLocaleString("pt-BR")}
      </span>
    </motion.div>
  );
}

// ─── Widget "Sua Igreja" ──────────────────────────────────────────────────────

function MyChurchCard({ church }: { church: ChurchRankRow }) {
  const color = rankColor(Number(church.rank));
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-primary/25 bg-primary/5 p-4"
    >
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-primary/60">
        Sua Igreja
      </p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {churchInitials(church.church_name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {church.church_name}
            </p>
            <p className="text-xs text-foreground/50">
              {church.active_members}{" "}
              {church.active_members === 1 ? "membro ativo" : "membros ativos"}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p
            className="text-2xl font-bold tabular-nums text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
            }}
          >
            #{church.rank}
          </p>
          <p className="text-xs text-foreground/50">
            {Math.round(church.normalized_score).toLocaleString("pt-BR")} pts
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ChurchLeaderboardProps {
  initialData: ChurchRankRow[];
  myChurchId: string;
}

export function ChurchLeaderboard({
  initialData,
  myChurchId,
}: ChurchLeaderboardProps) {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [data, setData] = useState<ChurchRankRow[]>(initialData);
  const [isPending, startTransition] = useTransition();

  function switchPeriod(next: "month" | "year") {
    if (next === period) return;
    setPeriod(next);
    startTransition(async () => {
      const result = await getChurchLeaderboard({ period: next });
      if ("data" in result && result.data) setData(result.data);
      else toast.error("Erro ao carregar Liga Geral.");
    });
  }

  const myChurch = data.find((c) => c.church_id === myChurchId) ?? null;
  const top3 = data.slice(0, 3);
  const top10 = data.slice(0, 10);
  const maxScore = data[0]?.normalized_score ?? 1;
  const isSingleOrEmpty = data.length <= 1;

  // Pódio visual: 2º(esq) · 1º(centro) · 3º(dir)
  const podiumOrdered = [top3[1], top3[0], top3[2]].filter(
    Boolean
  ) as ChurchRankRow[];
  const podiumPositions: (0 | 1 | 2)[] = [1, 0, 2];

  return (
    <div className="space-y-6">
      {/* ── Toggle período ── */}
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
          <span className="animate-pulse text-xs text-foreground/40">
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
          transition={{ duration: 0.18 }}
          className="space-y-6"
        >
          {/* ── Estado: sem dados ou única igreja ── */}
          {isSingleOrEmpty && (
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-5 py-8 text-center">
              <Building2 className="mx-auto mb-3 h-8 w-8 text-foreground/25" />
              <p className="text-sm font-medium text-foreground/60">
                A Liga Geral será ativada quando mais igrejas entrarem no
                Koinos!
              </p>
              <p className="mt-1.5 text-xs text-foreground/40">
                Convide outras igrejas para competir juntos.
              </p>
            </div>
          )}

          {/* ── Pódio ── */}
          {top3.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Crown className="h-4 w-4 text-accent-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
                  Pódio das Igrejas
                </h2>
              </div>

              <div
                className="relative overflow-hidden rounded-2xl p-6 pb-0"
                style={{
                  background:
                    "linear-gradient(160deg, oklch(0.18 0.03 240 / 0.5) 0%, oklch(0.14 0.02 240 / 0.3) 100%)",
                  border: "1px solid oklch(0.3 0.04 240 / 0.4)",
                }}
              >
                {top3[0] && (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-15"
                    style={{
                      background: `radial-gradient(ellipse 60% 40% at 50% 80%, ${rankColor(1)}60 0%, transparent 70%)`,
                    }}
                  />
                )}
                <div className="relative flex items-end justify-center gap-3">
                  {podiumOrdered.map((church, i) => (
                    <PodiumSlot
                      key={church.church_id}
                      church={church}
                      position={podiumPositions[i]}
                      isOwn={church.church_id === myChurchId}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Top 10 ── */}
          {!isSingleOrEmpty && top10.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
                    Top 10 Igrejas
                  </h2>
                </div>
                <button
                  title="Pontuação normalizada: (pts_total ÷ membros_ativos) × ln(membros_ativos + 1). Garante competição justa entre igrejas de todos os tamanhos."
                  className="text-foreground/30 transition-colors hover:text-foreground/60"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-0.5 rounded-2xl border border-border bg-card p-2">
                {top10.map((church) => (
                  <ChurchRow
                    key={church.church_id}
                    church={church}
                    maxScore={maxScore}
                    isOwn={church.church_id === myChurchId}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Card "Sua Igreja" ── */}
          {myChurch && Number(myChurch.rank) > 10 && (
            <MyChurchCard church={myChurch} />
          )}

          {/* ── Sua igreja sem pontos ── */}
          {!myChurch && !isSingleOrEmpty && (
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 text-center">
              <p className="text-sm text-foreground/50">
                Sua igreja ainda não tem pontos neste período.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
