"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users, Star, Crown, Medal, Award } from "lucide-react";
import { toast } from "sonner";
import { getLeaderboard } from "@/actions/gamification";
import { LevelBadgeCompact } from "@/app/(dashboard)/perfil/level-section";
import type {
  LeaderboardData,
  TeamRankRow,
  IndividualRankRow,
} from "@/lib/validators/gamification";
import { TribeBadge } from "./tribe-badge";
import { cn } from "@/lib/utils";

// ─── Pódio top-3 ─────────────────────────────────────────────────────────────

const PODIUM_CONFIG = {
  0: {
    height: "h-28",
    labelHeight: "pb-28",
    crown: true,
    icon: Crown,
    rank: 1,
    zIndex: "z-10",
  },
  1: {
    height: "h-20",
    labelHeight: "pb-20",
    crown: false,
    icon: Medal,
    rank: 2,
    zIndex: "z-0",
  },
  2: {
    height: "h-14",
    labelHeight: "pb-14",
    crown: false,
    icon: Award,
    rank: 3,
    zIndex: "z-0",
  },
};

function PodiumCard({
  team,
  position,
}: {
  team: TeamRankRow;
  position: 0 | 1 | 2;
}) {
  const cfg = PODIUM_CONFIG[position];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.1, duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col items-center gap-2",
        cfg.zIndex,
        position === 0 && "scale-105"
      )}
    >
      {/* Crown */}
      {cfg.crown && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
          className="absolute -top-6 text-yellow-400"
        >
          <Crown className="h-6 w-6 fill-yellow-400" />
        </motion.div>
      )}

      {/* Team info */}
      <div className="flex flex-col items-center gap-1 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg"
          style={{ backgroundColor: team.team_color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span
          className="max-w-[80px] truncate text-xs font-semibold"
          style={{ color: team.team_color }}
        >
          {team.team_name}
        </span>
        <span className="text-[11px] text-foreground/50">
          {team.member_count} {team.member_count === 1 ? "membro" : "membros"}
        </span>
      </div>

      {/* Points badge */}
      <div
        className="rounded-full px-3 py-1 text-xs font-bold text-white shadow"
        style={{ backgroundColor: team.team_color }}
      >
        {team.total_points.toLocaleString("pt-BR")} pts
      </div>

      {/* Podium block */}
      <div
        className={cn(
          "w-20 rounded-t-lg flex items-center justify-center",
          cfg.height
        )}
        style={{
          background: `linear-gradient(180deg, ${team.team_color}30 0%, ${team.team_color}15 100%)`,
          border: `1px solid ${team.team_color}40`,
          borderBottom: "none",
        }}
      >
        <span
          className="text-2xl font-bold"
          style={{ color: `${team.team_color}80` }}
        >
          {cfg.rank}º
        </span>
      </div>
    </motion.div>
  );
}

// ─── Barra de progresso por equipe ───────────────────────────────────────────

function TeamBar({
  team,
  rank,
  maxPoints,
}: {
  team: TeamRankRow;
  rank: number;
  maxPoints: number;
}) {
  const pct = maxPoints > 0 ? (team.total_points / maxPoints) * 100 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04 }}
      className="flex items-center gap-3"
    >
      {/* Rank */}
      <span className="w-6 text-right text-xs font-bold text-foreground/40">
        {rank}
      </span>

      {/* Color dot + name */}
      <div className="flex w-24 shrink-0 items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: team.team_color }}
        />
        <span className="truncate text-xs font-medium text-foreground/80">
          {team.team_name}
        </span>
      </div>

      {/* Bar */}
      <div
        className="relative flex-1 overflow-hidden rounded-full bg-muted"
        style={{ height: 8 }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: team.team_color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: rank * 0.05 }}
        />
      </div>

      {/* Points */}
      <span className="w-16 text-right text-xs font-semibold tabular-nums text-foreground/70">
        {team.total_points.toLocaleString("pt-BR")}
      </span>
    </motion.div>
  );
}

// ─── Linha do ranking individual ──────────────────────────────────────────────

function IndividualRow({
  person,
  rank,
}: {
  person: IndividualRankRow;
  rank: number;
}) {
  const isTop3 = rank <= 3;

  return (
    <motion.div
      layout
      layoutId={person.member_id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-3",
        isTop3
          ? "bg-gradient-to-r from-accent-50/60 to-transparent dark:from-accent-900/20"
          : "hover:bg-muted/50"
      )}
    >
      {/* Rank number */}
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          rank === 1 && "bg-yellow-400/20 text-yellow-600 dark:text-yellow-400",
          rank === 2 && "bg-gray-300/40 text-gray-600 dark:text-gray-400",
          rank === 3 && "bg-orange-300/30 text-orange-700 dark:text-orange-400",
          rank > 3 && "text-foreground/40"
        )}
      >
        {rank}
      </span>

      {/* Avatar */}
      <div className="relative h-8 w-8 shrink-0">
        {person.avatar_url ? (
          <Image
            src={person.avatar_url}
            alt={person.member_name}
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: person.team_color }}
          >
            {person.member_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + tribe + level */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-foreground">
            {person.member_name}
          </p>
          {(person.current_level ?? 1) > 1 && (
            <LevelBadgeCompact
              level={person.current_level}
              name={person.level_name}
              icon=""
              size="xs"
            />
          )}
        </div>
        <TribeBadge teamName={person.team_name} teamColor={person.team_color} />
      </div>

      {/* Points */}
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: person.team_color }}
      >
        {person.total_points.toLocaleString("pt-BR")}
        <span className="ml-0.5 text-[10px] font-normal text-foreground/40">
          pts
        </span>
      </span>
    </motion.div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface GamificationViewProps {
  initialData: LeaderboardData;
}

export function GamificationView({ initialData }: GamificationViewProps) {
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [data, setData] = useState<LeaderboardData>(initialData);
  const [isPending, startTransition] = useTransition();

  function switchPeriod(next: "monthly" | "annual") {
    if (next === period) return;
    setPeriod(next);
    startTransition(async () => {
      const result = await getLeaderboard({ period: next });
      if ("data" in result && result.data) setData(result.data);
      else toast.error(result.error ?? "Erro ao carregar placar.");
    });
  }

  const topTeams = data.teams.slice(0, 3) as TeamRankRow[];
  const allTeams = data.teams;
  const maxPoints = allTeams[0]?.total_points ?? 1;

  const podiumTeams = [topTeams[1], topTeams[0], topTeams[2]].filter(
    Boolean
  ) as TeamRankRow[];

  return (
    <div className="space-y-8">
      {/* ── Period tabs ── */}
      <div className="flex items-center gap-2">
        {(["monthly", "annual"] as const).map((p) => (
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
            {p === "monthly" ? "Este mês" : "Este ano"}
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
          {/* ── Pódio top-3 ── */}
          {topTeams.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-accent-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
                  Pódio das Tribos
                </h2>
              </div>

              <div
                className="relative rounded-2xl p-6 pb-0 overflow-hidden"
                style={{
                  background:
                    "linear-gradient(160deg, oklch(0.18 0.03 240 / 0.5) 0%, oklch(0.14 0.02 240 / 0.3) 100%)",
                  border: "1px solid oklch(0.3 0.04 240 / 0.4)",
                }}
              >
                {/* Decorative glow */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    background: topTeams[0]
                      ? `radial-gradient(ellipse 60% 40% at 50% 80%, ${topTeams[0].team_color}50 0%, transparent 70%)`
                      : undefined,
                  }}
                />

                <div className="relative flex items-end justify-center gap-3">
                  {podiumTeams.map((team, i) => {
                    // visual positions: 2nd(left), 1st(center), 3rd(right)
                    const originalRank = [1, 0, 2][i];
                    return (
                      <PodiumCard
                        key={team.team_id}
                        team={team}
                        position={originalRank as 0 | 1 | 2}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ── Barras de todas as equipes ── */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-accent-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
                Placar Completo: Tribos
              </h2>
            </div>

            {allTeams.length === 0 ? (
              <p className="text-sm text-foreground/50">
                Nenhuma pontuação registrada ainda.
              </p>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                {allTeams.map((team, i) => (
                  <TeamBar
                    key={team.team_id}
                    team={team}
                    rank={i + 1}
                    maxPoints={maxPoints}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Ranking Individual ── */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-accent-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
                Top 10: Membros
              </h2>
            </div>

            {data.individuals.length === 0 ? (
              <p className="text-sm text-foreground/50">
                Nenhum ponto registrado ainda.
              </p>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-2">
                <motion.div layout className="space-y-0.5">
                  {data.individuals.map((person, i) => (
                    <IndividualRow
                      key={person.member_id}
                      person={person}
                      rank={i + 1}
                    />
                  ))}
                </motion.div>
              </div>
            )}
          </section>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
