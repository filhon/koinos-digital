"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addEventMinistry, removeEventMinistry } from "@/actions/events";
import type { EventMinistryRow } from "@/actions/events";
import { ScaleAISuggest } from "./scale-ai-suggest";

interface MinistrySuggestion {
  id: string;
  name: string;
  leader: { name: string } | null;
}

// ─── Remove Button ────────────────────────────────────────────────────────────

function RemoveMinistryButton({
  eventMinistryId,
}: {
  eventMinistryId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeEventMinistry(eventMinistryId);
      if (!result || result.error || "code" in result) {
        toast.error(
          "code" in (result ?? {})
            ? (result as { error: string }).error
            : (result?.error ?? "Erro ao remover ministério")
        );
        return;
      }
      toast.success("Ministério removido do evento");
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      title="Remover ministério"
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

// ─── Add Ministry Form ────────────────────────────────────────────────────────

function AddMinistryForm({
  eventId,
  onSuccess,
}: {
  eventId: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MinistrySuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<MinistrySuggestion | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/ministries/search?q=${encodeURIComponent(q)}`
      );
      const json = await res.json();
      setSuggestions(json.ministries ?? []);
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
      toast.error("Selecione um ministério da lista");
      return;
    }

    startTransition(async () => {
      const result = await addEventMinistry(eventId, selected.id);
      if (!result || result.error || "code" in result) {
        toast.error(
          "code" in (result ?? {})
            ? (result as { error: string }).error
            : (result?.error ?? "Erro ao associar ministério")
        );
        return;
      }
      toast.success(`"${selected.name}" associado ao evento`);
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
        Associar ministério
      </p>

      <div ref={containerRef} className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Buscar ministério pelo nome..."
          autoComplete="off"
          className="w-full h-9 pl-8 pr-3 text-sm bg-background border border-input rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        {isSearching && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />
        )}
        {open && suggestions.length > 0 && (
          <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-md overflow-hidden">
            {suggestions.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onMouseDown={() => {
                    setSelected(m);
                    setQuery(m.name);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                >
                  <Users className="size-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.name}</p>
                    {m.leader && (
                      <p className="text-[11px] text-muted-foreground">
                        Líder: {m.leader.name}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && !isSearching && query.trim() && suggestions.length === 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-md px-3 py-2 text-sm text-muted-foreground">
            Nenhum ministério encontrado.
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending || !selected}>
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          Associar
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

// ─── Event Ministries Panel ───────────────────────────────────────────────────

interface EventMinistriesPanelProps {
  eventId: string;
  eventMinistries: EventMinistryRow[];
  canManage: boolean;
  /** Passa para exibir o botão de sugestão de escala com IA. */
  showAISuggest?: boolean;
}

export function EventMinistriesPanel({
  eventId,
  eventMinistries,
  canManage,
  showAISuggest = false,
}: EventMinistriesPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold">Ministérios</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {eventMinistries.length > 0
              ? `${eventMinistries.length} ministério${eventMinistries.length !== 1 ? "s" : ""} associado${eventMinistries.length !== 1 ? "s" : ""}`
              : "Nenhum ministério associado"}
          </p>
        </div>

        {canManage && !showAddForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="size-3.5" />
            Associar
          </Button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {showAddForm && (
          <AddMinistryForm
            eventId={eventId}
            onSuccess={() => setShowAddForm(false)}
          />
        )}

        {eventMinistries.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Users className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Nenhum ministério associado a este evento.
            </p>
          </div>
        )}

        {eventMinistries.map((em) => {
          const ministry = em.ministry;
          if (!ministry) return null;

          return (
            <div
              key={em.id}
              className="py-2 border-b border-border/40 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="size-4 text-primary" />
                </div>
                <Link
                  href={`/ministerios/${ministry.id}`}
                  className="flex-1 min-w-0 group"
                >
                  <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                    {ministry.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Escala criada
                  </p>
                </Link>

                {canManage && <RemoveMinistryButton eventMinistryId={em.id} />}
              </div>

              {/* Sugestão de escala por IA — visível apenas para quem pode gerenciar */}
              {canManage && showAISuggest && (
                <div className="ml-11">
                  <ScaleAISuggest
                    eventMinistryId={em.id}
                    ministryName={ministry.name}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
