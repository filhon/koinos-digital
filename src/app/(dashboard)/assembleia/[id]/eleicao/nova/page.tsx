import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getAssemblyById } from "@/actions/assembleia";
import { PageHeader } from "@/components/layout/PageHeader";
import { ElectionForm } from "./election-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NovaEleicaoPage({ params }: Props) {
  const { id } = await params;
  await requireRole(["admin", "pastor", "presbítero"]);

  const result = await getAssemblyById(id);
  const assembly = "data" in result ? result.data : null;
  if (!assembly) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Nova Eleição"
        description={`Assembléia: ${assembly.name}`}
        breadcrumbs={[
          { label: "Assembléias", href: "/assembleia" },
          { label: assembly.name, href: `/assembleia/${id}` },
        ]}
      />
      <ElectionForm assemblyId={id} />
    </div>
  );
}
