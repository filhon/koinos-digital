"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronUp, Coins, TrendingUp } from "lucide-react";
import { getMyTalentHistory } from "@/actions/levels";
import {
  TALENT_SOURCE_LABELS,
  type MyLevelData,
  type TalentTransaction,
} from "@/lib/validators/levels";
import { cn } from "@/lib/utils";

// ─── LevelBadge inline ───────────────────────────────────────────────────────

export function LevelBadgeCompact({
  level,
  name,
  icon,
  size = "sm",
}: {
  level: number;
  name: string;
  icon: string;
  size?: "xs" | "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        "bg-[oklch(0.32_0.096_224/0.10)] text-[oklch(0.32_0.096_224)]",
        "dark:bg-[oklch(0.64_0.102_232/0.15)] dark:text-[oklch(0.75_0.09_230)]",
        size === "xs" && "px-1.5 py-0.5 text-[9px] gap-0.5",
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-2.5 py-1 text-xs"
      )}
      title={`Nível ${level}: ${name}`}
    >
      <span className={size === "xs" ? "text-[9px]" : "text-[11px]"}>
        {icon}
      </span>
      <span>Nv.{level}</span>
    </span>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────

function XpProgressBar({
  current,
  min,
  max,
}: {
  current: number;
  min: number;
  max: number | null;
}) {
  if (max === null) {
    // Nível máximo atingido
    return (
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[oklch(0.88_0.01_220/0.5)]">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[oklch(0.62_0.148_58)]"
        />
      </div>
    );
  }

  const range = max - min;
  const progress = range > 0 ? Math.min((current - min) / range, 1) : 1;

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-[oklch(0.88_0.01_220/0.5)] dark:bg-[oklch(0.28_0.02_220/0.5)]">
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progress }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-[oklch(0.32_0.096_224)] to-[oklch(0.62_0.148_58)]"
      />
    </div>
  );
}

// ─── TransactionRow ───────────────────────────────────────────────────────────

function TransactionRow({ tx }: { tx: TalentTransaction }) {
  const isEarned = tx.type === "earned";
  const label = TALENT_SOURCE_LABELS[tx.source] ?? tx.source;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-2.5"
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isEarned
            ? "bg-[oklch(0.32_0.096_224/0.08)] text-[oklch(0.32_0.096_224)]"
            : "bg-[oklch(0.55_0.148_28/0.08)] text-[oklch(0.55_0.148_28)]"
        )}
      >
        {isEarned ? (
          <TrendingUp className="h-3.5 w-3.5" />
        ) : (
          <Coins className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Label + date */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[oklch(0.18_0.012_230)] dark:text-[oklch(0.92_0.01_220)]">
          {label}
        </p>
        <p className="text-[11px] text-[oklch(0.52_0.016_220)]">
          {formatDistanceToNow(new Date(tx.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </div>

      {/* Amount */}
      <span
        className={cn(
          "shrink-0 text-sm font-bold tabular-nums",
          isEarned
            ? "text-[oklch(0.32_0.096_224)] dark:text-[oklch(0.64_0.102_232)]"
            : "text-[oklch(0.55_0.148_28)]"
        )}
      >
        {isEarned ? "+" : ""}
        {tx.amount.toLocaleString("pt-BR")}
      </span>
    </motion.div>
  );
}

// ─── LevelSection ─────────────────────────────────────────────────────────────

interface LevelSectionProps {
  initialData: MyLevelData;
}

export function LevelSection({ initialData }: LevelSectionProps) {
  const [data] = useState<MyLevelData>(initialData);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [transactions, setTransactions] = useState<TalentTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isLoading, startTransition] = useTransition();

  const isMaxLevel = data.next_level_min_xp === null;
  const xpToNext = isMaxLevel
    ? 0
    : (data.next_level_min_xp ?? 0) - data.total_xp;

  function loadHistory(p: number) {
    startTransition(async () => {
      const result = await getMyTalentHistory({ page: p });
      if (!result || "code" in result || result.error || !result.data) return;

      if (p === 1) {
        setTransactions(result.data.transactions);
      } else {
        setTransactions((prev) => [...prev, ...result.data!.transactions]);
      }
      setHasMore(result.data.hasMore);
      setHistoryLoaded(true);
    });
  }

  function toggleHistory() {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next && !historyLoaded) {
      loadHistory(1);
    }
  }

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    loadHistory(nextPage);
  }

  return (
    <section className="rounded-2xl border border-[oklch(0.88_0.01_220)] bg-[oklch(0.99_0.003_75)] dark:border-[oklch(0.28_0.02_220)] dark:bg-[oklch(0.14_0.016_228)] overflow-hidden shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)]">
      {/* Header: nível atual + saldo */}
      <div className="px-5 pt-5 pb-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          {/* Nível + nome */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[oklch(0.32_0.096_224/0.08)] text-3xl dark:bg-[oklch(0.64_0.102_232/0.12)]"
            >
              {data.icon}
            </motion.div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[oklch(0.52_0.016_220)]">
                Meu Nível
              </p>
              <h3 className="font-display text-[1.25rem] leading-tight tracking-[-0.01em] text-[oklch(0.18_0.012_230)] dark:text-[oklch(0.92_0.01_220)]">
                {data.name}
              </h3>
              <p className="text-xs text-[oklch(0.52_0.016_220)]">
                Nível {data.level}
                {isMaxLevel && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-[oklch(0.62_0.148_58/0.12)] px-1.5 py-0.5 text-[10px] font-semibold text-[oklch(0.62_0.148_58)]">
                    Máximo
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Saldo de Talentos */}
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[oklch(0.52_0.016_220)]">
              Talentos
            </p>
            <motion.p
              key={data.wallet_balance}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[1.5rem] font-bold leading-none tabular-nums text-[oklch(0.62_0.148_58)]"
            >
              {data.wallet_balance.toLocaleString("pt-BR")}
            </motion.p>
            <p className="mt-0.5 text-[10px] text-[oklch(0.52_0.016_220)]">
              disponíveis
            </p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-1.5">
          <XpProgressBar
            current={data.total_xp}
            min={data.current_level_min_xp}
            max={data.next_level_min_xp}
          />
          <div className="flex items-center justify-between text-[11px] text-[oklch(0.52_0.016_220)]">
            <span className="tabular-nums">
              {data.total_xp.toLocaleString("pt-BR")} XP
            </span>
            {isMaxLevel ? (
              <span className="font-medium text-[oklch(0.62_0.148_58)]">
                Nível máximo atingido
              </span>
            ) : (
              <span className="tabular-nums">
                Faltam{" "}
                <span className="font-semibold text-[oklch(0.42_0.016_220)] dark:text-[oklch(0.72_0.01_220)]">
                  {xpToNext.toLocaleString("pt-BR")} XP
                </span>{" "}
                para {data.next_level_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Divider + toggle histórico */}
      <button
        onClick={toggleHistory}
        className="flex w-full items-center justify-between border-t border-[oklch(0.88_0.01_220/0.6)] px-5 py-3 text-left transition-colors hover:bg-[oklch(0.982_0.004_80/0.5)] dark:border-[oklch(0.28_0.02_220)] dark:hover:bg-[oklch(0.18_0.016_228/0.5)]"
      >
        <span className="text-[12px] font-semibold text-[oklch(0.42_0.016_220)] dark:text-[oklch(0.62_0.01_220)]">
          Histórico de Talentos
        </span>
        <span className="text-[oklch(0.52_0.016_220)]">
          {historyOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>
      </button>

      {/* History panel */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-[oklch(0.88_0.01_220/0.5)] px-5 dark:divide-[oklch(0.28_0.02_220/0.5)]">
              {isLoading && transactions.length === 0 ? (
                <div className="space-y-2 py-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <div className="h-8 w-8 animate-pulse rounded-full bg-[oklch(0.88_0.01_220)]" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-32 animate-pulse rounded bg-[oklch(0.88_0.01_220)]" />
                        <div className="h-2.5 w-20 animate-pulse rounded bg-[oklch(0.88_0.01_220)]" />
                      </div>
                      <div className="h-4 w-10 animate-pulse rounded bg-[oklch(0.88_0.01_220)]" />
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <p className="py-6 text-center text-sm text-[oklch(0.52_0.016_220)]">
                  Nenhuma transação ainda. Complete atividades para ganhar
                  Talentos!
                </p>
              ) : (
                <>
                  {transactions.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                  {hasMore && (
                    <div className="py-3">
                      <button
                        onClick={loadMore}
                        disabled={isLoading}
                        className="w-full rounded-xl border border-[oklch(0.88_0.01_220)] py-2 text-[12px] font-medium text-[oklch(0.42_0.016_220)] transition-colors hover:bg-[oklch(0.982_0.004_80)] disabled:opacity-50 dark:border-[oklch(0.28_0.02_220)] dark:text-[oklch(0.62_0.01_220)]"
                      >
                        {isLoading ? "Carregando..." : "Carregar mais"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
