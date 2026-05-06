import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getAssemblyById } from "@/actions/assembleia";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditAssemblyForm } from "./edit-assembly-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarAssembleiaPage({ params }: Props) {
  const { id } = await params;
  await requireRole(["admin", "pastor"]);

  const result = await getAssemblyById(id);
  const assembly = "data" in result ? result.data : null;
  if (!assembly) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Editar Assembléia"
        description={assembly.name}
        breadcrumbs={[
          { label: "Assembléias", href: "/assembleia" },
          { label: assembly.name, href: `/assembleia/${id}` },
        ]}
      />
      <EditAssemblyForm assembly={assembly} />
    </div>
  );
}
