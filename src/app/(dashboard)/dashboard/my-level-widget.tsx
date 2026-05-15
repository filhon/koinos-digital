"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import type { MyLevelData } from "@/lib/validators/levels";

interface MyLevelWidgetProps {
  levelData: MyLevelData;
}

export function MyLevelWidget({ levelData }: MyLevelWidgetProps) {
  const {
    level,
    name,
    icon,
    total_xp,
    wallet_balance,
    current_level_min_xp,
    next_level_min_xp,
  } = levelData;

  const xpProgress =
    next_level_min_xp !== null
      ? Math.min(
          100,
          Math.round(
            ((total_xp - current_level_min_xp) /
              (next_level_min_xp - current_level_min_xp)) *
              100
          )
        )
      : 100;

  return (
    <Link href="/perfil#nivel" className="block group">
      <div className="rounded-xl border border-border bg-card p-4 shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)] hover:border-primary/20 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-3 mb-3">
          {/* Level icon */}
          <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center text-xl select-none">
            {icon}
          </div>

          {/* Name + level */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight truncate">
              {name}
            </p>
            <p className="text-[11px] text-muted-foreground">Nível {level}</p>
          </div>

          {/* Talentos */}
          <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-[oklch(0.62_0.148_58/0.08)]">
            <Coins className="w-3 h-3 text-accent-500" strokeWidth={2} />
            <span className="text-[11px] font-semibold tabular-nums text-[oklch(0.52_0.12_58)]">
              {wallet_balance.toLocaleString("pt-BR")}
            </span>
          </div>
        </div>

        {/* XP bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground/70">
              {total_xp.toLocaleString("pt-BR")} XP
            </span>
            {next_level_min_xp !== null && (
              <span className="text-[10px] text-muted-foreground/70">
                {xpProgress}%
              </span>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-primary/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary/50 group-hover:bg-primary/70 transition-colors duration-300"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            />
          </div>
          {next_level_min_xp !== null && (
            <p className="text-[10px] text-muted-foreground/50 mt-1 text-right">
              {(next_level_min_xp - total_xp).toLocaleString("pt-BR")} XP para o
              próximo nível
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
