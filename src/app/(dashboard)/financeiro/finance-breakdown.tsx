"use client";

import { motion } from "framer-motion";
import { Building2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import type { UnitFinanceKPIs } from "@/actions/financeiro";
import { formatCurrency } from "@/lib/utils/formatters";

interface FinanceBreakdownProps {
  units: UnitFinanceKPIs[];
}

export function FinanceBreakdown({ units }: FinanceBreakdownProps) {
  if (units.length === 0) return null;

  const totalBalance = units.reduce((s, u) => s + u.total_balance, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Building2 className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Financeiro por Unidade
        </h3>
        <span className="text-[11px] text-muted-foreground">
          · finanças compartilhadas
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((unit, idx) => {
          const balancePercent =
            totalBalance > 0 ? (unit.total_balance / totalBalance) * 100 : 0;

          return (
            <motion.div
              key={unit.church_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.2 }}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {unit.church_name}
                </p>
                {idx === 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium shrink-0">
                    Matriz
                  </span>
                )}
              </div>

              {/* Saldo */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="size-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Saldo
                  </span>
                </div>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {formatCurrency(unit.total_balance)}
                </p>
                {/* Progress bar share */}
                <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${balancePercent}%` }}
                    transition={{ delay: idx * 0.06 + 0.2, duration: 0.4 }}
                    className="h-full bg-primary-400 rounded-full"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {balancePercent.toFixed(0)}% do total consolidado
                </p>
              </div>

              {/* Receitas / Despesas */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <TrendingUp className="size-3 text-green-500" />
                    <span className="text-[10px] text-muted-foreground">
                      Entradas
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 tabular-nums">
                    {formatCurrency(unit.annual_income)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <TrendingDown className="size-3 text-red-500" />
                    <span className="text-[10px] text-muted-foreground">
                      Saídas
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 tabular-nums">
                    {formatCurrency(unit.annual_expenses)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
