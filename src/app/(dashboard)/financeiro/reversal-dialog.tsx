"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils/formatters";
import { createReversal } from "@/actions/financeiro";
import {
  reversalSchema,
  type ReversalInput,
  type TransactionRow,
} from "@/lib/validators/financeiro";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReversalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionRow;
  onSuccess: () => void;
}

export function ReversalDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: ReversalDialogProps) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit } = useForm<ReversalInput>({
    resolver: zodResolver(reversalSchema),
    defaultValues: {
      transaction_id: transaction.id,
      notes: "",
    },
  });

  function onSubmit(data: ReversalInput) {
    startTransition(async () => {
      const result = await createReversal(data);
      if (!result || "code" in result) {
        toast.error("Sem permissão.");
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Estorno registrado com sucesso.");
      onSuccess();
    });
  }

  const isEntry = transaction.type === "entrada";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="size-4 text-warning" />
            Estornar transação
          </DialogTitle>
        </DialogHeader>

        {/* Warning card */}
        <div className="rounded-xl border border-warning/30 bg-warning-light/40 p-4 flex gap-3">
          <AlertTriangle className="size-4 shrink-0 text-warning-dark mt-0.5" />
          <div className="text-sm text-warning-dark space-y-1">
            <p className="font-medium">
              Esta ação criará uma transação inversa.
            </p>
            <p className="text-xs opacity-80">
              A transação original permanece imutável nos registros, conforme
              exigido para auditoria financeira.
            </p>
          </div>
        </div>

        {/* Transaction summary */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Transação a estornar
          </p>
          <p className="text-sm font-medium text-foreground">
            {transaction.description}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {format(new Date(transaction.date), "dd/MM/yyyy", {
                locale: ptBR,
              })}
            </span>
            <span
              className={
                isEntry
                  ? "text-success-dark font-bold"
                  : "text-error-dark font-bold"
              }
            >
              {isEntry ? "+" : "−"}
              {formatCurrency(transaction.value)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("transaction_id")} />

          <div className="space-y-1.5">
            <Label htmlFor="reversal-notes">
              Motivo do estorno{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <textarea
              id="reversal-notes"
              {...register("notes")}
              rows={2}
              placeholder="Descreva o motivo do estorno..."
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-warning text-white hover:bg-warning-dark"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="size-3.5 mr-1.5" />
                  Confirmar estorno
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
