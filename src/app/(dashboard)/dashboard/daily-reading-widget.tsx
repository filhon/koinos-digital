"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { markRead } from "@/actions/devotion";
import type { TodayReadingData } from "@/lib/validators/devotion";
import { cn } from "@/lib/utils";

// ─── FlameIcon ────────────────────────────────────────────────────────────────

function FlameIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C12 2 7 7.5 7 12.5C7 15.54 9.24 18 12 18C14.76 18 17 15.54 17 12.5C17 10.5 16 9 15 8C15 8 14.5 10 13 10C13 10 14 8.5 12 2Z" />
      <path
        d="M12 22C14.21 22 16 20.21 16 18H8C8 20.21 9.79 22 12 22Z"
        opacity="0.5"
      />
    </svg>
  );
}

// ─── StreakFlame ──────────────────────────────────────────────────────────────

function StreakFlame({ count }: { count: number }) {
  const isHot = count >= 7;
  const isMilestone = count === 7 || count === 30;

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
        isHot
          ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          : "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
      )}
      animate={
        isMilestone ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}
      }
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.span
        animate={{
          y: [0, -1.5, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={isHot ? "text-orange-500" : "text-amber-500"}
      >
        <FlameIcon size={13} />
      </motion.span>
      <span>
        {count} {count === 1 ? "dia" : "dias"}
      </span>
    </motion.div>
  );
}

// ─── DailyReadingWidget ───────────────────────────────────────────────────────

interface DailyReadingWidgetProps {
  initialData: TodayReadingData;
}

export function DailyReadingWidget({ initialData }: DailyReadingWidgetProps) {
  const [alreadyRead, setAlreadyRead] = useState(initialData.already_read);
  const [streak, setStreak] = useState(initialData.streak.current_streak);
  const [isPending, startTransition] = useTransition();

  const { reading } = initialData;

  function handleMarkRead() {
    if (!reading || alreadyRead) return;

    startTransition(async () => {
      const result = await markRead({ daily_reading_id: reading.id });

      if (!result || "code" in result || !result.data) {
        const errMsg =
          result && "error" in result
            ? result.error
            : "Erro ao registrar leitura.";
        // Se já foi lida, atualizar estado silenciosamente
        if (errMsg?.includes("já registrada")) {
          setAlreadyRead(true);
          return;
        }
        toast.error(errMsg ?? "Erro ao registrar leitura.");
        return;
      }

      setAlreadyRead(true);
      setStreak(result.data.current_streak);

      if (result.data.bonus_points > 0) {
        toast.success(
          `+${result.data.bonus_points} pts bônus! 🎉 Streak de ${result.data.current_streak} dias!`,
          { duration: 4000 }
        );
      } else {
        toast.success(`Leitura registrada! +10 pts`);
      }
    });
  }

  // Sem leitura programada para hoje
  if (!reading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 text-sm text-muted-foreground">
        <BookOpen className="w-4 h-4 shrink-0" />
        <span>Nenhuma leitura programada para hoje.</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4",
        alreadyRead
          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20"
          : "border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/10"
      )}
    >
      {/* Decorative glow */}
      <div
        className={cn(
          "pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl",
          alreadyRead
            ? "bg-emerald-300/20 dark:bg-emerald-500/10"
            : "bg-amber-300/25 dark:bg-amber-500/10"
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        {/* Left: reading info */}
        <div className="flex-1 min-w-0">
          {/* Label */}
          <p className="text-[10px] font-semibold tracking-widest uppercase text-amber-600/70 dark:text-amber-400/60 mb-1">
            Leitura do dia
          </p>

          {/* Book + Chapter */}
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-lg font-bold text-foreground leading-tight">
              {reading.book}
            </span>
            <span className="text-base font-medium text-foreground/60">
              {reading.chapter}
            </span>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-2 flex-wrap">
            {streak > 0 ? (
              <StreakFlame count={streak} />
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Comece sua sequência hoje!
              </span>
            )}
          </div>
        </div>

        {/* Right: action button */}
        <div className="shrink-0">
          <AnimatePresence mode="wait">
            {alreadyRead ? (
              <motion.div
                key="done"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex items-center justify-center w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Lido!
                </span>
              </motion.div>
            ) : (
              <motion.button
                key="read-btn"
                onClick={handleMarkRead}
                disabled={isPending}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04 }}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl font-bold text-sm",
                  "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200 dark:shadow-amber-900/30",
                  "transition-colors disabled:opacity-60 disabled:pointer-events-none"
                )}
              >
                <motion.span
                  animate={isPending ? {} : { y: [0, -1.5, 0] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <FlameIcon size={18} />
                </motion.span>
                <span className="text-[11px]">{isPending ? "..." : "Li!"}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Milestone sparkle banner */}
      <AnimatePresence>
        {alreadyRead && (streak === 7 || streak === 30) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {streak === 7
                  ? "Milestone! 7 dias seguidos → +20 pts bônus"
                  : "Milestone! 30 dias seguidos → +100 pts bônus"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
