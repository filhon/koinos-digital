import { listMinistries } from "@/actions/ministries";
import { MinistriesFilters } from "./ministries-filters";
import { MinistryCard } from "./ministry-card";
import { Users } from "lucide-react";

interface MinistriesListProps {
  search?: string;
}

export async function MinistriesList({ search }: MinistriesListProps) {
  const result = await listMinistries(search);

  if (result.error || !("data" in result)) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
        Erro ao carregar ministérios: {result.error ?? "Erro desconhecido"}
      </div>
    );
  }

  const ministries = result.data ?? [];

  return (
    <div className="space-y-4 mt-6">
      <MinistriesFilters search={search} />

      {ministries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {search
                ? "Nenhum ministério encontrado"
                : "Nenhum ministério cadastrado"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {search
                ? `Sem resultados para "${search}"`
                : "Crie o primeiro ministério da sua igreja"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ministries.map((ministry) => (
            <MinistryCard key={ministry.id} ministry={ministry} />
          ))}
        </div>
      )}
    </div>
  );
}
