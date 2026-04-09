import { notFound } from "next/navigation";
import { getEventById } from "@/actions/events";
import { listMembers } from "@/actions/members";
import { getUser } from "@/lib/auth/session";
import { isLeadershipRole } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditEventForm } from "./edit-event-form";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const result = await getEventById(id);
  if (!result || !("data" in result) || !result.data)
    return { title: "Editar evento — Koinos" };
  return { title: `Editar: ${result.data.name} — Koinos` };
}

export default async function EditarEventoPage({ params }: PageProps) {
  const { id } = await params;

  const [eventResult, user] = await Promise.all([getEventById(id), getUser()]);

  if (!eventResult || !("data" in eventResult) || !eventResult.data) {
    notFound();
  }

  if (!user || !isLeadershipRole(user.role)) {
    redirect("/403");
  }

  const event = eventResult.data;

  const leadershipRoles = ["pastor", "presbítero", "diácono", "líder"];
  const membersResult = await listMembers({
    role: "all",
    status: "active",
    pageSize: 100,
  });

  const leadershipMembers =
    membersResult && !("code" in membersResult) && membersResult.data
      ? [
          ...membersResult.data.individuals,
          ...membersResult.data.families.flatMap((f) => f.members),
        ].filter((m) => leadershipRoles.includes(m.role))
      : [];

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto">
      <PageHeader
        title="Editar evento"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Eventos", href: "/eventos" },
          { label: event.name, href: `/eventos/${id}` },
          { label: "Editar" },
        ]}
      />
      <EditEventForm event={event} leadershipMembers={leadershipMembers} />
    </div>
  );
}
