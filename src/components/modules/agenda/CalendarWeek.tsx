"use client";

import { format, addDays, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { EventWithResponsible } from "@/actions/events";

const HOUR_HEIGHT = 64; // px por hora
const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR);

function parseTime(time: string): { hours: number; minutes: number } {
  const parts = time.split(":");
  return { hours: Number(parts[0]), minutes: Number(parts[1]) };
}

function getEventTop(startTime: string): number {
  const { hours, minutes } = parseTime(startTime);
  return (hours - START_HOUR + minutes / 60) * HOUR_HEIGHT;
}

function getEventHeight(startTime: string, endTime: string | null): number {
  if (!endTime) return HOUR_HEIGHT; // padrão: 1h
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const duration = end.hours - start.hours + (end.minutes - start.minutes) / 60;
  return Math.max(duration * HOUR_HEIGHT, 28);
}

interface CalendarWeekProps {
  weekStart: Date;
  events: EventWithResponsible[];
  selectedDay: Date | null;
  onDaySelect: (day: Date) => void;
}

export function CalendarWeek({
  weekStart,
  events,
  selectedDay,
  onDaySelect,
}: CalendarWeekProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Agrupa eventos por data
  const eventsByDate = events.reduce<Record<string, EventWithResponsible[]>>(
    (acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    },
    {}
  );

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border">
      <div className="min-w-[560px]">
        {/* Cabeçalho dos dias */}
        <div className="flex border-b border-border bg-muted/30">
          {/* Espaço para coluna de horários */}
          <div className="w-12 flex-shrink-0" />
          {days.map((day) => {
            const isSelected = selectedDay
              ? isSameDay(day, selectedDay)
              : false;
            const isTodayDay = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => onDaySelect(day)}
                className={cn(
                  "flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors",
                  "hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400",
                  isSelected && "bg-accent-50 dark:bg-accent-900/20"
                )}
              >
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {format(day, "EEE", { locale: ptBR })}
                </span>
                <span
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium",
                    isTodayDay && "bg-primary-500 text-white",
                    isSelected && !isTodayDay && "bg-accent-400 text-white",
                    !isTodayDay && !isSelected && "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grade de horários */}
        <div
          className="flex overflow-y-auto"
          style={{ maxHeight: `${Math.min(TOTAL_HOURS * HOUR_HEIGHT, 520)}px` }}
        >
          {/* Coluna de horários */}
          <div className="w-12 flex-shrink-0 border-r border-border bg-card/50">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative border-t border-border/40 first:border-t-0"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute top-1 right-2 text-[10px] text-muted-foreground font-medium tabular-nums">
                  {String(hour).padStart(2, "0")}h
                </span>
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate[dateStr] ?? [];
            const isTodayDay = isToday(day);

            return (
              <div
                key={dateStr}
                className={cn(
                  "flex-1 relative border-r border-border last:border-r-0 bg-card",
                  isTodayDay && "bg-primary-50/40 dark:bg-primary-900/5"
                )}
                style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
              >
                {/* Linhas de hora */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border/30 first:border-t-0"
                    style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Eventos posicionados */}
                {dayEvents.map((event) => {
                  const top = getEventTop(event.start_time);
                  const height = getEventHeight(
                    event.start_time,
                    event.end_time
                  );

                  // Ignora eventos fora do range visível
                  if (top < 0 || top >= TOTAL_HOURS * HOUR_HEIGHT) return null;

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute left-0.5 right-0.5 rounded overflow-hidden px-1.5 py-1 border",
                        "transition-opacity hover:opacity-90",
                        event.modality === "presencial"
                          ? "bg-primary-100 border-primary-300 text-primary-800 dark:bg-primary-900/40 dark:border-primary-700/60 dark:text-primary-200"
                          : "bg-accent-100 border-accent-300 text-accent-800 dark:bg-accent-900/40 dark:border-accent-700/60 dark:text-accent-200"
                      )}
                      style={{ top, height }}
                      title={`${event.name} · ${event.start_time.slice(0, 5)}${event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ""}`}
                    >
                      <div className="text-[10px] font-semibold truncate leading-tight">
                        {event.name}
                      </div>
                      {height > 36 && (
                        <div className="text-[10px] opacity-70 truncate leading-tight mt-0.5">
                          {event.start_time.slice(0, 5)}
                          {event.end_time
                            ? ` – ${event.end_time.slice(0, 5)}`
                            : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
