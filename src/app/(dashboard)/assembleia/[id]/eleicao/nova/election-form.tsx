"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createElection } from "@/actions/assembleia";
import { createElectionSchema } from "@/lib/validators/assembleia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Users, ThumbsUp, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import type { z } from "zod";

type FormValues = z.input<typeof createElectionSchema>;

interface ElectionFormProps {
  assemblyId: string;
}

export function ElectionForm({ assemblyId }: ElectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createElectionSchema),
    defaultValues: {
      assembly_id: assemblyId,
      type: "candidatos",
      allow_remote_vote: false,
      quorum: undefined,
    },
  });

  const electionType = watch("type");
  const allowRemote = watch("allow_remote_vote");

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await createElection(data as any);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Eleição criada!");
      const electionId = "data" in result ? result.data?.id : null;
      router.push(`/assembleia/${assemblyId}/eleicao/${electionId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])}
      className="space-y-6"
    >
      <input type="hidden" {...register("assembly_id")} />

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da eleição *</Label>
            <Input
              id="name"
              placeholder="Ex: Eleição de Diáconos 2026"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Descreva o objetivo desta eleição..."
              {...register("description")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tipo */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Label className="text-sm font-semibold">Tipo de votação *</Label>
          <RadioGroup
            value={electionType ?? "candidatos"}
            onValueChange={(v) =>
              setValue("type", v as "candidatos" | "sim_nao")
            }
            className="grid grid-cols-2 gap-3"
          >
            <Label
              htmlFor="type-candidatos"
              className={cn(
                "flex cursor-pointer flex-col items-start gap-1 rounded-xl border-2 p-4 transition-all",
                electionType === "candidatos"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40"
              )}
            >
              <RadioGroupItem
                id="type-candidatos"
                value="candidatos"
                className="sr-only"
              />
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Candidatos</span>
              <span className="text-xs text-muted-foreground">
                Eleitores escolhem entre candidatos cadastrados.
              </span>
            </Label>

            <Label
              htmlFor="type-sim-nao"
              className={cn(
                "flex cursor-pointer flex-col items-start gap-1 rounded-xl border-2 p-4 transition-all",
                electionType === "sim_nao"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40"
              )}
            >
              <RadioGroupItem
                id="type-sim-nao"
                value="sim_nao"
                className="sr-only"
              />
              <ThumbsUp className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Sim / Não</span>
              <span className="text-xs text-muted-foreground">
                Votação de aprovação ou rejeição de uma proposta.
              </span>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Quórum e voto remoto */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="quorum">Quórum mínimo (opcional)</Label>
            <Input
              id="quorum"
              type="number"
              min={1}
              placeholder="Padrão: 50% dos membros ativos"
              {...register("quorum", {
                setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
              })}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para calcular automaticamente (maioria simples dos
              membros ativos no momento da abertura).
            </p>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">Voto remoto</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Membros podem votar remotamente com código enviado por e-mail.
              </p>
            </div>
            <Switch
              checked={!!allowRemote}
              onCheckedChange={(v) => setValue("allow_remote_vote", v)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/assembleia/${assemblyId}`)}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Eleição
        </Button>
      </div>
    </form>
  );
}
