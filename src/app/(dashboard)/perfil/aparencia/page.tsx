import { requireAuth } from "@/lib/auth/session";
import { getDarkModeSchedule } from "@/actions/aparencia";
import { PageHeader } from "@/components/layout/PageHeader";
import { AparenciaForm } from "./aparencia-form";
import type { DarkModeSchedule } from "@/lib/validators/aparencia";

export const metadata = { title: "Aparência — Koinos" };

export default async function AparenciaPage() {
  await requireAuth();
  const result = await getDarkModeSchedule();

  let schedule: DarkModeSchedule | null = null;
  if (
    result &&
    typeof result === "object" &&
    "success" in result &&
    result.success &&
    "data" in result
  ) {
    schedule = result.data as DarkModeSchedule | null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Aparência"
        description="Controle o tema e o agendamento do modo escuro."
      />
      <AparenciaForm initialSchedule={schedule} />
    </div>
  );
}
