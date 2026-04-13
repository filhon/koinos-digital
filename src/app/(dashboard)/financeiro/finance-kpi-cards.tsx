"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import type { FinanceKPIs } from "@/lib/validators/financeiro";

interface FinanceKPICardsProps {
  kpis: FinanceKPIs;
}

interface KPICardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  variant: "balance" | "income" | "expense" | "net";
  delay: number;
}

function KPICard({ label, value, icon: Icon, variant, delay }: KPICardProps) {
  const variantClasses = {
    balance: {
      wrapper: "bg-primary-800 text-white",
      icon: "bg-primary-700 text-primary-200",
      value: "text-white",
      label: "text-primary-200",
    },
    income: {
      wrapper: "bg-card border border-border",
      icon: "bg-success-light text-success-dark",
      value: "text-success-dark",
      label: "text-muted-foreground",
    },
    expense: {
      wrapper: "bg-card border border-border",
      icon: "bg-error-light text-error-dark",
      value: "text-error-dark",
      label: "text-muted-foreground",
    },
    net: {
      wrapper: "bg-card border border-border",
      icon: `${value >= 0 ? "bg-success-light text-success-dark" : "bg-error-light text-error-dark"}`,
      value: value >= 0 ? "text-success-dark" : "text-error-dark",
      label: "text-muted-foreground",
    },
  };

  const cls = variantClasses[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={cn(
        "rounded-2xl p-5 shadow-sm flex flex-col gap-3",
        cls.wrapper
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "text-xs font-medium tracking-wide uppercase",
            cls.label
          )}
        >
          {label}
        </span>
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-xl",
            cls.icon
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <p
        className={cn(
          "text-2xl font-bold font-display tracking-tight",
          cls.value
        )}
      >
        {formatCurrency(value)}
      </p>
    </motion.div>
  );
}

export function FinanceKPICards({ kpis }: FinanceKPICardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="col-span-2 sm:col-span-1">
        <KPICard
          label="Saldo total"
          value={kpis.total_balance}
          icon={Wallet}
          variant="balance"
          delay={0}
        />
      </div>
      <KPICard
        label="Receitas do ano"
        value={kpis.annual_income}
        icon={TrendingUp}
        variant="income"
        delay={0.08}
      />
      <KPICard
        label="Despesas do ano"
        value={kpis.annual_expenses}
        icon={TrendingDown}
        variant="expense"
        delay={0.14}
      />
      <KPICard
        label="Saldo do ano"
        value={kpis.net_annual}
        icon={BarChart3}
        variant="net"
        delay={0.2}
      />
    </div>
  );
}
