"use client";

import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTransaction } from "@/actions/financeiro";
import {
  createTransactionSchema,
  TRANSACTION_CATEGORIES,
  type CreateTransactionInput,
  type TransactionType,
  type AccountRow,
} from "@/lib/validators/financeiro";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  dízimos: "Dízimos",
  ofertas: "Ofertas",
  doações: "Doações",
  eventos: "Eventos",
  aluguel: "Aluguel",
  utilities: "Utilidades",
  salários: "Salários",
  manutenção: "Manutenção",
  missões: "Missões",
  projetos: "Projetos",
  outros: "Outros",
};

interface TransactionFormProps {
  type: TransactionType;
  accounts: AccountRow[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({
  type,
  accounts,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(
      createTransactionSchema
    ) as unknown as Resolver<CreateTransactionInput>,
    defaultValues: {
      type,
      date: today,
      account_id: accounts[0]?.id ?? "",
      category: "dízimos",
    },
  });

  function onSubmit(data: CreateTransactionInput) {
    startTransition(async () => {
      const result = await createTransaction({ ...data, type });
      if (!result || "code" in result) {
        toast.error("Sem permissão.");
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        type === "entrada" ? "Entrada registrada!" : "Saída registrada!"
      );
      onSuccess();
    });
  }

  const isEntry = type === "entrada";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Conta */}
      <div className="space-y-1.5">
        <Label htmlFor="account_id">Conta</Label>
        <select
          id="account_id"
          {...register("account_id")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {errors.account_id && (
          <p className="text-xs text-error">{errors.account_id.message}</p>
        )}
      </div>

      {/* Data + Valor */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            {...register("date")}
            className={cn(errors.date && "border-error")}
          />
          {errors.date && (
            <p className="text-xs text-error">{errors.date.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="value">
            Valor (R$)
            <span
              className={cn(
                "ml-2 text-xs font-medium",
                isEntry ? "text-success-dark" : "text-error-dark"
              )}
            >
              {isEntry ? "entrada" : "saída"}
            </span>
          </Label>
          <Input
            id="value"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            {...register("value")}
            className={cn(errors.value && "border-error")}
          />
          {errors.value && (
            <p className="text-xs text-error">{errors.value.message}</p>
          )}
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          placeholder={
            isEntry
              ? "ex: Dízimo — culto domingo"
              : "ex: Conta de energia — abril"
          }
          {...register("description")}
          className={cn(errors.description && "border-error")}
        />
        {errors.description && (
          <p className="text-xs text-error">{errors.description.message}</p>
        )}
      </div>

      {/* Categoria */}
      <div className="space-y-1.5">
        <Label htmlFor="category">Categoria</Label>
        <select
          id="category"
          {...register("category")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {TRANSACTION_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c] ?? c}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-xs text-error">{errors.category.message}</p>
        )}
      </div>

      {/* Observações */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">
          Observações{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <textarea
          id="notes"
          {...register("notes")}
          rows={2}
          placeholder="Informações adicionais..."
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className={cn(
            isEntry
              ? "bg-success text-white hover:bg-success-dark"
              : "bg-error text-white hover:bg-error-dark"
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isEntry ? (
            "Registrar entrada"
          ) : (
            "Registrar saída"
          )}
        </Button>
      </div>
    </form>
  );
}
