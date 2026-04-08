import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { getUser } from "@/lib/auth/session";
import { isLeadershipRole } from "@/lib/auth/permissions";
import { listEventsInRange } from "@/actions/agenda";
import { AgendaView } from "./AgendaView";
import type { EventWithResponsible } from "@/actions/events";

export const metadata = { title: "Agenda — Koinos" };

export default async function AgendaPage() {
  const user = await getUser();
  const isLeadership = user ? isLeadershipRole(user.role) : false;

  // Busca eventos para o mês atual (range visível no calendário mensal)
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const result = await listEventsInRange({
    dateFrom: format(calStart, "yyyy-MM-dd"),
    dateTo: format(calEnd, "yyyy-MM-dd"),
  });

  const initialEvents: EventWithResponsible[] =
    result && !("code" in result) && result.data ? result.data : [];

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      <PageHeader
        title="Agenda"
        description="Visualize e organize os eventos da sua igreja"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Agenda" },
        ]}
      />

      <div className="mt-6">
        <AgendaView
          initialEvents={initialEvents}
          initialDate={today}
          isLeadership={isLeadership}
        />
      </div>
    </div>
  );
}
