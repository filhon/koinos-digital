import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { AssemblyForm } from "./assembly-form";

export default async function NovaAssembleiaPage() {
  await requireRole(["admin", "pastor"]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Nova Assembleia"
        description="Registre uma nova assembléia da igreja."
        breadcrumbs={[{ label: "Assembleias", href: "/assembleia" }]}
      />
      <AssemblyForm />
    </div>
  );
}
