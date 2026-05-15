"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createAssembly } from "@/actions/assembleia";
import { createAssemblySchema } from "@/lib/validators/assembleia";
import type { z } from "zod";

type FormValues = z.input<typeof createAssemblySchema>;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Vote } from "lucide-react";

export function AssemblyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createAssemblySchema),
    defaultValues: { has_election: false },
  });

  const hasElection = watch("has_election");

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await createAssembly(data as any);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Assembleia criada com sucesso!");
      const id = "data" in result ? result.data?.id : null;
      router.push(`/assembleia/${id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Assembleia *</Label>
            <Input
              id="name"
              placeholder="Ex: Assembleia Geral Ordinária, Abril 2026"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-sm text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Horário *</Label>
              <Input id="start_time" type="time" {...register("start_time")} />
              {errors.start_time && (
                <p className="text-sm text-destructive">
                  {errors.start_time.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local *</Label>
            <Input
              id="location"
              placeholder="Ex: Templo principal, Salão principal"
              {...register("location")}
            />
            {errors.location && (
              <p className="text-sm text-destructive">
                {errors.location.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo / Convocação *</Label>
            <Input
              id="reason"
              placeholder="Ex: Eleição de líderes de ministério para 2026"
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agenda">Pauta (opcional)</Label>
            <Textarea
              id="agenda"
              rows={4}
              placeholder="Descreva os itens que serão tratados na assembléia..."
              {...register("agenda")}
            />
            {errors.agenda && (
              <p className="text-sm text-destructive">
                {errors.agenda.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Vote className="h-4 w-4 text-amber-500" />
                <span className="font-medium">Incluir eleição</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Habilite para criar eleições vinculadas a esta assembléia.
              </p>
            </div>
            <Switch
              checked={!!hasElection}
              onCheckedChange={(v) => setValue("has_election", v)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/assembleia")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Assembleia
        </Button>
      </div>
    </form>
  );
}
