import { PageHeader } from "@/components/layout/PageHeader";
import { EventForm } from "./event-form";
import { listMembers } from "@/actions/members";

export const metadata = { title: "Novo evento — Koinos" };

export default async function NovoEventoPage() {
  // Busca liderança para o select de responsável
  const leadershipResult = await listMembers({
    role: "all",
    status: "active",
    pageSize: 100,
  });

  const leadershipRoles = ["pastor", "presbítero", "diácono", "líder"];
  const leadershipMembers =
    leadershipResult && !("code" in leadershipResult) && leadershipResult.data
      ? [
          ...leadershipResult.data.individuals,
          ...leadershipResult.data.families.flatMap((f) => f.members),
        ].filter((m) => leadershipRoles.includes(m.role))
      : [];

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto">
      <PageHeader
        title="Novo evento"
        description="Crie um evento para a sua igreja"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Eventos", href: "/eventos" },
          { label: "Novo" },
        ]}
      />
      <EventForm leadershipMembers={leadershipMembers} />
    </div>
  );
}
