"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateResource } from "@/actions/resources";
import {
  updateResourceSchema,
  type UpdateResourceInput,
} from "@/lib/validators/resources";
import type { ResourceWithResponsible } from "@/actions/resources";

interface MemberOption {
  id: string;
  name: string;
  role: string;
}

interface EditResourceFormProps {
  resource: ResourceWithResponsible;
  responsibleOptions: MemberOption[];
}

export function EditResourceForm({
  resource,
  responsibleOptions,
}: EditResourceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateResourceInput>({
    resolver: zodResolver(updateResourceSchema),
    defaultValues: {
      name: resource.name,
      responsible_id: resource.responsible_id ?? "",
      value: resource.value !== null ? String(resource.value) : "",
    },
  });

  const onSubmit = (data: UpdateResourceInput) => {
    startTransition(async () => {
      const result = await updateResource(resource.id, data);

      if (!result || "code" in result) {
        toast.error("code" in result ? result.error : "Erro inesperado");
        return;
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Recurso atualizado!");
      router.push(`/recursos/${resource.id}`);
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-border bg-card p-6 space-y-6"
    >
      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="name">
          Nome <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Package className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            id="name"
            placeholder="Ex: Microfone sem fio, Datashow..."
            className="pl-9"
            {...register("name")}
          />
        </div>
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Responsável */}
      <div className="space-y-1.5">
        <Label htmlFor="responsible_id">Responsável</Label>
        <select
          id="responsible_id"
          {...register("responsible_id")}
          className="w-full h-10 px-3 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="">Sem responsável</option>
          {responsibleOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.role})
            </option>
          ))}
        </select>
        {errors.responsible_id && (
          <p className="text-xs text-destructive">
            {errors.responsible_id.message}
          </p>
        )}
      </div>

      {/* Valor estimado */}
      <div className="space-y-1.5">
        <Label htmlFor="value">Valor estimado (R$)</Label>
        <Input
          id="value"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          {...register("value")}
        />
        {errors.value && (
          <p className="text-xs text-destructive">{errors.value.message}</p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Opcional. Use ponto ou vírgula como separador decimal.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Salvar alterações
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
