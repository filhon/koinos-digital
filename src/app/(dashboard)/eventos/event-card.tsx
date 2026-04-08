"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Video, Clock, User, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { EventWithResponsible } from "@/actions/events";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function formatEventDate(dateStr: string): {
  weekday: string;
  day: string;
  month: string;
} {
  const date = parseISO(dateStr);
  return {
    weekday: format(date, "EEE", { locale: ptBR }),
    day: format(date, "dd"),
    month: format(date, "MMM", { locale: ptBR }),
  };
}

function formatTime(time: string): string {
  return time.slice(0, 5); // HH:mm
}

interface EventCardProps {
  event: EventWithResponsible;
}

export function EventCard({ event }: EventCardProps) {
  const { weekday, day, month } = formatEventDate(event.date);
  const isOnline = event.modality === "online";

  return (
    <Link
      href={`/eventos/${event.id}`}
      className="group flex items-stretch gap-0 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-150 overflow-hidden"
    >
      {/* Date strip */}
      <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 bg-primary/5 border-r border-border px-2 py-4 group-hover:bg-primary/10 transition-colors duration-150">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {weekday}
        </span>
        <span className="text-2xl font-bold leading-none text-foreground">
          {day}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {month}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center gap-2 px-4 py-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-150">
              {event.name}
            </p>
            {event.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {event.description}
              </p>
            )}
          </div>

          {/* Modality badge */}
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              isOnline
                ? "bg-primary/10 text-primary dark:bg-primary/20"
                : "bg-success-light text-success-dark dark:bg-success/20 dark:text-success-light"
            )}
          >
            {isOnline ? (
              <Video className="size-2.5" />
            ) : (
              <MapPin className="size-2.5" />
            )}
            {isOnline ? "Online" : "Presencial"}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="size-3" />
            {formatTime(event.start_time)}
            {event.end_time && ` – ${formatTime(event.end_time)}`}
          </span>

          {isOnline && event.meeting_link ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[160px]">
              <Video className="size-3 shrink-0" />
              <span className="truncate">
                {event.meeting_link.replace(/^https?:\/\//, "")}
              </span>
            </span>
          ) : event.location ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[160px]">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          ) : null}

          {event.is_recurring && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <RefreshCw className="size-3" />
              Recorrente
            </span>
          )}
        </div>

        {/* Responsible */}
        {event.responsible && (
          <div className="flex items-center gap-1.5">
            <Avatar size="sm" className="shrink-0">
              {event.responsible.avatar_url && (
                <AvatarImage
                  src={event.responsible.avatar_url}
                  alt={event.responsible.name}
                />
              )}
              <AvatarFallback className="text-[9px] bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {getInitials(event.responsible.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground">
              <User className="inline size-2.5 mr-0.5 -mt-px" />
              {event.responsible.name}
            </span>
          </div>
        )}
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
}
