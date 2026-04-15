import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { AssemblyForm } from "./assembly-form";

export default async function NovaAssembleiaPage() {
  await requireRole(["admin", "pastor"]);

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Nova Assembléia"
        description="Registre uma nova assembléia da igreja."
        breadcrumbs={[{ label: "Assembléias", href: "/assembleia" }]}
      />
      <AssemblyForm />
    </div>
  );
}
