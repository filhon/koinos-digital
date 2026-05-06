import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { getResourceById } from "@/actions/resources";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditResourceForm } from "./edit-resource-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Editar Recurso — Koinos" };

export default async function EditarRecursoPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuth();

  const canEdit = ["admin", "pastor", "presbítero", "diácono"].includes(
    user.role
  );
  if (!canEdit) redirect("/403");

  const result = await getResourceById(id);
  if (!result || !("data" in result) || !result.data) {
    notFound();
  }

  const resource = result.data;
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("members")
    .select("id, name, role")
    .eq("is_active", true)
    .in("role", ["admin", "pastor", "presbítero", "diácono", "líder"])
    .order("name");

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Editar Recurso"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Recursos", href: "/recursos" },
          { label: resource.name, href: `/recursos/${id}` },
          { label: "Editar" },
        ]}
      />

      <div className="mt-6">
        <EditResourceForm
          resource={resource}
          responsibleOptions={members ?? []}
        />
      </div>
    </div>
  );
}
