import { PageHeader } from "@/components/layout/PageHeader";
import { EventsListSkeleton } from "./events-skeleton";

export default function EventosLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Eventos" />
      <EventsListSkeleton />
    </div>
  );
}
