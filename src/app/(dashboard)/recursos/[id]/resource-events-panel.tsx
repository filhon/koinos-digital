"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  Search,
  Calendar,
  Clock,
  MapPin,
  Video,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { allocateResource, deallocateResource } from "@/actions/resources";
import type { EventResourceRow } from "@/actions/resources";

interface EventSuggestion {
  id: string;
  name: string;
  date: string;
  start_time: string;
  modality: "presencial" | "online";
  location: string | null;
  meeting_link: string | null;
}

function formatTime(t: string) {
  return t.slice(0, 5);
}

// ─── Remove Button ────────────────────────────────────────────────────────────

function RemoveAllocationButton({
  resourceId,
  eventId,
}: {
  resourceId: string;
  eventId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      const result = await deallocateResource({ resourceId, eventId });
      if (!result || result.error || "code" in result) {
        toast.error(
          "code" in (result ?? {})
            ? (result as { error: string }).error
            : (result?.error ?? "Erro ao remover alocação")
        );
        return;
      }
      toast.success("Recurso removido do evento");
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      title="Remover alocação"
      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Trash2 className="size-3.5" />
      )}
    </button>
  );
}

// ─── Add Allocation Form ──────────────────────────────────────────────────────

function AddAllocationForm({
  resourceId,
  onSuccess,
}: {
  resourceId: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<EventSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<EventSuggestion | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams({ q });
      const res = await fetch(`/api/events/search?${params}`);
      const json = await res.json();
      setSuggestions(json.events ?? []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      toast.error("Selecione um evento da lista");
      return;
    }

    startTransition(async () => {
      const result = await allocateResource({
        resourceId,
        eventId: selected.id,
      });

      if (!result || result.error || "code" in result) {
        toast.error(
          "code" in (result ?? {})
            ? (result as { error: string }).error
            : (result?.error ?? "Erro ao alocar recurso")
        );
        return;
      }

      toast.success(`Recurso alocado a "${selected.name}"`);
      setSelected(null);
      setQuery("");
      onSuccess();
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 p-4 rounded-lg bg-muted/40 border border-border/60"
    >
      <p className="text-xs font-medium text-muted-foreground">
        Alocar a evento
      </p>

      <div ref={containerRef} className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Buscar evento pelo nome..."
          autoComplete="off"
          className="w-full h-9 pl-8 pr-3 text-sm bg-background border border-input rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        {isSearching && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />
        )}
        {open && suggestions.length > 0 && (
          <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-md overflow-hidden">
            {suggestions.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onMouseDown={() => {
                    setSelected(ev);
                    setQuery(ev.name);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                >
                  <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{ev.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(parseISO(ev.date), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}{" "}
                      · {formatTime(ev.start_time)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && !isSearching && query.trim() && suggestions.length === 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-md px-3 py-2 text-sm text-muted-foreground">
            Nenhum evento encontrado.
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending || !selected}>
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          Alocar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onSuccess}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

// ─── Resource Events Panel ────────────────────────────────────────────────────

interface ResourceEventsPanelProps {
  resourceId: string;
  allocations: EventResourceRow[];
  canManage: boolean;
}

export function ResourceEventsPanel({
  resourceId,
  allocations,
  canManage,
}: ResourceEventsPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold">Eventos alocados</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {allocations.length > 0
              ? `${allocations.length} evento${allocations.length !== 1 ? "s" : ""}`
              : "Nenhum evento"}
          </p>
        </div>

        {canManage && !showAddForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="size-3.5" />
            Alocar
          </Button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {showAddForm && (
          <AddAllocationForm
            resourceId={resourceId}
            onSuccess={() => setShowAddForm(false)}
          />
        )}

        {allocations.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Calendar className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Recurso não alocado a nenhum evento.
            </p>
          </div>
        )}

        {allocations.map((alloc) => {
          const ev = alloc.event;
          if (!ev) return null;
          const isOnline = ev.modality === "online";

          return (
            <div
              key={alloc.id}
              className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0"
            >
              <Link
                href={`/eventos/${ev.id}`}
                className="flex items-start gap-3 flex-1 group min-w-0"
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                    isOnline
                      ? "bg-primary/10"
                      : "bg-success-light dark:bg-success-dark/20"
                  )}
                >
                  {isOnline ? (
                    <Video className={cn("size-3.5 text-primary")} />
                  ) : (
                    <MapPin className="size-3.5 text-success-dark dark:text-success-light" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                    {ev.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    {format(parseISO(ev.date), "dd/MM/yyyy", { locale: ptBR })}
                    <Clock className="size-3 ml-1" />
                    {formatTime(ev.start_time)}
                    {ev.end_time && ` — ${formatTime(ev.end_time)}`}
                  </p>
                </div>
              </Link>

              {canManage && (
                <RemoveAllocationButton
                  resourceId={resourceId}
                  eventId={ev.id}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
