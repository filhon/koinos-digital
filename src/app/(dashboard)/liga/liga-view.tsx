"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GamificationView } from "./gamification-view";
import { MyProgressCard } from "./my-progress-card";
import { ChurchLeaderboard } from "./church-leaderboard";
import type {
  LeaderboardData,
  MyProgressData,
  ChurchRankRow,
} from "@/lib/validators/gamification";

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = "interno" | "geral" | "progresso";

const TABS: { id: Tab; label: string }[] = [
  { id: "interno", label: "Interno" },
  { id: "geral", label: "Geral" },
  { id: "progresso", label: "Meu Progresso" },
];

// ─── LigaView ─────────────────────────────────────────────────────────────────

interface LigaViewProps {
  initialLeaderboard: LeaderboardData;
  myProgress: MyProgressData;
  initialChurchLeaderboard: ChurchRankRow[];
  myChurchId: string;
}

export function LigaView({
  initialLeaderboard,
  myProgress,
  initialChurchLeaderboard,
  myChurchId,
}: LigaViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("interno");

  return (
    <>
      {/* ── Mobile: tabs ── */}
      <div className="md:hidden">
        {/* Tab bar */}
        <div className="mb-5 flex items-center gap-1 rounded-xl bg-muted/60 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground/55 hover:text-foreground/80"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {activeTab === "interno" && (
              <GamificationView initialData={initialLeaderboard} />
            )}
            {activeTab === "geral" && (
              <ChurchLeaderboard
                initialData={initialChurchLeaderboard}
                myChurchId={myChurchId}
              />
            )}
            {activeTab === "progresso" && <MyProgressCard data={myProgress} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Desktop: 3 colunas ── */}
      <div className="hidden md:grid md:grid-cols-[300px_1fr_300px] xl:grid-cols-[320px_1fr_320px] md:gap-6 md:items-start">
        {/* Coluna esquerda: Meu Progresso */}
        <div className="md:sticky md:top-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground/45">
            Meu Progresso
          </h2>
          <MyProgressCard data={myProgress} />
        </div>

        {/* Coluna central: Liga Interna */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground/45">
            Liga Interna
          </h2>
          <GamificationView initialData={initialLeaderboard} />
        </div>

        {/* Coluna direita: Liga Geral */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground/45">
            Liga Geral
          </h2>
          <ChurchLeaderboard
            initialData={initialChurchLeaderboard}
            myChurchId={myChurchId}
          />
        </div>
      </div>
    </>
  );
}
