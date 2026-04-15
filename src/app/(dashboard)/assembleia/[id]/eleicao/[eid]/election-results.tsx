"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ElectionResults as ElectionResultsType,
  ElectionType,
} from "@/lib/validators/assembleia";

interface ElectionResultsProps {
  results: ElectionResultsType;
  electionType: ElectionType;
}

export function ElectionResults({
  results,
  electionType,
}: ElectionResultsProps) {
  const {
    total_votes,
    quorum,
    active_members,
    quorum_reached,
    quorum_percentage,
  } = results;

  return (
    <div className="space-y-5">
      {/* Quórum */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Participação
          </span>
          <span className="font-semibold">
            {total_votes} / {active_members} membros ({quorum_percentage}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn(
              "h-full rounded-full",
              quorum_reached ? "bg-green-500" : "bg-amber-500"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(quorum_percentage, 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          {/* Quórum marker */}
          {active_members > 0 && (
            <div
              className="absolute top-0 h-full w-0.5 bg-foreground/40"
              style={{
                left: `${Math.min((quorum / active_members) * 100, 100)}%`,
              }}
            />
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            quorum_reached
              ? "text-green-600 dark:text-green-400"
              : "text-amber-600 dark:text-amber-400"
          )}
        >
          {quorum_reached ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5" />
          )}
          {quorum_reached
            ? `Quórum atingido (mín. ${quorum})`
            : `Quórum não atingido — faltam ${Math.max(quorum - total_votes, 0)} votos`}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Results by type */}
      {electionType === "candidatos" && results.results_candidatos && (
        <div className="space-y-3">
          {results.results_candidatos.map((candidate, index) => (
            <div key={candidate.candidate_id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  {index === 0 && total_votes > 0 && (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                  )}
                  <span className="truncate font-medium">
                    {candidate.member_name}
                  </span>
                  {candidate.position && (
                    <span className="text-xs text-muted-foreground truncate">
                      — {candidate.position}
                    </span>
                  )}
                </div>
                <span className="font-semibold shrink-0 ml-2">
                  {candidate.vote_count} ({candidate.percentage}%)
                </span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    index === 0 ? "bg-primary" : "bg-muted-foreground/40"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${candidate.percentage}%` }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {electionType === "sim_nao" && results.results_sim_nao && (
        <div className="space-y-3">
          {(
            [
              {
                key: "sim",
                label: "Sim",
                value: results.results_sim_nao.sim,
                pct: results.results_sim_nao.sim_percentage,
                color: "bg-green-500",
              },
              {
                key: "nao",
                label: "Não",
                value: results.results_sim_nao.nao,
                pct: results.results_sim_nao.nao_percentage,
                color: "bg-destructive",
              },
              {
                key: "abstencao",
                label: "Abstenção",
                value: results.results_sim_nao.abstencao,
                pct: results.results_sim_nao.abstencao_percentage,
                color: "bg-muted-foreground/40",
              },
            ] as const
          ).map(({ key, label, value, pct, color }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{label}</span>
                <span className="font-semibold">
                  {value} ({pct}%)
                </span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={cn("h-full rounded-full", color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}

          {/* Verdict */}
          {total_votes > 0 && quorum_reached && (
            <div
              className={cn(
                "mt-2 flex items-center gap-2 rounded-lg border p-2.5 text-sm font-medium",
                results.results_sim_nao.sim > results.results_sim_nao.nao
                  ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              )}
            >
              {results.results_sim_nao.sim > results.results_sim_nao.nao ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {results.results_sim_nao.sim > results.results_sim_nao.nao
                ? "Proposta aprovada"
                : "Proposta rejeitada"}
            </div>
          )}
        </div>
      )}

      {total_votes === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Nenhum voto registrado ainda.
        </p>
      )}
    </div>
  );
}
