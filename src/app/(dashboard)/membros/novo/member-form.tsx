"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createMember } from "@/actions/members";
import {
  createMemberSchema,
  type CreateMemberInput,
} from "@/lib/validators/members";
import { formatCPF } from "@/lib/utils/cpf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { value: "membro", label: "Membro" },
  { value: "visitante", label: "Visitante" },
  { value: "líder", label: "Líder" },
  { value: "diácono", label: "Diácono" },
  { value: "tesoureiro", label: "Tesoureiro" },
  { value: "presbítero", label: "Presbítero" },
  { value: "pastor", label: "Pastor" },
] as const;

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

function Field({ label, error, children, required, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

export function MemberForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateMemberInput>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: { role: "membro" },
  });

  const onSubmit = async (data: CreateMemberInput) => {
    const result = await createMember(data);

    if (!result || !("data" in result) || !result.data) {
      toast.error(
        (result as { error: string })?.error ?? "Erro ao criar membro"
      );
      return;
    }

    toast.success("Membro cadastrado com sucesso!");
    router.push(`/membros/${result.data?.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados pessoais */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
          Dados pessoais
        </h2>

        <Field label="Nome completo" error={errors.name?.message} required>
          <Input
            {...register("name")}
            placeholder="João da Silva"
            autoComplete="name"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CPF" error={errors.cpf?.message} required>
            <Input
              {...register("cpf")}
              placeholder="000.000.000-00"
              onBlur={(e) => {
                const formatted = formatCPF(e.target.value.replace(/\D/g, ""));
                setValue("cpf", formatted, { shouldValidate: true });
              }}
              inputMode="numeric"
            />
          </Field>

          <Field label="RG" error={errors.rg?.message}>
            <Input {...register("rg")} placeholder="0000000" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="E-mail" error={errors.email?.message}>
            <Input
              {...register("email")}
              type="email"
              placeholder="joao@exemplo.com"
              autoComplete="email"
            />
          </Field>

          <Field label="Telefone / WhatsApp" error={errors.phone?.message}>
            <Input
              {...register("phone")}
              placeholder="(81) 99999-9999"
              inputMode="tel"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Data de nascimento" error={errors.birth_date?.message}>
            <Input {...register("birth_date")} type="date" />
          </Field>

          <Field label="Gênero" error={errors.gender?.message}>
            <select
              {...register("gender")}
              className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
            >
              <option value="">Não informado</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Dados eclesiásticos */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
          Dados eclesiásticos
        </h2>

        <Field label="Papel na igreja" error={errors.role?.message} required>
          <select
            {...register("role")}
            className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Data de recebimento"
            error={errors.received_at?.message}
          >
            <Input {...register("received_at")} type="date" />
          </Field>

          <Field label="Data de batismo" error={errors.baptized_at?.message}>
            <Input {...register("baptized_at")} type="date" />
          </Field>
        </div>
      </section>

      {/* Endereço */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
          Endereço{" "}
          <span className="font-normal normal-case text-muted-foreground">
            (opcional)
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="CEP" className="sm:col-span-1">
            <Input
              {...register("address.cep")}
              placeholder="00000-000"
              inputMode="numeric"
            />
          </Field>

          <Field label="Rua" className="sm:col-span-2">
            <Input {...register("address.rua")} placeholder="Rua das Flores" />
          </Field>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Número">
            <Input {...register("address.numero")} placeholder="123" />
          </Field>
          <Field label="Complemento" className="col-span-1 sm:col-span-1">
            <Input {...register("address.complemento")} placeholder="Apto 4" />
          </Field>
          <Field label="Bairro" className="col-span-2 sm:col-span-2">
            <Input {...register("address.bairro")} placeholder="Centro" />
          </Field>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Cidade" className="col-span-1 sm:col-span-2">
            <Input {...register("address.cidade")} placeholder="Recife" />
          </Field>
          <Field label="Estado">
            <Input
              {...register("address.estado")}
              placeholder="PE"
              maxLength={2}
              className="uppercase"
            />
          </Field>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Cadastrando..." : "Cadastrar membro"}
        </Button>
      </div>
    </form>
  );
}
