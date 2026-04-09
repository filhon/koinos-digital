"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Music2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMusicGroup } from "@/actions/music-groups";
import {
  updateMusicGroupSchema,
  type UpdateMusicGroupInput,
} from "@/lib/validators/music-groups";
import type { MusicGroupFull } from "@/actions/music-groups";

interface MemberOption {
  id: string;
  name: string;
  role: string;
}

interface EditMusicGroupFormProps {
  group: MusicGroupFull;
  leaderOptions: MemberOption[];
}

const ROLE_LABELS: Record<string, string> = {
  pastor: "Pastor",
  presbítero: "Presbítero",
  diácono: "Diácono",
  líder: "Líder",
  membro: "Membro",
};

export function EditMusicGroupForm({
  group,
  leaderOptions,
}: EditMusicGroupFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateMusicGroupInput>({
    resolver: zodResolver(updateMusicGroupSchema),
    defaultValues: {
      name: group.name,
      leader_id: group.leader_id ?? "",
    },
  });

  const onSubmit = (data: UpdateMusicGroupInput) => {
    startTransition(async () => {
      const result = await updateMusicGroup(group.id, data);

      if (!result || "code" in result) {
        toast.error("code" in result ? result.error : "Erro inesperado");
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Grupo musical atualizado!");
      router.push(`/grupos-musicais/${group.id}`);
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
          <Music2 className="size-3.5 text-muted-foreground" />
          Nome do grupo
          <span className="text-destructive ml-0.5">*</span>
        </Label>
        <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Líder */}
      <div className="space-y-2">
        <Label htmlFor="leader_id" className="flex items-center gap-1.5">
          <Crown className="size-3.5 text-muted-foreground" />
          Líder
          <span className="text-xs text-muted-foreground font-normal ml-1">
            (opcional)
          </span>
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

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-border/60">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Salvar alterações
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/grupos-musicais/${group.id}`)}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
