"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  RefreshCw,
  AlignLeft,
  Users,
  Music,
  Package,
  BookOpen,
} from "lucide-react";
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

function formatTime(time: string): string {
  return time.slice(0, 5);
}

const TABS = [
  { id: "detalhes", label: "Detalhes", icon: AlignLeft },
  { id: "ministerios", label: "Ministérios", icon: Users },
  { id: "musica", label: "Música", icon: Music },
  { id: "recursos", label: "Recursos", icon: Package },
  { id: "liturgia", label: "Liturgia", icon: BookOpen },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface EventDetailsProps {
  event: EventWithResponsible;
  isLeadership: boolean;
}

export function EventDetails({ event }: EventDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("detalhes");
  const isOnline = event.modality === "online";
  const eventDate = parseISO(event.date);

  return (
    <div className="space-y-4 mt-6">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "detalhes" && (
        <div className="space-y-4">
          {/* Date + time card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data e horário
            </h3>

            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground capitalize">
                  {format(eventDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                <Clock className="size-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-foreground">
                {formatTime(event.start_time)}
                {event.end_time && ` — ${formatTime(event.end_time)}`}
              </p>
            </div>

            {event.is_recurring && (
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <RefreshCw className="size-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-foreground">
                  Evento recorrente
                  {event.recurrence_rule &&
                    ` · ${(event.recurrence_rule as { frequency?: string }).frequency ?? ""}`}
                </p>
              </div>
            )}
          </div>

          {/* Location / link card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Modalidade
            </h3>

            <div className="flex items-start gap-2">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  isOnline ? "bg-primary/10" : "bg-success-light"
                )}
              >
                {isOnline ? (
                  <Video className="size-4 text-primary" />
                ) : (
                  <MapPin className="size-4 text-success-dark" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {isOnline ? "Online" : "Presencial"}
                </p>
                {isOnline && event.meeting_link ? (
                  <a
                    href={event.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {event.meeting_link}
                  </a>
                ) : event.location ? (
                  <p className="text-sm text-foreground">{event.location}</p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Responsible card */}
          {event.responsible && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Responsável
              </h3>
              <div className="flex items-center gap-3">
                <Avatar className="shrink-0">
                  {event.responsible.avatar_url && (
                    <AvatarImage
                      src={event.responsible.avatar_url}
                      alt={event.responsible.name}
                    />
                  )}
                  <AvatarFallback className="text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    {getInitials(event.responsible.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {event.responsible.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {event.responsible.role}
                  </p>
                </div>
                <div className="ml-auto flex size-8 items-center justify-center rounded-lg bg-muted">
                  <User className="size-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          )}

          {/* Description card */}
          {event.description && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição
              </h3>
              <p className="text-sm text-foreground whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "ministerios" && (
        <EmptyTab
          icon={<Users className="size-6 text-muted-foreground" />}
          label="Ministérios"
          description="A associação de ministérios estará disponível em breve."
        />
      )}

      {activeTab === "musica" && (
        <EmptyTab
          icon={<Music className="size-6 text-muted-foreground" />}
          label="Grupos musicais"
          description="A associação de grupos musicais estará disponível em breve."
        />
      )}

      {activeTab === "recursos" && (
        <EmptyTab
          icon={<Package className="size-6 text-muted-foreground" />}
          label="Recursos"
          description="A alocação de recursos estará disponível em breve."
        />
      )}

      {activeTab === "liturgia" && (
        <EmptyTab
          icon={<BookOpen className="size-6 text-muted-foreground" />}
          label="Liturgia"
          description="A liturgia deste evento estará disponível em breve."
        />
      )}
    </div>
  );
}

function EmptyTab({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
          {description}
        </p>
      </div>
    </div>
  );
}
