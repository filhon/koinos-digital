"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, MapPin, Video, RefreshCw } from "lucide-react";
import { createEvent } from "@/actions/events";
import {
  createEventSchema,
  type CreateEventInput,
} from "@/lib/validators/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { MemberRow } from "@/actions/members";

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

interface EventFormProps {
  leadershipMembers: MemberRow[];
}

export function EventForm({ leadershipMembers }: EventFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      modality: "presencial",
      is_recurring: false,
    },
  });

  const modality = useWatch({ control, name: "modality" });
  const isRecurring = useWatch({ control, name: "is_recurring" });

  const onSubmit = async (data: CreateEventInput) => {
    const result = await createEvent(data);

    if (!result || "code" in result || result.error) {
      toast.error(
        ("error" in result ? result.error : null) ?? "Erro ao criar evento"
      );
      return;
    }

    toast.success("Evento criado com sucesso!");
    router.push(`/eventos/${result.data?.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informações básicas */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
          Informações básicas
        </h2>

        <Field label="Nome do evento" error={errors.name?.message} required>
          <Input
            {...register("name")}
            placeholder="Culto de celebração"
            autoComplete="off"
          />
        </Field>

        <Field
          label="Responsável"
          error={errors.responsible_id?.message}
          required
        >
          <select
            {...register("responsible_id")}
            className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
          >
            <option value="">Selecione o responsável</option>
            {leadershipMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Descrição" error={errors.description?.message}>
          <textarea
            {...register("description")}
            placeholder="Informações adicionais sobre o evento..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors resize-none"
          />
        </Field>
      </section>

      {/* Data e horário */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
          Data e horário
        </h2>

        <Field label="Data" error={errors.date?.message} required>
          <Input {...register("date")} type="date" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Horário de início"
            error={errors.start_time?.message}
            required
          >
            <Input {...register("start_time")} type="time" />
          </Field>

          <Field label="Horário de término" error={errors.end_time?.message}>
            <Input {...register("end_time")} type="time" />
          </Field>
        </div>
      </section>

      {/* Modalidade */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
          Modalidade
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              setValue("modality", "presencial", { shouldValidate: true })
            }
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-sm font-medium transition-all duration-150",
              modality === "presencial"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <MapPin className="size-5" />
            Presencial
          </button>
          <button
            type="button"
            onClick={() =>
              setValue("modality", "online", { shouldValidate: true })
            }
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-sm font-medium transition-all duration-150",
              modality === "online"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <Video className="size-5" />
            Online
          </button>
        </div>

        {/* Campo condicional */}
        {modality === "presencial" && (
          <Field
            label="Local / endereço"
            error={errors.location?.message}
            required
          >
            <Input
              {...register("location")}
              placeholder="Rua das Flores, 123 — Recife/PE"
              autoComplete="street-address"
            />
          </Field>
        )}

        {modality === "online" && (
          <Field
            label="Link da reunião"
            error={errors.meeting_link?.message}
            required
          >
            <Input
              {...register("meeting_link")}
              placeholder="https://meet.google.com/xxx"
              type="url"
              inputMode="url"
            />
          </Field>
        )}
      </section>

      {/* Recorrência */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
              Recorrência
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Este evento se repete periodicamente
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isRecurring}
            onClick={() =>
              setValue("is_recurring", !isRecurring, { shouldValidate: true })
            }
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              isRecurring ? "bg-primary" : "bg-input"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg transition duration-200",
                isRecurring ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {isRecurring && (
          <div className="space-y-3 pt-1">
            <Field
              label="Frequência"
              error={errors.recurrence_rule?.frequency?.message}
              required
            >
              <div className="flex gap-2">
                <RefreshCw className="size-4 text-muted-foreground mt-2.5 shrink-0" />
                <select
                  {...register("recurrence_rule.frequency")}
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
                >
                  <option value="">Selecione</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                </select>
              </div>
            </Field>
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              A geração automática de instâncias será configurada em breve.
            </p>
          </div>
        )}
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
          {isSubmitting ? "Criando..." : "Criar evento"}
        </Button>
      </div>
    </form>
  );
}
