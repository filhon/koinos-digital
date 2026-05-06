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
import { listCongregations } from "@/actions/congregacoes";
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

  // Verifica se é pastor da matriz com congregações
  let hasMultipleUnits = false;
  if (user && user.parent_tenant_id === null && isLeadership) {
    const congResult = await listCongregations();
    if (
      congResult &&
      !("code" in congResult) &&
      congResult.data &&
      congResult.data.filter((c) => c.is_active).length > 0
    ) {
      hasMultipleUnits = true;
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
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
          hasMultipleUnits={hasMultipleUnits}
        />
      </div>
    </div>
  );
}
