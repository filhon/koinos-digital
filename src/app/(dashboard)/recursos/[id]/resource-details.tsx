"use client";

import Link from "next/link";
import { useState } from "react";
import { Package, User, DollarSign, Calendar, AlignLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResourceEventsPanel } from "./resource-events-panel";
import type {
  ResourceWithResponsible,
  EventResourceRow,
} from "@/actions/resources";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

const TABS = [
  { id: "info", label: "Informações", icon: AlignLeft },
  { id: "eventos", label: "Eventos", icon: Calendar },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface ResourceDetailsProps {
  resource: ResourceWithResponsible;
  allocations: EventResourceRow[];
  canManage: boolean;
}

export function ResourceDetails({
  resource,
  allocations,
  canManage,
}: ResourceDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const isAvailable = resource.status === "disponível";

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
              {tab.id === "eventos" && allocations.length > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary/15 text-primary px-1.5 py-px text-[10px] font-semibold min-w-4">
                  {allocations.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Informações */}
      {activeTab === "info" && (
        <div className="space-y-4">
          {/* Status card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </h3>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg",
                  isAvailable
                    ? "bg-success-light dark:bg-success-dark/20"
                    : "bg-destructive/10"
                )}
              >
                <Package
                  className={cn(
                    "size-4",
                    isAvailable
                      ? "text-success-dark dark:text-success-light"
                      : "text-destructive"
                  )}
                />
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium border",
                  isAvailable
                    ? "border-success-dark/30 text-success-dark bg-success-light/50 dark:border-success-light/30 dark:text-success-light dark:bg-success-dark/20"
                    : "border-destructive/30 text-destructive bg-destructive/10"
                )}
              >
                {isAvailable ? "Disponível" : "Indisponível"}
              </Badge>
              {!isAvailable && (
                <p className="text-xs text-muted-foreground">
                  Alocado a {allocations.length} evento
                  {allocations.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Responsável */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Responsável
            </h3>
            {resource.responsible ? (
              <div className="flex items-center gap-3">
                <Avatar className="shrink-0">
                  {resource.responsible.avatar_url && (
                    <AvatarImage
                      src={resource.responsible.avatar_url}
                      alt={resource.responsible.name}
                    />
                  )}
                  <AvatarFallback className="text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    {getInitials(resource.responsible.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link
                    href={`/membros/${resource.responsible.id}`}
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    {resource.responsible.name}
                  </Link>
                  <p className="text-xs text-muted-foreground capitalize">
                    {resource.responsible.role}
                  </p>
                </div>
                <div className="ml-auto flex size-8 items-center justify-center rounded-lg bg-muted">
                  <User className="size-4 text-muted-foreground" />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Sem responsável definido
              </p>
            )}
          </div>

          {/* Valor estimado */}
          {resource.value !== null && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Valor estimado
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <DollarSign className="size-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {formatCurrency(resource.value)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Eventos */}
      {activeTab === "eventos" && (
        <ResourceEventsPanel
          resourceId={resource.id}
          allocations={allocations}
          canManage={canManage}
        />
      )}
    </div>
  );
}
