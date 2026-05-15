"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

// ─── LevelUpToastContent ──────────────────────────────────────────────────────
// Rendered inside a sonner custom toast.

export function LevelUpToastContent({
  level,
  name,
  icon,
}: {
  level: number;
  name: string;
  icon: string;
}) {
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0, y: 8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_8px_24px_oklch(0.32_0.096_224/0.22)] bg-[oklch(0.32_0.096_224)] text-[oklch(0.97_0.006_220)] min-w-[260px]"
    >
      {/* Animated icon */}
      <motion.div
        animate={{
          scale: [1, 1.35, 0.95, 1.1, 1],
          rotate: [0, -8, 8, -4, 0],
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.97_0.006_220/0.12)] text-2xl"
      >
        {icon}
      </motion.div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest opacity-75">
          Novo Nível!
        </p>
        <p className="text-sm font-bold leading-snug">
          Nível {level}: {name}
        </p>
        <p className="mt-0.5 text-[11px] opacity-70">
          Parabéns pela sua dedicação!
        </p>
      </div>

      {/* Glow particles */}
      <GlowParticles />
    </motion.div>
  );
}

// ─── Tiny floating particles ──────────────────────────────────────────────────

const PARTICLE_POSITIONS = [
  { x: -12, y: -16, delay: 0.05 },
  { x: 8, y: -20, delay: 0.1 },
  { x: 22, y: -10, delay: 0.15 },
  { x: -20, y: -8, delay: 0.08 },
  { x: 18, y: -18, delay: 0.2 },
  { x: -8, y: -22, delay: 0.12 },
];

function GlowParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {PARTICLE_POSITIONS.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: p.x,
            y: p.y,
          }}
          transition={{
            duration: 0.8,
            delay: p.delay,
            ease: "easeOut",
          }}
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[oklch(0.62_0.148_58)]"
        />
      ))}
    </div>
  );
}

// ─── showLevelUpToast ─────────────────────────────────────────────────────────
// Call this function when a level-up occurs.

export function showLevelUpToast({
  level,
  name,
  icon,
}: {
  level: number;
  name: string;
  icon: string;
}) {
  toast.custom(
    () => <LevelUpToastContent level={level} name={name} icon={icon} />,
    {
      duration: 5000,
      position: "top-center",
    }
  );
}

// ─── LevelUpChecker ───────────────────────────────────────────────────────────
// Client component: checks localStorage for a pending level-up notification
// (set by server action result) and fires the toast once.

const LEVEL_UP_KEY = "koinos_pending_level_up";

export function storePendingLevelUp(level: number, name: string, icon: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LEVEL_UP_KEY, JSON.stringify({ level, name, icon }));
}

export function LevelUpChecker() {
  useEffect(() => {
    const raw = localStorage.getItem(LEVEL_UP_KEY);
    if (!raw) return;

    try {
      const { level, name, icon } = JSON.parse(raw) as {
        level: number;
        name: string;
        icon: string;
      };
      localStorage.removeItem(LEVEL_UP_KEY);

      // Delay slightly so the page is fully rendered
      setTimeout(() => {
        showLevelUpToast({ level, name, icon });
      }, 600);
    } catch {
      localStorage.removeItem(LEVEL_UP_KEY);
    }
  }, []);

  return null;
}
