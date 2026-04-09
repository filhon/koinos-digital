"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  MapPin,
  Video,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import {
  updateEvent,
  updateRecurringEvents,
  deleteEvent,
  deleteRecurringEvents,
} from "@/actions/events";
import {
  createEventSchema,
  type CreateEventInput,
  type RecurringEditScope,
} from "@/lib/validators/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { EventWithResponsible } from "@/actions/events";
import type { MemberRow } from "@/actions/members";

// ─── Field wrapper ─────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}

function Field({ label, error, children, required, disabled }: FieldProps) {
  return (
    <div
      className={cn(
        "space-y-1.5",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

// ─── Scope option card ────────────────────────────────────────────────────────

interface ScopeCardProps {
  value: RecurringEditScope;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

function ScopeCard({ label, description, selected, onSelect }: ScopeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-150",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/40"
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-primary" : "border-muted-foreground/40"
        )}
      >
        {selected && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            selected ? "text-primary" : "text-foreground"
          )}
        >
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ChevronRight
        className={cn(
          "size-4 shrink-0 transition-colors",
          selected ? "text-primary" : "text-muted-foreground/40"
        )}
      />
    </button>
  );
}

// ─── EditEventForm ────────────────────────────────────────────────────────────

interface EditEventFormProps {
  event: EventWithResponsible;
  leadershipMembers: MemberRow[];
  isRecurringSeries: boolean;
}

export function EditEventForm({
  event,
  leadershipMembers,
  isRecurringSeries,
}: EditEventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  // Escopo da edição (para séries recorrentes)
  const [editScope, setEditScope] = useState<RecurringEditScope>("only_this");
  const [deleteScope, setDeleteScope] =
    useState<RecurringEditScope>("only_this");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: event.name,
      responsible_id: event.responsible_id,
      date: event.date,
      start_time: event.start_time.slice(0, 5),
      end_time: event.end_time ? event.end_time.slice(0, 5) : "",
      modality: event.modality,
      location: event.location ?? "",
      meeting_link: event.meeting_link ?? "",
      description: event.description ?? "",
      is_recurring: event.is_recurring,
    },
  });

  const modality = useWatch({ control, name: "modality" });

  // Para scopes "this_and_following" e "all", a data não pode ser editada
  const dateDisabled = isRecurringSeries && editScope !== "only_this";

  // ─── Submit de edição ───────────────────────────────────────────────────────

  const onSubmit = (data: CreateEventInput) => {
    startTransition(async () => {
      let result;

      if (!isRecurringSeries || editScope === "only_this") {
        result = await updateEvent(event.id, data);
      } else {
        result = await updateRecurringEvents(event.id, editScope, data);
      }

      if (!result || "code" in result) {
        toast.error(
          "code" in result ? result.error : "Erro ao atualizar evento"
        );
        return;
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const msg =
        editScope === "only_this"
          ? "Evento atualizado!"
          : editScope === "this_and_following"
            ? "Este e todos os próximos eventos foram atualizados!"
            : "Todos os eventos da série foram atualizados!";

      toast.success(msg);
      router.push(`/eventos/${event.id}`);
      router.refresh();
    });
  };

  // ─── Confirmar exclusão ─────────────────────────────────────────────────────

  const handleDelete = () => {
    startDeleteTransition(async () => {
      let result;

      if (!isRecurringSeries || deleteScope === "only_this") {
        result = await deleteEvent(event.id);
      } else {
        result = await deleteRecurringEvents(event.id, deleteScope);
      }

      if (!result || "code" in result) {
        toast.error("code" in result ? result.error : "Erro ao excluir evento");
        return;
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const msg =
        deleteScope === "only_this"
          ? "Evento excluído."
          : deleteScope === "this_and_following"
            ? "Este e todos os próximos foram excluídos."
            : "Toda a série foi excluída.";

      toast.success(msg);
      router.push("/eventos");
      router.refresh();
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Escopo — aparece apenas para eventos de uma série recorrente */}
      {isRecurringSeries && (
        <section className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              <RefreshCw className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Evento recorrente
              </h2>
              <p className="text-xs text-muted-foreground">
                Escolha quais eventos desta série editar
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <ScopeCard
              value="only_this"
              label="Apenas este"
              description="Somente este evento específico será alterado"
              selected={editScope === "only_this"}
              onSelect={() => setEditScope("only_this")}
            />
            <ScopeCard
              value="this_and_following"
              label="Este e todos os próximos"
              description="Este evento e todos que vierem após ele na série"
              selected={editScope === "this_and_following"}
              onSelect={() => setEditScope("this_and_following")}
            />
            <ScopeCard
              value="all"
              label="Todos"
              description="Todos os eventos desta série recorrente"
              selected={editScope === "all"}
              onSelect={() => setEditScope("all")}
            />
          </div>

          {dateDisabled && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
              <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                A data não pode ser alterada ao editar múltiplos eventos da
                série.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações básicas */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
            Informações básicas
          </h2>

          <Field label="Nome do evento" error={errors.name?.message} required>
            <Input {...register("name")} autoComplete="off" />
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

          <Field
            label="Data"
            error={errors.date?.message}
            required
            disabled={dateDisabled}
          >
            <Input {...register("date")} type="date" disabled={dateDisabled} />
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
                type="url"
                inputMode="url"
                placeholder="https://meet.google.com/xxx"
              />
            </Field>
          )}
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending || isDeletePending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending || isDeletePending}
          >
            Cancelar
          </Button>
        </div>
      </form>

      {/* Zona de exclusão */}
      <section className="rounded-xl border border-error/30 bg-error/5 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-error uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="size-3.5" />
          Zona de risco
        </h2>

        {!showDeleteConfirm ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {isRecurringSeries
                ? "Excluir este evento e/ou todos da série. Ação irreversível."
                : "Excluir este evento permanentemente. Ação irreversível."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending || isDeletePending}
              className="border-error/40 text-error hover:bg-error/10 hover:border-error shrink-0"
            >
              <Trash2 className="size-3.5" />
              Excluir
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {isRecurringSeries && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">
                  Quais eventos excluir?
                </p>
                {(
                  [
                    {
                      value: "only_this" as RecurringEditScope,
                      label: "Apenas este",
                      description: "Remove somente este evento",
                    },
                    {
                      value: "this_and_following" as RecurringEditScope,
                      label: "Este e todos os próximos",
                      description: "Remove a partir deste até o fim da série",
                    },
                    {
                      value: "all" as RecurringEditScope,
                      label: "Todos",
                      description: "Remove toda a série recorrente",
                    },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <input
                      type="radio"
                      checked={deleteScope === opt.value}
                      onChange={() => setDeleteScope(opt.value)}
                      className="accent-error"
                    />
                    <span className="text-sm text-foreground">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">
                      — {opt.description}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <p className="text-xs text-error font-medium">
              Tem certeza? Esta ação não pode ser desfeita.
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleDelete}
                disabled={isDeletePending || isPending}
                className="bg-error text-white hover:bg-error/90"
              >
                {isDeletePending && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                {isDeletePending ? "Excluindo..." : "Confirmar exclusão"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletePending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
