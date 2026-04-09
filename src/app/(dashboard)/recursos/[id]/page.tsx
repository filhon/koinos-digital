import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { getResourceById, listResourceEvents } from "@/actions/resources";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ResourceDetails } from "./resource-details";
import { Pencil } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const result = await getResourceById(id);
  const name =
    result && "data" in result && result.data ? result.data.name : "Recurso";
  return { title: `${name} — Koinos` };
}

export default async function RecursoPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuth();

  const [resourceResult, allocationsResult] = await Promise.all([
    getResourceById(id),
    listResourceEvents(id),
  ]);

  if (!resourceResult || !("data" in resourceResult) || !resourceResult.data) {
    notFound();
  }

  const resource = resourceResult.data;
  const allocations =
    allocationsResult && "data" in allocationsResult && allocationsResult.data
      ? allocationsResult.data
      : [];

  const canManage = ["admin", "pastor", "presbítero", "diácono"].includes(
    user.role
  );

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <PageHeader
        title={resource.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Recursos", href: "/recursos" },
          { label: resource.name },
        ]}
        action={
          canManage ? (
            <Button
              render={<Link href={`/recursos/${id}/editar`} />}
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

      <ResourceDetails
        resource={resource}
        allocations={allocations}
        canManage={canManage}
      />
    </div>
  );
}
