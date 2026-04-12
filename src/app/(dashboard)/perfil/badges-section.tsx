"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { checkAndAwardBadges } from "@/actions/badges";
import type { BadgeWithStatus } from "@/lib/validators/badges";
import { cn } from "@/lib/utils";

interface BadgeCardProps {
  badge: BadgeWithStatus;
  index: number;
  isNew: boolean;
}

function BadgeCard({ badge, index, isNew }: BadgeCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.92 }}
      animate={
        isNew
          ? {
              opacity: 1,
              y: 0,
              scale: [0.92, 1.12, 1],
              transition: {
                delay: 0.1,
                duration: 0.5,
                times: [0, 0.6, 1],
                ease: "easeOut",
              },
            }
          : { opacity: 1, y: 0, scale: 1 }
      }
      transition={
        isNew
          ? undefined
          : { delay: index * 0.06, duration: 0.3, ease: "easeOut" }
      }
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors",
        badge.unlocked
          ? "border-accent-200 bg-gradient-to-b from-accent-50/60 to-white dark:from-accent-900/20 dark:to-card dark:border-accent-800/40"
          : "border-border bg-card opacity-50"
      )}
    >
      {/* Glow para badge desbloqueado */}
      {badge.unlocked && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.75 0.15 75) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Animação de brilho para badges recém-desbloqueados */}
      {isNew && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 50%, oklch(0.85 0.18 75 / 0.6) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Ícone */}
      <div
        className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-xl text-3xl transition-all",
          badge.unlocked
            ? "bg-accent-50 shadow-sm dark:bg-accent-900/30"
            : "bg-muted grayscale"
        )}
      >
        <span role="img" aria-label={badge.name}>
          {badge.icon}
        </span>

        {/* Lock overlay para bloqueados */}
        {!badge.unlocked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60">
            <Lock className="h-4 w-4 text-foreground/40" />
          </div>
        )}

        {/* "Novo" badge para recém-desbloqueados */}
        {isNew && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[9px] font-bold text-white"
          >
            ✓
          </motion.div>
        )}
      </div>

      {/* Texto */}
      <div className="space-y-0.5">
        <p
          className={cn(
            "text-[13px] font-semibold leading-tight",
            badge.unlocked ? "text-foreground" : "text-foreground/50"
          )}
        >
          {badge.name}
        </p>
        <p className="text-[11px] leading-snug text-foreground/40">
          {badge.description}
        </p>
      </div>

      {/* Data de desbloqueio */}
      {badge.unlocked && badge.unlocked_at && (
        <p className="mt-auto pt-1 text-[10px] text-accent-600/70 dark:text-accent-400/70">
          {new Date(badge.unlocked_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      )}
    </motion.div>
  );
}

// ─── BadgesSection ────────────────────────────────────────────────────────────

interface BadgesSectionProps {
  initialBadges: BadgeWithStatus[];
}

export function BadgesSection({ initialBadges }: BadgesSectionProps) {
  const [badges, setBadges] = useState<BadgeWithStatus[]>(initialBadges);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Set<string>>(new Set());
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    checkAndAwardBadges().then((result) => {
      if (!result || !("data" in result) || !result.data) return;

      const { awarded } = result.data;
      if (awarded.length === 0) return;

      const newIds = new Set<string>(
        awarded.map((a: { badge_id: string }) => a.badge_id)
      );
      setNewlyUnlocked(newIds);

      // Atualizar estado local marcando os novos como desbloqueados
      setBadges((prev) =>
        prev.map((b) =>
          newIds.has(b.id)
            ? { ...b, unlocked: true, unlocked_at: new Date().toISOString() }
            : b
        )
      );

      // Toast para cada badge desbloqueado
      awarded.forEach(
        (
          badge: { badge_id: string; name: string; icon: string },
          i: number
        ) => {
          setTimeout(() => {
            toast.success(`${badge.icon} Conquista desbloqueada!`, {
              description: badge.name,
              duration: 4000,
            });
          }, i * 400);
        }
      );
    });
  }, []);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Conquistas</h2>
          <p className="text-xs text-foreground/50">
            {unlockedCount} de {badges.length} desbloqueadas
          </p>
        </div>

        {/* Progress bar */}
        <div
          className="relative h-1.5 w-24 overflow-hidden rounded-full bg-muted"
          aria-hidden
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-accent-500"
            initial={{ width: 0 }}
            animate={{
              width:
                badges.length > 0
                  ? `${(unlockedCount / badges.length) * 100}%`
                  : "0%",
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence>
        <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {badges.map((badge, i) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              index={i}
              isNew={newlyUnlocked.has(badge.id)}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
