"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Flame,
  ChevronUp,
  Trophy,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { markRead } from "@/actions/devotion";
import { cn } from "@/lib/utils";
import type { TodayReadingFull, ReadingHistoryDay } from "@/actions/leitura";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── FlameIcon ────────────────────────────────────────────────────────────────

function FlameIcon({ size = 16 }: { size?: number }) {
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

// ─── StreakWidget ─────────────────────────────────────────────────────────────

function StreakWidget({ streak }: { streak: TodayReadingFull["streak"] }) {
  const days = streak.current_streak;
  const weekProgress = Math.min(
    days % 7 || (days > 0 && days % 7 === 0 ? 7 : 0),
    7
  );

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border/60 bg-card">
      <motion.div
        className={cn(
          "flex items-center gap-1.5 text-sm font-semibold",
          days >= 7
            ? "text-orange-500 dark:text-orange-400"
            : "text-amber-600 dark:text-amber-400"
        )}
        animate={days > 0 ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.span
          animate={{ y: [0, -1.5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <FlameIcon size={18} />
        </motion.span>
        <span>
          {days} {days === 1 ? "dia" : "dias"}
        </span>
      </motion.div>

      <div className="flex-1">
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
          <span>Semana atual</span>
          <span>{weekProgress}/7</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                i < weekProgress
                  ? days >= 7
                    ? "bg-orange-400 dark:bg-orange-500"
                    : "bg-amber-400 dark:bg-amber-500"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {streak.longest_streak > 0 && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Trophy className="w-3 h-3" />
          <span>{streak.longest_streak}</span>
        </div>
      )}
    </div>
  );
}

// ─── MiniCalendar ─────────────────────────────────────────────────────────────

function MiniCalendar({ history }: { history: ReadingHistoryDay[] }) {
  const readSet = new Set(history.filter((d) => d.read).map((d) => d.date));
  const last30 = history.slice(-30);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          Últimos 30 dias
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {readSet.size} leitura{readSet.size !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {last30.map((day) => {
          const d = parseISO(day.date);
          const isToday = day.date === new Date().toISOString().split("T")[0];
          return (
            <div
              key={day.date}
              title={`${format(d, "d 'de' MMMM", { locale: ptBR })}${day.book ? ` — ${day.book} ${day.chapter}` : ""}${day.read ? " ✓" : ""}`}
              className={cn(
                "aspect-square rounded-sm transition-colors",
                day.read
                  ? "bg-emerald-400 dark:bg-emerald-600"
                  : isToday
                    ? "bg-amber-200 dark:bg-amber-800/50 ring-1 ring-amber-400 dark:ring-amber-600"
                    : "bg-muted"
              )}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
        <span>Lido</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-amber-200 dark:bg-amber-800/50 ring-1 ring-amber-400 ml-2" />
        <span>Hoje</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-muted ml-2" />
        <span>Não lido</span>
      </div>
    </div>
  );
}

// ─── CelebrationBurst ─────────────────────────────────────────────────────────

function CelebrationBurst({ show }: { show: boolean }) {
  if (!show) return null;
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * 360;
    const distance = 48 + Math.sin(i * 37) * 20;
    const x = Math.cos((angle * Math.PI) / 180) * distance;
    const y = Math.sin((angle * Math.PI) / 180) * distance;
    const colors = [
      "bg-amber-400",
      "bg-emerald-400",
      "bg-petroleum-dusk",
      "bg-orange-400",
      "bg-teal-400",
    ];
    const color = colors[i % colors.length];
    return { x, y, color };
  });

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className={cn("absolute w-2 h-2 rounded-full", p.color)}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.02 }}
        />
      ))}
    </div>
  );
}

// ─── BibleReader ──────────────────────────────────────────────────────────────

interface BibleReaderProps {
  initialReading: TodayReadingFull | null;
  history: ReadingHistoryDay[];
  userEmail: string;
}

export function BibleReader({ initialReading, history }: BibleReaderProps) {
  const [reading, setReading] = useState(initialReading);
  const [alreadyRead, setAlreadyRead] = useState(
    initialReading?.already_read ?? false
  );
  const [streak, setStreak] = useState(
    initialReading?.streak ?? {
      current_streak: 0,
      longest_streak: 0,
      last_read_date: null,
    }
  );
  const [canComplete, setCanComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const lastVerseRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver: habilita botão quando último versículo aparece
  useEffect(() => {
    if (!lastVerseRef.current || alreadyRead) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCanComplete(true);
      },
      { threshold: 0.5 }
    );

    obs.observe(lastVerseRef.current);
    return () => obs.disconnect();
  }, [alreadyRead, reading]);

  // Scroll para topo
  const handleScroll = useCallback(() => {
    setShowScrollTop((containerRef.current?.scrollTop ?? 0) > 300);
  }, []);

  function handleComplete() {
    if (!reading || alreadyRead || isPending) return;

    startTransition(async () => {
      const result = await markRead({ daily_reading_id: reading.id });

      if (!result || "code" in result || !result.data) {
        const errMsg =
          result && "error" in result
            ? result.error
            : "Erro ao registrar leitura.";
        if (errMsg?.includes("já registrada")) {
          setAlreadyRead(true);
          return;
        }
        toast.error(errMsg ?? "Erro ao registrar leitura.");
        return;
      }

      setAlreadyRead(true);
      setStreak((prev) => ({
        ...prev,
        current_streak: result.data!.current_streak,
      }));
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1000);

      if (result.data.bonus_points > 0) {
        toast.success(
          `Parabéns! +${result.data.bonus_points} pts bônus — ${result.data.current_streak} dias seguidos!`,
          { duration: 5000 }
        );
      } else {
        toast.success("Leitura concluída! +10 pontos");
      }

      setReading((prev) => (prev ? { ...prev, already_read: true } : prev));
    });
  }

  // Sem leitura programada
  if (!reading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <BookOpen className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-medium text-foreground mb-1">
            Nenhuma leitura programada para hoje
          </p>
          <p className="text-sm text-muted-foreground max-w-xs">
            O plano de leitura será reiniciado automaticamente no próximo ciclo.
          </p>
        </div>
      </div>
    );
  }

  const verses = reading.verses;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-32">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="pt-6 pb-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">
          Leitura de hoje
        </p>
        <h1 className="font-display text-3xl tracking-tight text-foreground leading-tight">
          {reading.book}{" "}
          <span className="text-muted-foreground font-normal">
            {reading.chapter}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Almeida Antiga · {verses.length} versículos
        </p>
      </div>

      {/* ── Streak widget ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <StreakWidget streak={streak} />
      </div>

      {/* ── Texto do capítulo ──────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={cn(
          "rounded-2xl border border-border/60 bg-card px-5 py-6 sm:px-8 sm:py-8",
          "shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)]"
        )}
      >
        <div className="space-y-0">
          {verses.map((v, idx) => {
            const isLast = idx === verses.length - 1;
            return (
              <p
                key={v.verse}
                ref={isLast ? lastVerseRef : undefined}
                className={cn(
                  "leading-[1.85] text-[1.0625rem] text-foreground/90",
                  "dark:text-foreground/85"
                )}
                style={{ textIndent: "0" }}
              >
                <sup className="text-[0.6875rem] font-bold text-bronze-bell dark:text-amber-400 mr-0.5 select-none">
                  {v.verse}
                </sup>
                {v.text}
                {!isLast && " "}
              </p>
            );
          })}
        </div>
      </div>

      {/* ── Botão Concluir leitura ─────────────────────────────────────────── */}
      <div className="mt-6 relative flex justify-center">
        <CelebrationBurst show={showCelebration} />
        <AnimatePresence mode="wait">
          {alreadyRead ? (
            <motion.div
              key="done"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Leitura concluída!
              </span>
              {streak.current_streak > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold text-orange-500 dark:text-orange-400 ml-1">
                  <Flame className="w-3.5 h-3.5" />
                  {streak.current_streak}{" "}
                  {streak.current_streak === 1 ? "dia" : "dias"}
                </span>
              )}
            </motion.div>
          ) : (
            <motion.button
              key="complete-btn"
              onClick={handleComplete}
              disabled={!canComplete || isPending}
              whileTap={canComplete ? { scale: 0.96 } : {}}
              className={cn(
                "relative flex items-center gap-2.5 px-8 py-3.5 rounded-2xl",
                "text-sm font-semibold transition-all duration-200",
                canComplete
                  ? "bg-petroleum-dusk text-petroleum-dusk-foreground shadow-[0_4px_12px_oklch(0.32_0.096_224/0.35)] hover:brightness-110"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {isPending ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 rounded-full border-2 border-current border-t-transparent"
                />
              ) : (
                <BookOpen className="w-4 h-4" />
              )}
              <span>
                {isPending
                  ? "Registrando..."
                  : canComplete
                    ? "Concluir leitura"
                    : "Leia até o fim para concluir"}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {!canComplete && !alreadyRead && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Role até o último versículo para habilitar
        </p>
      )}

      {/* ── Mini calendário ────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="mt-10 pt-8 border-t border-border/60">
          <MiniCalendar history={history} />
        </div>
      )}

      {/* ── Scroll to top ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 w-10 h-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
            aria-label="Voltar ao topo"
          >
            <ChevronUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
