"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  RotateCcw,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { listTransactions } from "@/actions/financeiro";
import { TransactionForm } from "./transaction-form";
import { ReversalDialog } from "./reversal-dialog";
import type {
  AccountRow,
  TransactionRow,
  ListTransactionsInput,
  TransactionType,
} from "@/lib/validators/financeiro";

const CATEGORIES = [
  "dízimos",
  "ofertas",
  "doações",
  "eventos",
  "aluguel",
  "utilities",
  "salários",
  "manutenção",
  "missões",
  "projetos",
  "outros",
];

interface TransactionsPanelProps {
  initialFilters: ListTransactionsInput;
  accounts: AccountRow[];
  canWrite: boolean;
}

export function TransactionsPanel({
  initialFilters,
  accounts,
  canWrite,
}: TransactionsPanelProps) {
  const router = useRouter();

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<TransactionType>("entrada");
  const [reversalOpen, setReversalOpen] = useState(false);
  const [reversalTarget, setReversalTarget] = useState<TransactionRow | null>(
    null
  );
  const [showFilters, setShowFilters] = useState(false);

  // Transactions state (server data refreshed client-side)
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(initialFilters.page ?? 1);

  // Filters
  const [filterAccount, setFilterAccount] = useState(
    initialFilters.account_id ?? ""
  );
  const [filterType, setFilterType] = useState<string>(
    initialFilters.type ?? ""
  );
  const [filterCategory, setFilterCategory] = useState(
    initialFilters.category ?? ""
  );
  const [filterFrom, setFilterFrom] = useState(initialFilters.date_from ?? "");
  const [filterTo, setFilterTo] = useState(initialFilters.date_to ?? "");

  const limit = 20;

  const load = useCallback(
    async (p: number = page) => {
      const result = await listTransactions({
        account_id: filterAccount || undefined,
        type: (filterType as TransactionType) || undefined,
        category: filterCategory || undefined,
        date_from: filterFrom || undefined,
        date_to: filterTo || undefined,
        page: p,
        limit,
      });
      if (result && "data" in result && result.data) {
        setTransactions(result.data.transactions);
        setTotal(result.data.total);
      }
      setLoaded(true);
    },
    [filterAccount, filterType, filterCategory, filterFrom, filterTo, page]
  );

  // Load on mount
  useEffect(() => {
    let active = true;
    if (!loaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load(page).then(() => {
        if (!active) return;
        // The state updates are handled in load()
      });
    }
    return () => {
      active = false;
    };
  }, [loaded, load, page]);

  function applyFilters() {
    setPage(1);
    setLoaded(false);
  }

  function clearFilters() {
    setFilterAccount("");
    setFilterType("");
    setFilterCategory("");
    setFilterFrom("");
    setFilterTo("");
    setPage(1);
    setLoaded(false);
    setShowFilters(false);
  }

  function openForm(type: TransactionType) {
    setFormType(type);
    setFormOpen(true);
  }

  function openReversal(tx: TransactionRow) {
    setReversalTarget(tx);
    setReversalOpen(true);
  }

  function onSuccess() {
    setFormOpen(false);
    setReversalOpen(false);
    setLoaded(false);
    router.refresh();
  }

  const totalPages = Math.ceil(total / limit);
  const hasFilters = !!(
    filterAccount ||
    filterType ||
    filterCategory ||
    filterFrom ||
    filterTo
  );

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">
            Transações
          </h2>
          {total > 0 && (
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              {total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(hasFilters && "border-accent-500 text-accent-600")}
          >
            <Filter className="size-3.5 mr-1.5" />
            Filtros
            {hasFilters && (
              <span className="ml-1.5 flex size-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                !
              </span>
            )}
          </Button>
          {canWrite && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openForm("saída")}
                className="border-error/30 text-error-dark hover:bg-error-light"
              >
                <Minus className="size-3.5 mr-1" />
                Saída
              </Button>
              <Button
                size="sm"
                onClick={() => openForm("entrada")}
                className="bg-success text-white hover:bg-success-dark"
              >
                <Plus className="size-3.5 mr-1" />
                Entrada
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {/* Conta */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Conta
                  </label>
                  <select
                    value={filterAccount}
                    onChange={(e) => setFilterAccount(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Todas as contas</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Tipo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tipo
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Todos</option>
                    <option value="entrada">Entradas</option>
                    <option value="saída">Saídas</option>
                  </select>
                </div>
                {/* Categoria */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Categoria
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Todas</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Data de */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    De
                  </label>
                  <input
                    type="date"
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {/* Data até */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Até
                  </label>
                  <input
                    type="date"
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="size-3.5 mr-1" />
                  Limpar
                </Button>
                <Button size="sm" onClick={applyFilters}>
                  Aplicar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions list */}
      {!loaded ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Receipt className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Nenhuma transação encontrada
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              {hasFilters
                ? "Tente ajustar os filtros."
                : "Registre a primeira movimentação financeira."}
            </p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-1.5">
            {transactions.map((tx, i) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                index={i}
                canWrite={canWrite}
                onReversal={() => openReversal(tx)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const p = page - 1;
              setPage(p);
              load(p);
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              const p = page + 1;
              setPage(p);
              load(p);
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Transaction Form Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formType === "entrada" ? "Nova entrada" : "Nova saída"}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            type={formType}
            accounts={accounts}
            onSuccess={onSuccess}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Reversal Dialog */}
      {reversalTarget && (
        <ReversalDialog
          open={reversalOpen}
          onOpenChange={setReversalOpen}
          transaction={reversalTarget}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({
  transaction: tx,
  index,
  canWrite,
  onReversal,
}: {
  transaction: TransactionRow;
  index: number;
  canWrite: boolean;
  onReversal: () => void;
}) {
  const isEntry = tx.type === "entrada";
  const isReversal = !!tx.reversal_of;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={cn(
        "group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/50",
        isReversal && "border-warning/30 bg-warning-light/20"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          isEntry
            ? "bg-success-light text-success-dark"
            : "bg-error-light text-error-dark"
        )}
      >
        {isEntry ? (
          <ArrowUpCircle className="size-4" />
        ) : (
          <ArrowDownCircle className="size-4" />
        )}
      </div>

      {/* Description + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {tx.description}
          </p>
          {isReversal && (
            <Badge
              variant="outline"
              className="shrink-0 text-[10px] border-warning/50 text-warning-dark"
            >
              estorno
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {format(new Date(tx.date), "dd/MM/yyyy", { locale: ptBR })}
          </span>
          <span>·</span>
          <span>{tx.account_name}</span>
          <span>·</span>
          <span className="capitalize">{tx.category}</span>
          {tx.receipt_url && (
            <>
              <span>·</span>
              <a
                href={tx.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-primary-500 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Receipt className="size-3" />
                comprovante
              </a>
            </>
          )}
        </div>
      </div>

      {/* Value + actions */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            isEntry ? "text-success-dark" : "text-error-dark"
          )}
        >
          {isEntry ? "+" : "−"}
          {formatCurrency(tx.value)}
        </span>
        {canWrite && !isReversal && (
          <button
            onClick={onReversal}
            title="Estornar transação"
            className="hidden group-hover:flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <RotateCcw className="size-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
