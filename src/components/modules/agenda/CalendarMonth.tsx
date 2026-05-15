"use client";

import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { EventWithResponsible } from "@/actions/events";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface CalendarMonthProps {
  currentDate: Date;
  events: EventWithResponsible[];
  selectedDay: Date | null;
  onDaySelect: (day: Date) => void;
}

export function CalendarMonth({
  currentDate,
  events,
  selectedDay,
  onDaySelect,
}: CalendarMonthProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  // Agrupa eventos por data (formato yyyy-MM-dd)
  const eventsByDate = useMemo(
    () =>
      events.reduce<Record<string, EventWithResponsible[]>>((acc, event) => {
        if (!acc[event.date]) acc[event.date] = [];
        acc[event.date].push(event);
        return acc;
      }, {}),
    [events]
  );

  return (
    <div className="w-full">
      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate[dateStr] ?? [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
          const isTodayDay = isToday(day);
          const visibleEvents = dayEvents.slice(0, 3);
          const hiddenCount = dayEvents.length - 3;

          return (
            <button
              key={dateStr}
              onClick={() => onDaySelect(day)}
              className={cn(
                "relative flex flex-col gap-0.5 p-1.5 sm:p-2 min-h-[72px] sm:min-h-[88px] text-left",
                "bg-card transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400",
                "hover:bg-muted/40",
                !isCurrentMonth && "opacity-40",
                isSelected &&
                  "bg-accent-50 dark:bg-accent-900/20 hover:bg-accent-100/60 dark:hover:bg-accent-900/30"
              )}
            >
              {/* Número do dia */}
              <span
                className={cn(
                  "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-0.5 flex-shrink-0",
                  isTodayDay && "bg-primary-500 text-white font-bold",
                  isSelected && !isTodayDay && "bg-accent-400 text-white",
                  !isTodayDay && !isSelected && "text-foreground"
                )}
              >
                {format(day, "d")}
              </span>

              {/* Indicadores de eventos */}
              <div className="flex flex-col gap-0.5 w-full min-w-0">
                {visibleEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "truncate text-[10px] sm:text-[11px] font-medium px-1 py-0.5 rounded leading-tight",
                      event.modality === "presencial"
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                        : "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300"
                    )}
                  >
                    {(event.is_recurring || event.parent_event_id) && (
                      <span className="opacity-60 mr-0.5">↻</span>
                    )}
                    <span className="opacity-70">
                      {event.start_time.slice(0, 5)}
                    </span>{" "}
                    {event.name}
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <span className="text-[10px] text-muted-foreground pl-1 leading-tight">
                    +{hiddenCount} mais
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
