"use client";

import { useTransition, useOptimistic } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar, Clock, CheckCircle2, Circle, CalendarX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { upsertScaleMember, removeScaleMember } from "@/actions/scales";
import type { EventScaleSummary, MemberSummary } from "@/actions/ministries";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function formatEventDate(dateStr: string) {
  const date = parseISO(dateStr);
  return {
    weekday: format(date, "EEE", { locale: ptBR }),
    day: format(date, "dd"),
    month: format(date, "MMM", { locale: ptBR }),
  };
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

// ─── Member Toggle Row ────────────────────────────────────────────────────────

interface MemberToggleRowProps {
  member: MemberSummary;
  eventMinistryId: string;
  isAssigned: boolean;
  canEdit: boolean;
}

function MemberToggleRow({
  member,
  eventMinistryId,
  isAssigned,
  canEdit,
}: MemberToggleRowProps) {
  const [optimisticAssigned, setOptimisticAssigned] = useOptimistic(isAssigned);
  const [, startTransition] = useTransition();

  const handleToggle = () => {
    if (!canEdit) return;

    const next = !optimisticAssigned;

    startTransition(async () => {
      setOptimisticAssigned(next);

      const result = next
        ? await upsertScaleMember({ eventMinistryId, memberId: member.id })
        : await removeScaleMember({ eventMinistryId, memberId: member.id });

      if (!result || result.error || "code" in result) {
        setOptimisticAssigned(!next); // reverte
        toast.error(
          "code" in (result ?? {})
            ? (result as { error: string }).error
            : (result?.error ?? "Erro ao atualizar escala")
        );
      }
    });
  };

  return (
    <div className="flex items-center gap-3 py-1.5">
      {canEdit ? (
        <button
          onClick={handleToggle}
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
          title={
            optimisticAssigned ? "Remover da escala" : "Adicionar à escala"
          }
        >
          {optimisticAssigned ? (
            <CheckCircle2 className="size-4 text-primary" />
          ) : (
            <Circle className="size-4" />
          )}
        </button>
      ) : (
        <span className="shrink-0">
          {optimisticAssigned ? (
            <CheckCircle2 className="size-4 text-primary" />
          ) : (
            <Circle className="size-4 text-muted-foreground/40" />
          )}
        </span>
      )}

      <Avatar size="sm" className="shrink-0">
        {member.avatar_url && (
          <AvatarImage src={member.avatar_url} alt={member.name} />
        )}
        <AvatarFallback className="text-[9px] bg-primary-50 text-primary-700">
          {getInitials(member.name)}
        </AvatarFallback>
      </Avatar>

      <Link
        href={`/membros/${member.id}`}
        className="text-sm hover:text-primary transition-colors truncate"
      >
        {member.name}
      </Link>
    </div>
  );
}

// ─── Scales Panel ─────────────────────────────────────────────────────────────

interface ScalesPanelProps {
  ministryId: string;
  ministryMembers: MemberSummary[];
  eventScales: EventScaleSummary[];
  canEdit: boolean;
}

export function ScalesPanel({
  ministryMembers,
  eventScales,
  canEdit,
}: ScalesPanelProps) {
  if (eventScales.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border/60">
          <h3 className="text-sm font-semibold">Escalas</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Próximos eventos deste ministério
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 py-12 text-center px-5">
          <CalendarX className="size-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Nenhum evento futuro com este ministério escalado.
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            Associe este ministério a um evento na página de{" "}
            <Link href="/eventos" className="underline hover:text-primary">
              Eventos
            </Link>
            .
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {eventScales.map((es) => {
        const { weekday, day, month } = formatEventDate(es.event.date);

        return (
          <div
            key={es.event_ministry_id}
            className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
          >
            {/* Event header */}
            <div className="flex items-center gap-4 px-4 py-3 border-b border-border/60 bg-muted/20">
              {/* Date strip */}
              <div className="flex shrink-0 flex-col items-center gap-0.5 bg-primary/5 rounded-lg px-2.5 py-2 min-w-[44px] text-center">
                <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                  {weekday}
                </span>
                <span className="text-lg font-bold leading-none text-foreground">
                  {day}
                </span>
                <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                  {month}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/eventos/${es.event.id}`}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate block"
                >
                  {es.event.name}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    {formatTime(es.event.start_time)}
                    {es.event.end_time && ` – ${formatTime(es.event.end_time)}`}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    <Calendar className="inline size-3 mr-0.5 -mt-px" />
                    {es.assigned_member_ids.length} escalado
                    {es.assigned_member_ids.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Members list */}
            <div className="px-4 py-3">
              {ministryMembers.length === 0 ? (
                <p className="text-[11px] text-muted-foreground py-2">
                  Adicione componentes ao ministério para gerenciar a escala.
                </p>
              ) : (
                <div className="space-y-0.5">
                  {canEdit && (
                    <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                      Selecione quem serve neste evento
                    </p>
                  )}
                  {ministryMembers.map((member) => (
                    <MemberToggleRow
                      key={member.id}
                      member={member}
                      eventMinistryId={es.event_ministry_id}
                      isAssigned={es.assigned_member_ids.includes(member.id)}
                      canEdit={canEdit}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
