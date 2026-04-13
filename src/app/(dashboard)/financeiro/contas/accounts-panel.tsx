"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Wallet, Building2, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils/formatters";
import { deleteAccount } from "@/actions/financeiro";
import { AccountForm } from "./account-form";
import { cn } from "@/lib/utils";
import type { AccountRow } from "@/lib/validators/financeiro";
import Link from "next/link";

interface AccountsPanelProps {
  accounts: AccountRow[];
  canWrite: boolean;
}

export function AccountsPanel({
  accounts: initial,
  canWrite,
}: AccountsPanelProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AccountRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const totalBalance = accounts.reduce((s, a) => s + a.current_balance, 0);

  function onFormSuccess() {
    setFormOpen(false);
    setEditTarget(null);
    router.refresh();
  }

  function handleDelete(account: AccountRow) {
    if (
      !confirm(
        `Deseja excluir a conta "${account.name}"? Esta ação não pode ser desfeita.`
      )
    )
      return;

    startTransition(async () => {
      setDeletingId(account.id);
      const result = await deleteAccount(account.id);
      setDeletingId(null);

      if (!result || "code" in result) {
        toast.error("Sem permissão.");
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Conta removida.");
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
    });
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {accounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-primary-800 p-5 text-white"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-primary-200">
            Saldo consolidado
          </p>
          <p className="mt-1 text-3xl font-bold font-display tracking-tight">
            {formatCurrency(totalBalance)}
          </p>
          <p className="mt-1 text-xs text-primary-300">
            {accounts.length} conta{accounts.length !== 1 ? "s" : ""}
          </p>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Contas bancárias
        </h2>
        {canWrite && (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="size-3.5 mr-1.5" />
            Nova conta
          </Button>
        )}
      </div>

      {/* List */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Wallet className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Nenhuma conta cadastrada
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              Cadastre a primeira conta bancária ou caixa da igreja.
            </p>
          </div>
          {canWrite && (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5 mr-1.5" />
              Criar conta
            </Button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {accounts.map((account, i) => (
              <AccountCard
                key={account.id}
                account={account}
                index={i}
                canWrite={canWrite}
                isDeleting={deletingId === account.id}
                onEdit={() => setEditTarget(account)}
                onDelete={() => handleDelete(account)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Create form modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova conta</DialogTitle>
          </DialogHeader>
          <AccountForm
            onSuccess={onFormSuccess}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit form modal */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar conta</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <AccountForm
              account={editTarget}
              onSuccess={onFormSuccess}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Account Card ─────────────────────────────────────────────────────────────

function AccountCard({
  account,
  index,
  canWrite,
  isDeleting,
  onEdit,
  onDelete,
}: {
  account: AccountRow;
  index: number;
  canWrite: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPositive = account.current_balance >= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group relative rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          <Building2 className="size-5" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-foreground truncate">
              {account.name}
            </p>
            <p
              className={cn(
                "text-lg font-bold font-display tabular-nums shrink-0",
                isPositive ? "text-success-dark" : "text-error-dark"
              )}
            >
              {formatCurrency(account.current_balance)}
            </p>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {account.bank && <span>{account.bank}</span>}
            {account.agency && (
              <>
                <span>·</span>
                <span>Ag. {account.agency}</span>
              </>
            )}
            {account.account_number_masked && (
              <>
                <span>·</span>
                <span>Conta {account.account_number_masked}</span>
              </>
            )}
            {account.description && (
              <>
                <span>·</span>
                <span className="italic">{account.description}</span>
              </>
            )}
          </div>

          <div className="mt-1.5 text-xs text-muted-foreground">
            Saldo inicial: {formatCurrency(account.initial_balance)}
          </div>
        </div>
      </div>

      {/* Actions */}
      {canWrite && (
        <div className="absolute right-3 top-3 hidden group-hover:flex items-center gap-1">
          <button
            onClick={onEdit}
            title="Editar conta"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            title="Excluir conta"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-error-light hover:text-error-dark transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Link to transactions filtered by account */}
      <Link
        href={`/financeiro?account_id=${account.id}`}
        className="absolute inset-0 rounded-xl opacity-0"
        aria-label={`Ver transações de ${account.name}`}
      />
    </motion.div>
  );
}
