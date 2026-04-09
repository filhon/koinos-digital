"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, MapPin, Video, RefreshCw, Info } from "lucide-react";
import { createEvent } from "@/actions/events";
import {
  createEventSchema,
  type CreateEventInput,
} from "@/lib/validators/events";
import { computeRecurrencePreview } from "@/lib/utils/recurrence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { MemberRow } from "@/actions/members";

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEK_DAYS = [
  { label: "Dom", value: 0 },
  { label: "Seg", value: 1 },
  { label: "Ter", value: 2 },
  { label: "Qua", value: 3 },
  { label: "Qui", value: 4 },
  { label: "Sex", value: 5 },
  { label: "Sáb", value: 6 },
];

// ─── Field wrapper ────────────────────────────────────────────────────────────

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

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg transition duration-200",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

// ─── EventForm ────────────────────────────────────────────────────────────────

interface EventFormProps {
  leadershipMembers: MemberRow[];
}

export function EventForm({ leadershipMembers }: EventFormProps) {
  const router = useRouter();
  const [endCondition, setEndCondition] = useState<"count" | "date">("count");

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
      recurrence_rule: {
        frequency: "semanal",
        interval: 1,
        days_of_week: [],
      },
    },
  });

  const modality = useWatch({ control, name: "modality" });
  const isRecurring = useWatch({ control, name: "is_recurring" });
  const frequency = useWatch({ control, name: "recurrence_rule.frequency" });
  const interval = useWatch({ control, name: "recurrence_rule.interval" });
  const watchedDaysOfWeek = useWatch({
    control,
    name: "recurrence_rule.days_of_week",
  });
  const daysOfWeek = useMemo(
    () => watchedDaysOfWeek ?? [],
    [watchedDaysOfWeek]
  );
  const endDate = useWatch({ control, name: "recurrence_rule.end_date" });
  const count = useWatch({ control, name: "recurrence_rule.count" });
  const date = useWatch({ control, name: "date" });

  // ─── Dias da semana (checkboxes) ──────────────────────────────────────────

  const toggleDay = (day: number) => {
    const current = (daysOfWeek as number[]) ?? [];
    setValue(
      "recurrence_rule.days_of_week",
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => a - b)
    );
  };

  // ─── Preview de recorrência ───────────────────────────────────────────────

  const preview = useMemo(() => {
    if (!isRecurring || !frequency || !date) return null;
    return computeRecurrencePreview(date, {
      frequency,
      interval: interval ?? 1,
      days_of_week:
        frequency === "semanal" ? (daysOfWeek as number[]) : undefined,
      end_date: endCondition === "date" ? endDate : undefined,
      count: endCondition === "count" ? (count ?? undefined) : undefined,
    });
  }, [
    isRecurring,
    frequency,
    interval,
    daysOfWeek,
    endDate,
    count,
    date,
    endCondition,
  ]);

  // ─── Submit ───────────────────────────────────────────────────────────────

  const onSubmit = async (data: CreateEventInput) => {
    // Limpar campo de encerramento não usado
    if (data.is_recurring && data.recurrence_rule) {
      if (endCondition === "count") {
        data.recurrence_rule.end_date = undefined;
      } else {
        data.recurrence_rule.count = undefined;
      }
    } else if (!data.is_recurring) {
      data.recurrence_rule = undefined;
    }

    const result = await createEvent(data);

    if (!result || "code" in result || result.error) {
      toast.error(
        ("error" in result ? result.error : null) ?? "Erro ao criar evento"
      );
      return;
    }

    toast.success(
      data.is_recurring
        ? "Evento recorrente criado com instâncias geradas!"
        : "Evento criado com sucesso!"
    );
    router.push(`/eventos/${result.data?.id}`);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

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

      {/* Repetição */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="size-3.5" />
              Repetição
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Este evento se repete periodicamente
            </p>
          </div>
          <Toggle
            checked={!!isRecurring}
            onChange={() =>
              setValue("is_recurring", !isRecurring, { shouldValidate: true })
            }
          />
        </div>

        {isRecurring && (
          <div className="space-y-4 pt-1 border-t border-border/50">
            {/* Frequência */}
            <Field
              label="Frequência"
              error={errors.recurrence_rule?.frequency?.message}
              required
            >
              <div className="grid grid-cols-2 gap-3">
                {(["semanal", "mensal"] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() =>
                      setValue("recurrence_rule.frequency", freq, {
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      "rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all duration-150 capitalize",
                      frequency === freq
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {freq === "semanal" ? "Semanal" : "Mensal"}
                  </button>
                ))}
              </div>
            </Field>

            {/* Intervalo */}
            <Field label="Repetir a cada" required>
              <div className="flex items-center gap-2">
                <Input
                  {...register("recurrence_rule.interval", {
                    valueAsNumber: true,
                  })}
                  type="number"
                  min={1}
                  max={12}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  {frequency === "semanal" ? "semana(s)" : "mês/meses"}
                </span>
              </div>
            </Field>

            {/* Dias da semana (apenas para semanal) */}
            {frequency === "semanal" && (
              <Field label="Dias da semana">
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map(({ label, value }) => {
                    const selected = (daysOfWeek as number[]).includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleDay(value)}
                        className={cn(
                          "w-10 h-10 rounded-full text-xs font-semibold border-2 transition-all duration-150",
                          selected
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Se nenhum dia for selecionado, repete no mesmo dia da semana
                  do evento.
                </p>
              </Field>
            )}

            {/* Encerramento */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Encerramento <span className="text-error ml-0.5">*</span>
              </Label>

              <div className="space-y-2">
                {/* Após N ocorrências */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={endCondition === "count"}
                    onChange={() => {
                      setEndCondition("count");
                      setValue("recurrence_rule.end_date", undefined);
                    }}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    Após N ocorrências
                  </span>
                </label>

                {endCondition === "count" && (
                  <div className="ml-6 flex items-center gap-2">
                    <Input
                      {...register("recurrence_rule.count", {
                        valueAsNumber: true,
                      })}
                      type="number"
                      min={1}
                      max={52}
                      placeholder="12"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">
                      ocorrências (máx. 52)
                    </span>
                  </div>
                )}

                {/* Em determinada data */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={endCondition === "date"}
                    onChange={() => {
                      setEndCondition("date");
                      setValue("recurrence_rule.count", undefined);
                    }}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    Em determinada data
                  </span>
                </label>

                {endCondition === "date" && (
                  <div className="ml-6">
                    <Input
                      {...register("recurrence_rule.end_date")}
                      type="date"
                      className="w-auto"
                    />
                  </div>
                )}
              </div>

              {errors.recurrence_rule?.end_date?.message && (
                <p className="text-xs text-error">
                  {errors.recurrence_rule.end_date.message}
                </p>
              )}
            </div>

            {/* Preview */}
            {preview && (
              <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5">
                <Info className="size-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary">
                  Este evento se repetirá{" "}
                  <strong>
                    {preview.count} {preview.count === 1 ? "vez" : "vezes"}
                  </strong>{" "}
                  até{" "}
                  <strong>
                    {format(preview.lastDate, "dd/MM/yyyy", { locale: ptBR })}
                  </strong>
                  .
                </p>
              </div>
            )}
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
