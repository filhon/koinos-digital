"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { addMinistryMember, removeMinistryMember } from "@/actions/ministries";
import type { MinistryMemberRow } from "@/actions/ministries";

interface MemberSuggestion {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

// ─── Remove Button ────────────────────────────────────────────────────────────

function RemoveMemberButton({
  ministryId,
  memberId,
}: {
  ministryId: string;
  memberId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeMinistryMember({ ministryId, memberId });
      if (!result || result.error || "code" in result) {
        toast.error(
          "code" in (result ?? {})
            ? (result as { error: string }).error
            : (result?.error ?? "Erro ao remover")
        );
        return;
      }
      toast.success("Componente removido");
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      title="Remover do ministério"
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

// ─── Add Member Form ──────────────────────────────────────────────────────────

function AddMemberForm({
  ministryId,
  onSuccess,
}: {
  ministryId: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MemberSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<MemberSuggestion | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams({ q });
      const res = await fetch(`/api/members/search?${params}`);
      const json = await res.json();
      setSuggestions(json.members ?? []);
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
      toast.error("Selecione um membro da lista");
      return;
    }

    startTransition(async () => {
      const result = await addMinistryMember({
        ministryId,
        memberId: selected.id,
      });

      if (!result || result.error || "code" in result) {
        toast.error(
          "code" in (result ?? {})
            ? (result as { error: string }).error
            : (result?.error ?? "Erro ao adicionar")
        );
        return;
      }

      toast.success(`${selected.name} adicionado ao ministério`);
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
        Adicionar componente
      </p>

      <div ref={containerRef} className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Buscar membro pelo nome..."
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
                  <Avatar size="sm">
                    {m.avatar_url && (
                      <AvatarImage src={m.avatar_url} alt={m.name} />
                    )}
                    <AvatarFallback className="text-[10px] bg-primary-50 text-primary-700">
                      {getInitials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">
                      {m.role}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && !isSearching && query.trim() && suggestions.length === 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-md px-3 py-2 text-sm text-muted-foreground">
            Nenhum membro encontrado.
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

// ─── Members Panel ────────────────────────────────────────────────────────────

interface MembersPanelProps {
  ministryId: string;
  currentMembers: MinistryMemberRow[];
  canManage: boolean;
}

export function MembersPanel({
  ministryId,
  currentMembers,
  canManage,
}: MembersPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold">Componentes</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {currentMembers.length > 0
              ? `${currentMembers.length} componente${currentMembers.length !== 1 ? "s" : ""}`
              : "Nenhum componente cadastrado"}
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
          <AddMemberForm
            ministryId={ministryId}
            onSuccess={() => setShowAddForm(false)}
          />
        )}

        {currentMembers.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Users className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Nenhum componente neste ministério.
            </p>
          </div>
        )}

        {currentMembers.map(({ id: rowId, member }) => (
          <div
            key={rowId}
            className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0"
          >
            <Link
              href={`/membros/${member.id}`}
              className="flex items-center gap-3 flex-1 group min-w-0"
            >
              <Avatar size="sm" className="shrink-0">
                {member.avatar_url && (
                  <AvatarImage src={member.avatar_url} alt={member.name} />
                )}
                <AvatarFallback className="text-[10px] bg-primary-50 text-primary-700">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                  {member.name}
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {member.role}
                </p>
              </div>
            </Link>

            {canManage && (
              <RemoveMemberButton
                ministryId={ministryId}
                memberId={member.id}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
