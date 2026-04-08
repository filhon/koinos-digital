"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Clock3,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CalendarMonth } from "@/components/modules/agenda/CalendarMonth";
import { CalendarWeek } from "@/components/modules/agenda/CalendarWeek";
import { listEventsInRange } from "@/actions/agenda";
import type { EventWithResponsible } from "@/actions/events";
import { cn } from "@/lib/utils";

type ViewMode = "mensal" | "semanal";
type UnitFilter = "todos" | "minha-unidade";

interface AgendaViewProps {
  initialEvents: EventWithResponsible[];
  initialDate: Date;
  isLeadership: boolean;
}

export function AgendaView({
  initialEvents,
  initialDate,
  isLeadership,
}: AgendaViewProps) {
  const [view, setView] = useState<ViewMode>("mensal");
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [unitFilter, setUnitFilter] = useState<UnitFilter>("todos");
  const [events, setEvents] = useState<EventWithResponsible[]>(initialEvents);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calcula o range visível para a view/data atual
  const getVisibleRange = useCallback(
    (date: Date, viewMode: ViewMode): { dateFrom: string; dateTo: string } => {
      if (viewMode === "mensal") {
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
        return {
          dateFrom: format(calStart, "yyyy-MM-dd"),
          dateTo: format(calEnd, "yyyy-MM-dd"),
        };
      } else {
        const weekStart = startOfWeek(date, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
        return {
          dateFrom: format(weekStart, "yyyy-MM-dd"),
          dateTo: format(weekEnd, "yyyy-MM-dd"),
        };
      }
    },
    []
  );

  const fetchEvents = useCallback(
    (date: Date, viewMode: ViewMode) => {
      const range = getVisibleRange(date, viewMode);
      startTransition(async () => {
        const result = await listEventsInRange(range);
        if (result && !("code" in result) && result.data) {
          setEvents(result.data);
        }
      });
    },
    [getVisibleRange]
  );

  // Re-fetch quando muda a data ou a view (skip na montagem — initialEvents já foi buscado pelo server)
  useEffect(() => {
    if (!mounted) return;
    fetchEvents(currentDate, view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, view]);

  const navigatePrev = () => {
    setSelectedDay(null);
    setCurrentDate((prev) =>
      view === "mensal" ? subMonths(prev, 1) : subWeeks(prev, 1)
    );
  };

  const navigateNext = () => {
    setSelectedDay(null);
    setCurrentDate((prev) =>
      view === "mensal" ? addMonths(prev, 1) : addWeeks(prev, 1)
    );
  };

  const navigateToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
  };

  // Label do período atual
  const periodLabel =
    view === "mensal"
      ? format(currentDate, "MMMM yyyy", { locale: ptBR })
      : (() => {
          const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
          const we = endOfWeek(currentDate, { weekStartsOn: 0 });
          if (ws.getMonth() === we.getMonth()) {
            return `${format(ws, "d")}–${format(we, "d 'de' MMMM yyyy", { locale: ptBR })}`;
          }
          return `${format(ws, "d MMM", { locale: ptBR })} – ${format(we, "d MMM yyyy", { locale: ptBR })}`;
        })();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  // Eventos do dia selecionado
  const selectedDayEvents = selectedDay
    ? events.filter((e) => e.date === format(selectedDay, "yyyy-MM-dd"))
    : [];

  const isEmpty = events.length === 0 && !isPending;

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        {/* Navegação de período */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={navigatePrev}>
            <ChevronLeft className="size-4" />
          </Button>

          <button
            onClick={navigateToday}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold capitalize text-foreground hover:bg-muted transition-colors min-w-[148px] text-center"
          >
            {periodLabel}
          </button>

          <Button variant="outline" size="icon-sm" onClick={navigateNext}>
            <ChevronRight className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={navigateToday}
            className="ml-1 text-xs text-muted-foreground"
          >
            Hoje
          </Button>
        </div>

        {/* Filtros e toggle de visualização */}
        <div className="flex items-center gap-2">
          {/* Filtro de unidade (para igrejas com congregações) */}
          <div
            className="hidden sm:flex rounded-lg overflow-hidden border border-border text-xs"
            role="group"
            aria-label="Filtrar por unidade"
          >
            {(["todos", "minha-unidade"] as UnitFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setUnitFilter(f)}
                className={cn(
                  "px-3 py-1.5 transition-colors",
                  unitFilter === f
                    ? "bg-primary-500 text-white font-medium"
                    : "bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                {f === "todos" ? "Todos" : "Minha unidade"}
              </button>
            ))}
          </div>

          {/* Toggle de visualização */}
          <div
            className="flex rounded-lg overflow-hidden border border-border"
            role="group"
            aria-label="Tipo de visualização"
          >
            <button
              onClick={() => setView("mensal")}
              title="Visualização mensal"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors",
                view === "mensal"
                  ? "bg-primary-500 text-white font-medium"
                  : "bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              <CalendarDays className="size-3.5" />
              <span className="hidden sm:inline">Mês</span>
            </button>
            <button
              onClick={() => setView("semanal")}
              title="Visualização semanal"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors",
                view === "semanal"
                  ? "bg-primary-500 text-white font-medium"
                  : "bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              <Clock3 className="size-3.5" />
              <span className="hidden sm:inline">Semana</span>
            </button>
          </div>

          {isLeadership && (
            <Button
              render={<Link href="/eventos/novo" />}
              nativeButton={false}
              size="sm"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Novo evento</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Indicador de carregamento ─────────────────────── */}
      <div
        className={cn(
          "h-0.5 w-full overflow-hidden rounded-full transition-opacity duration-300",
          isPending ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="h-full bg-primary-400 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full w-1/3" />
      </div>

      {/* ── Calendário ───────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${view}-${format(currentDate, "yyyy-MM")}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {isEmpty ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <CalendarDays className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Nenhum evento neste período
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isLeadership
                    ? "Crie o primeiro evento deste período."
                    : "Não há eventos agendados para este período."}
                </p>
              </div>
              {isLeadership && (
                <Button
                  render={<Link href="/eventos/novo" />}
                  nativeButton={false}
                  size="sm"
                >
                  <Plus className="size-4" />
                  Criar evento
                </Button>
              )}
            </div>
          ) : view === "mensal" ? (
            <CalendarMonth
              currentDate={currentDate}
              events={events}
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
            />
          ) : (
            <CalendarWeek
              weekStart={weekStart}
              events={events}
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Lista do dia selecionado ──────────────────────── */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            key={format(selectedDay, "yyyy-MM-dd")}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              {/* Cabeçalho do dia */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold capitalize">
                  {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  {isToday(selectedDay) && (
                    <span className="ml-2 text-[10px] font-semibold text-primary-500 uppercase tracking-wider bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">
                      Hoje
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                >
                  Fechar
                </button>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum evento neste dia.
                  </p>
                  {isLeadership && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                      render={<Link href="/eventos/novo" />}
                      nativeButton={false}
                    >
                      <Plus className="size-3.5" />
                      Criar evento
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/eventos/${event.id}`}
                      className={cn(
                        "flex items-stretch gap-3 rounded-lg p-3 border transition-all",
                        "hover:shadow-sm hover:border-opacity-80",
                        event.modality === "presencial"
                          ? "border-primary-200 bg-primary-50/50 hover:border-primary-300 dark:bg-primary-900/10 dark:border-primary-800 dark:hover:border-primary-700"
                          : "border-accent-200 bg-accent-50/50 hover:border-accent-300 dark:bg-accent-900/10 dark:border-accent-800 dark:hover:border-accent-700"
                      )}
                    >
                      {/* Barra lateral colorida */}
                      <div
                        className={cn(
                          "w-1 rounded-full flex-shrink-0 self-stretch",
                          event.modality === "presencial"
                            ? "bg-primary-500"
                            : "bg-accent-500"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {event.name}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {event.start_time.slice(0, 5)}
                            {event.end_time
                              ? ` – ${event.end_time.slice(0, 5)}`
                              : ""}
                          </span>
                        </div>
                        {event.location && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {event.location}
                          </p>
                        )}
                        {event.modality === "online" && event.meeting_link && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            Evento online
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
