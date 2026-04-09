import { listMusicGroups } from "@/actions/music-groups";
import { MusicGroupsFilters } from "./music-groups-filters";
import { MusicGroupCard } from "./music-group-card";
import { Music2 } from "lucide-react";

interface MusicGroupsListProps {
  search?: string;
}

export async function MusicGroupsList({ search }: MusicGroupsListProps) {
  const result = await listMusicGroups(search);

  if (result.error || !("data" in result)) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
        Erro ao carregar grupos musicais: {result.error ?? "Erro desconhecido"}
      </div>
    );
  }

  const groups = result.data ?? [];

  return (
    <div className="space-y-4 mt-6">
      <MusicGroupsFilters search={search} />

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Music2 className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {search
                ? "Nenhum grupo musical encontrado"
                : "Nenhum grupo musical cadastrado"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {search
                ? `Sem resultados para "${search}"`
                : "Crie o primeiro grupo musical da sua igreja"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <MusicGroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
