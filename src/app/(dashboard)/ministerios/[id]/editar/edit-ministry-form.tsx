"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Users, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMinistry } from "@/actions/ministries";
import {
  updateMinistrySchema,
  type UpdateMinistryInput,
} from "@/lib/validators/ministries";

interface MemberOption {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

interface EditMinistryFormProps {
  ministryId: string;
  defaultValues: {
    name: string;
    counselor_id: string;
    leader_id: string;
  };
  counselorOptions: MemberOption[];
  leaderOptions: MemberOption[];
}

const ROLE_LABELS: Record<string, string> = {
  pastor: "Pastor",
  presbítero: "Presbítero",
  diácono: "Diácono",
  líder: "Líder",
};

export function EditMinistryForm({
  ministryId,
  defaultValues,
  counselorOptions,
  leaderOptions,
}: EditMinistryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateMinistryInput>({
    resolver: zodResolver(updateMinistrySchema),
    defaultValues,
  });

  const onSubmit = (data: UpdateMinistryInput) => {
    startTransition(async () => {
      const result = await updateMinistry(ministryId, data);

      if (!result || "code" in result) {
        toast.error("code" in result ? result.error : "Erro inesperado");
        return;
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Ministério atualizado!");
      router.push(`/ministerios/${ministryId}`);
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-border bg-card p-6 space-y-6"
    >
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-1.5">
          <Users className="size-3.5 text-muted-foreground" />
          Nome do ministério
          <span className="text-destructive ml-0.5">*</span>
        </Label>
        <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Conselheiro */}
        <div className="space-y-2">
          <Label htmlFor="counselor_id" className="flex items-center gap-1.5">
            <Shield className="size-3.5 text-muted-foreground" />
            Conselheiro
          </Label>
          <select
            id="counselor_id"
            {...register("counselor_id")}
            className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
          >
            <option value="">Sem conselheiro</option>
            {counselorOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({ROLE_LABELS[m.role] ?? m.role})
              </option>
            ))}
          </select>
        </div>

        {/* Líder */}
        <div className="space-y-2">
          <Label htmlFor="leader_id" className="flex items-center gap-1.5">
            <Crown className="size-3.5 text-muted-foreground" />
            Líder
          </Label>
          <select
            id="leader_id"
            {...register("leader_id")}
            className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
          >
            <option value="">Sem líder</option>
            {leaderOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({ROLE_LABELS[m.role] ?? m.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-border/60">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Salvar alterações
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/ministerios/${ministryId}`)}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
