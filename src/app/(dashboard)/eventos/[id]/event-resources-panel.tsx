"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Search, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { allocateResource, deallocateResource } from "@/actions/resources";
import type { EventResourceRow } from "@/actions/resources";

interface ResourceSuggestion {
  id: string;
  name: string;
  status: "disponível" | "indisponível";
  responsible: { name: string } | null;
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
      title="Remover recurso"
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

// ─── Add Resource Form ────────────────────────────────────────────────────────

function AddResourceForm({
  eventId,
  onSuccess,
}: {
  eventId: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ResourceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<ResourceSuggestion | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams({ q });
      const res = await fetch(`/api/resources/search?${params}`);
      const json = await res.json();
      setSuggestions(json.resources ?? []);
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
      toast.error("Selecione um recurso da lista");
      return;
    }

    startTransition(async () => {
      const result = await allocateResource({
        resourceId: selected.id,
        eventId,
      });

      if (!result || result.error || "code" in result) {
        toast.error(
          "code" in (result ?? {})
            ? (result as { error: string }).error
            : (result?.error ?? "Erro ao alocar recurso")
        );
        return;
      }

      toast.success(`"${selected.name}" alocado ao evento`);
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
        Adicionar recurso
      </p>

      <div ref={containerRef} className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Buscar recurso pelo nome..."
          autoComplete="off"
          className="w-full h-9 pl-8 pr-3 text-sm bg-background border border-input rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        {isSearching && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />
        )}
        {open && suggestions.length > 0 && (
          <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-md overflow-hidden">
            {suggestions.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onMouseDown={() => {
                    setSelected(r);
                    setQuery(r.name);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                >
                  <Package className="size-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{r.name}</p>
                    {r.responsible && (
                      <p className="text-[11px] text-muted-foreground">
                        {r.responsible.name}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-[10px] border",
                      r.status === "disponível"
                        ? "border-success-dark/30 text-success-dark"
                        : "border-destructive/30 text-destructive"
                    )}
                  >
                    {r.status}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && !isSearching && query.trim() && suggestions.length === 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-md px-3 py-2 text-sm text-muted-foreground">
            Nenhum recurso encontrado.
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending || !selected}>
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          Adicionar
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

// ─── Event Resources Panel ────────────────────────────────────────────────────

interface EventResourcesPanelProps {
  eventId: string;
  allocations: EventResourceRow[];
  canManage: boolean;
}

export function EventResourcesPanel({
  eventId,
  allocations,
  canManage,
}: EventResourcesPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold">Recursos</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {allocations.length > 0
              ? `${allocations.length} recurso${allocations.length !== 1 ? "s" : ""} alocado${allocations.length !== 1 ? "s" : ""}`
              : "Nenhum recurso alocado"}
          </p>
        </div>

        {canManage && !showAddForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="size-3.5" />
            Adicionar
          </Button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {showAddForm && (
          <AddResourceForm
            eventId={eventId}
            onSuccess={() => setShowAddForm(false)}
          />
        )}

        {allocations.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Package className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Nenhum recurso alocado a este evento.
            </p>
          </div>
        )}

        {allocations.map((alloc) => {
          const resource = alloc.resource as {
            id: string;
            name: string;
            status: "disponível" | "indisponível";
            responsible: { name: string } | null;
          } | null;
          if (!resource) return null;

          return (
            <div
              key={alloc.id}
              className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Package className="size-4 text-muted-foreground" />
              </div>
              <Link
                href={`/recursos/${resource.id}`}
                className="flex-1 min-w-0 group"
              >
                <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                  {resource.name}
                </p>
                {resource.responsible && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {resource.responsible.name}
                  </p>
                )}
              </Link>

              {canManage && (
                <RemoveAllocationButton
                  resourceId={resource.id}
                  eventId={eventId}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
