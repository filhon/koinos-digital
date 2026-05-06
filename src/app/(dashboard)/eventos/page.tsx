import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { EventsList } from "./events-list";
import { EventsListSkeleton } from "./events-skeleton";

interface PageProps {
  searchParams: Promise<{
    modality?: string;
    page?: string;
  }>;
}

export const metadata = { title: "Eventos — Koinos" };

export default async function EventosPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Eventos"
        description="Gerencie os eventos e cultos da sua igreja"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Eventos" },
        ]}
        action={
          <Button
            render={<Link href="/eventos/novo" />}
            nativeButton={false}
            size="sm"
          >
            <Plus className="size-4" />
            Novo evento
          </Button>
        }
      />

      <Suspense fallback={<EventsListSkeleton />}>
        <EventsList
          modality={params.modality}
          page={params.page ? Number(params.page) : 1}
        />
      </Suspense>
    </div>
  );
}
