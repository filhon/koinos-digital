import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getEventById,
  listEventMinistries,
  listEventMusicGroups,
} from "@/actions/events";
import { listEventResources } from "@/actions/resources";
import { getLiturgyByEventId } from "@/actions/liturgy";
import { getUser } from "@/lib/auth/session";
import { isLeadershipRole } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { EventDetails } from "./event-details";
import { Pencil } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const result = await getEventById(id);
  if (!result || !("data" in result) || !result.data)
    return { title: "Evento — Koinos" };
  return { title: `${result.data.name} — Koinos` };
}

export default async function EventoPage({ params }: PageProps) {
  const { id } = await params;

  const [eventResult, user] = await Promise.all([getEventById(id), getUser()]);

  if (!eventResult || !("data" in eventResult) || !eventResult.data) {
    notFound();
  }

  const event = eventResult.data;
  const isLeadership = user ? isLeadershipRole(user.role) : false;
  const isResponsible = user ? event.responsible_id === user.id : false;

  const [
    allocationsResult,
    ministriesResult,
    musicGroupsResult,
    liturgyResult,
  ] = await Promise.all([
    listEventResources(id),
    listEventMinistries(id),
    listEventMusicGroups(id),
    getLiturgyByEventId(id),
  ]);

  const allocations =
    allocationsResult && "data" in allocationsResult && allocationsResult.data
      ? allocationsResult.data
      : [];

  const eventMinistries =
    ministriesResult && "data" in ministriesResult && ministriesResult.data
      ? ministriesResult.data
      : [];

  const eventMusicGroups =
    musicGroupsResult && "data" in musicGroupsResult && musicGroupsResult.data
      ? musicGroupsResult.data
      : [];

  const liturgy =
    liturgyResult && "data" in liturgyResult && liturgyResult.data
      ? liturgyResult.data
      : null;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={event.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Eventos", href: "/eventos" },
          { label: event.name },
        ]}
        action={
          isLeadership ? (
            <Button
              render={<Link href={`/eventos/${id}/editar`} />}
              nativeButton={false}
              size="sm"
              variant="outline"
            >
              <Pencil className="size-4" />
              Editar
            </Button>
          ) : undefined
        }
      />

      <EventDetails
        event={event}
        isLeadership={isLeadership}
        isResponsible={isResponsible}
        allocations={allocations}
        eventMinistries={eventMinistries}
        eventMusicGroups={eventMusicGroups}
        liturgy={liturgy}
      />
    </div>
  );
}
