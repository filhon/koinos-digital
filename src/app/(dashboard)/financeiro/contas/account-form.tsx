"use client";

import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAccount, updateAccount } from "@/actions/financeiro";
import {
  createAccountSchema,
  type CreateAccountInput,
  type AccountRow,
} from "@/lib/validators/financeiro";
import { cn } from "@/lib/utils";

interface AccountFormProps {
  account?: AccountRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AccountForm({
  account,
  onSuccess,
  onCancel,
}: AccountFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEdit = !!account;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAccountInput>({
    resolver: zodResolver(
      createAccountSchema
    ) as unknown as Resolver<CreateAccountInput>,
    defaultValues: {
      name: account?.name ?? "",
      description: account?.description ?? "",
      bank: account?.bank ?? "",
      agency: account?.agency ?? "",
      account_number: "",
      initial_balance: account?.initial_balance ?? 0,
    },
  });

  function onSubmit(data: CreateAccountInput) {
    startTransition(async () => {
      let result;
      if (isEdit) {
        result = await updateAccount({ id: account.id, ...data });
      } else {
        result = await createAccount(data);
      }

      if (!result || "code" in result) {
        toast.error("Sem permissão.");
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(isEdit ? "Conta atualizada!" : "Conta criada!");
      onSuccess();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome da conta *</Label>
        <Input
          id="name"
          placeholder="ex: Caixa Principal, Conta Bradesco"
          {...register("name")}
          className={cn(errors.name && "border-error")}
        />
        {errors.name && (
          <p className="text-xs text-error">{errors.name.message}</p>
        )}
      </div>

      {/* Banco + Agência */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bank">Banco</Label>
          <Input id="bank" placeholder="ex: Bradesco" {...register("bank")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="agency">Agência</Label>
          <Input id="agency" placeholder="ex: 1234-5" {...register("agency")} />
        </div>
      </div>

      {/* Número da conta */}
      <div className="space-y-1.5">
        <Label htmlFor="account_number">
          Número da conta
          <span className="ml-1.5 text-xs text-muted-foreground font-normal">
            (criptografado com AES-256)
          </span>
        </Label>
        <Input
          id="account_number"
          type="password"
          placeholder={
            isEdit ? "Deixe em branco para não alterar" : "ex: 12345-6"
          }
          {...register("account_number")}
        />
      </div>

      {/* Saldo inicial */}
      {!isEdit && (
        <div className="space-y-1.5">
          <Label htmlFor="initial_balance">Saldo inicial (R$)</Label>
          <Input
            id="initial_balance"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            {...register("initial_balance")}
            className={cn(errors.initial_balance && "border-error")}
          />
          {errors.initial_balance && (
            <p className="text-xs text-error">
              {errors.initial_balance.message}
            </p>
          )}
        </div>
      )}

      {/* Descrição */}
      <div className="space-y-1.5">
        <Label htmlFor="description">
          Descrição{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="description"
          placeholder="ex: Conta principal para despesas operacionais"
          {...register("description")}
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
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isEdit ? (
            "Salvar alterações"
          ) : (
            "Criar conta"
          )}
        </Button>
      </div>
    </form>
  );
}
