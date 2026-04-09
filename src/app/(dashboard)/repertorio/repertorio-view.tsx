"use client";

import { useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Music } from "lucide-react";
import { SongCard } from "./song-card";
import type { SongWithGroup } from "@/actions/songs";

interface MusicGroupOption {
  id: string;
  name: string;
}

interface RepertorioViewProps {
  songs: SongWithGroup[];
  groups: MusicGroupOption[];
  canManage: boolean;
  selectedGroupId?: string;
  search?: string;
}

export function RepertorioView({
  songs,
  groups,
  canManage,
  selectedGroupId,
  search,
}: RepertorioViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="space-y-4 mt-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {/* Busca */}
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar por nome ou artista..."
            defaultValue={search ?? ""}
            onChange={(e) => updateParams("q", e.target.value || null)}
            className="w-full pl-9 pr-3 h-9 text-sm bg-background border border-input rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
          />
        </div>

        {/* Filtro por grupo */}
        {groups.length > 1 && (
          <select
            value={selectedGroupId ?? ""}
            onChange={(e) => updateParams("grupo", e.target.value || null)}
            className="h-9 px-3 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
          >
            <option value="">Todos os grupos</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}

        {/* Limpar */}
        {(search || selectedGroupId) && (
          <button
            onClick={() => {
              startTransition(() => router.push(pathname));
            }}
            className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground border border-input rounded-lg hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0"
          >
            <X className="size-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Lista */}
      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Music className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {search || selectedGroupId
                ? "Nenhuma música encontrada"
                : "Nenhuma música no repertório"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {search
                ? `Sem resultados para "${search}"`
                : selectedGroupId
                  ? "Este grupo ainda não tem músicas cadastradas"
                  : "Adicione músicas ao repertório de um grupo musical"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  );
}
