import Link from "next/link";
import { Plus } from "lucide-react";
import { listEvents } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { EventCard } from "./event-card";
import { EventsFilters } from "./events-filters";

interface EventsListProps {
  modality?: string;
  page?: number;
}

export async function EventsList({ modality, page = 1 }: EventsListProps) {
  const result = await listEvents({
    modality: (modality as "presencial" | "online" | "all") ?? "all",
    page,
    upcoming: true,
  });

  if (!result || "code" in result) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Sem permissão para visualizar eventos.
      </div>
    );
  }

  if (result.error || !result.data) {
    return (
      <div className="rounded-xl border border-error/30 bg-error-light/10 p-8 text-center text-sm text-error">
        Erro ao carregar eventos: {result.error || "Erro desconhecido"}
      </div>
    );
  }

  const { events, total, totalPages } = result.data;

  return (
    <div className="space-y-4 mt-6">
      <EventsFilters currentModality={modality} />

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <svg
              viewBox="0 0 24 24"
              className="size-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Nenhum evento próximo
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crie o primeiro evento da sua igreja.
            </p>
          </div>
          <Button
            render={<Link href="/eventos/novo" />}
            nativeButton={false}
            size="sm"
          >
            <Plus className="size-4" />
            Novo evento
          </Button>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {total} evento{total !== 1 ? "s" : ""} próximo
            {total !== 1 ? "s" : ""}
            {modality && modality !== "all" ? ` · ${modality}` : ""}
          </p>

          <div className="space-y-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {page > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link
                      href={`?page=${page - 1}${modality ? `&modality=${modality}` : ""}`}
                    />
                  }
                  nativeButton={false}
                >
                  Anterior
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              {page < totalPages && (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link
                      href={`?page=${page + 1}${modality ? `&modality=${modality}` : ""}`}
                    />
                  }
                  nativeButton={false}
                >
                  Próxima
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
