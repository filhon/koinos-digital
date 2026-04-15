"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";

interface Member {
  id: string;
  name: string;
}

interface CandidateSearchProps {
  electionId: string;
  excludeIds: string[];
  onAdd: (memberId: string, position: string) => Promise<void>;
  onCancel: () => void;
}

export function CandidateSearch({
  excludeIds,
  onAdd,
  onCancel,
}: CandidateSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [position, setPosition] = useState("");
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q || q.length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(
          `/api/members/search?q=${encodeURIComponent(q)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(
            (data.members ?? []).filter(
              (m: Member) => !excludeIds.includes(m.id)
            )
          );
        }
      } finally {
        setSearching(false);
      }
    },
    [excludeIds]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(true);
    try {
      await onAdd(selected.id, position);
      setSelected(null);
      setPosition("");
      setQuery("");
      setResults([]);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      {!selected ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar membro por nome..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelected(member)}
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                >
                  {member.name}
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && results.length === 0 && !searching && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhum membro encontrado.
            </p>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium">{selected.name}</p>
          <div className="space-y-1">
            <Label className="text-xs">Cargo (opcional)</Label>
            <Input
              placeholder="Ex: Diácono, Ancião..."
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={adding}
              className="flex-1"
            >
              {adding && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(null)}
            >
              Voltar
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
