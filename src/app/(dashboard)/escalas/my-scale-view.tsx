"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Users, CalendarCheck } from "lucide-react";
import type { MyScaleEntry } from "@/actions/scales";

interface MyScaleViewProps {
  entries: MyScaleEntry[];
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

/** Agrupa entries por mês (chave "YYYY-MM") */
function groupByMonth(entries: MyScaleEntry[]): {
  monthKey: string;
  label: string;
  entries: MyScaleEntry[];
}[] {
  const map = new Map<string, { label: string; entries: MyScaleEntry[] }>();

  for (const entry of entries) {
    const date = parseISO(entry.event.date);
    const key = format(date, "yyyy-MM");
    const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });

    if (!map.has(key)) {
      map.set(key, { label, entries: [] });
    }
    map.get(key)!.entries.push(entry);
  }

  return Array.from(map.entries()).map(([monthKey, { label, entries }]) => ({
    monthKey,
    label,
    entries,
  }));
}

export function MyScaleView({ entries }: MyScaleViewProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <CalendarCheck className="size-6 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Nenhum compromisso na escala
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Quando um líder te escalar para um evento, aparecerá aqui agrupado
            por mês.
          </p>
        </div>
      </div>
    );
  }

  const months = groupByMonth(entries);

  return (
    <div className="space-y-8">
      {months.map(({ monthKey, label, entries: monthEntries }) => (
        <div key={monthKey}>
          {/* Month header */}
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-base font-semibold capitalize text-foreground">
              {label}
            </h2>
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[11px] text-muted-foreground">
              {monthEntries.length} evento{monthEntries.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Scale entries */}
          <div className="space-y-2">
            {monthEntries.map((entry) => {
              const date = parseISO(entry.event.date);
              const weekday = format(date, "EEE", { locale: ptBR });
              const day = format(date, "dd");
              const month = format(date, "MMM", { locale: ptBR });

              return (
                <Link
                  key={entry.scale_id}
                  href={`/eventos/${entry.event.id}`}
                  className="group flex items-stretch gap-0 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-150 overflow-hidden"
                >
                  {/* Date strip */}
                  <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 bg-primary/5 border-r border-border px-2 py-3 group-hover:bg-primary/10 transition-colors duration-150">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                      {weekday}
                    </span>
                    <span className="text-xl font-bold leading-none text-foreground">
                      {day}
                    </span>
                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                      {month}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-center gap-1.5 px-4 py-3 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-150">
                      {entry.event.name}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        {formatTime(entry.event.start_time)}
                        {entry.event.end_time &&
                          ` – ${formatTime(entry.event.end_time)}`}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="size-3" />
                        {entry.ministry.name}
                      </span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className="flex items-center pr-3 shrink-0">
                    <svg
                      viewBox="0 0 16 16"
                      className="size-4 text-muted-foreground/40 group-hover:text-primary/50 transition-colors duration-150"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 12l4-4-4-4"
                      />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
