"use client";

import Link from "next/link";
import { CalendarDays, Flame, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileWidgetsStripProps {
  nextEventName: string | null;
  nextEventDate: string | null;
  streak: number;
  talentBalance: number;
}

function formatEventDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const eventDay = new Date(year, month - 1, day);

  if (eventDay.getTime() === today.getTime()) return "Hoje";
  if (eventDay.getTime() === tomorrow.getTime()) return "Amanhã";

  const months = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  return `${day} ${months[month - 1]}`;
}

export function MobileWidgetsStrip({
  nextEventName,
  nextEventDate,
  streak,
  talentBalance,
}: MobileWidgetsStripProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
      {/* Next event chip */}
      {nextEventName && nextEventDate ? (
        <Link
          href="/agenda"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card shrink-0",
            "text-xs text-foreground hover:border-primary/20 transition-colors"
          )}
        >
          <CalendarDays className="w-3.5 h-3.5 text-primary/70 shrink-0" />
          <span className="font-medium truncate max-w-30">{nextEventName}</span>
          <span className="text-muted-foreground shrink-0">
            {formatEventDateShort(nextEventDate)}
          </span>
        </Link>
      ) : (
        <Link
          href="/agenda"
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card shrink-0 text-xs text-muted-foreground hover:border-primary/20 transition-colors"
        >
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          <span>Sem eventos</span>
        </Link>
      )}

      {/* Streak chip */}
      <Link
        href="/leitura"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card shrink-0 hover:border-primary/20 transition-colors"
      >
        <Flame
          className={cn(
            "w-3.5 h-3.5 shrink-0",
            streak >= 7
              ? "text-orange-500"
              : streak >= 3
                ? "text-amber-500"
                : "text-muted-foreground/60"
          )}
        />
        <span className="text-xs font-medium tabular-nums text-foreground">
          {streak}
        </span>
        <span className="text-xs text-muted-foreground">dias</span>
      </Link>

      {/* Talentos chip */}
      <Link
        href="/loja"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card shrink-0 hover:border-primary/20 transition-colors"
      >
        <Coins className="w-3.5 h-3.5 text-accent-500 shrink-0" />
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {talentBalance.toLocaleString("pt-BR")}
        </span>
        <span className="text-xs text-muted-foreground">Talentos</span>
      </Link>
    </div>
  );
}
