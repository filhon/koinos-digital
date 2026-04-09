import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResourceForm } from "./resource-form";

export const metadata = { title: "Novo Recurso — Koinos" };

export default async function NovoRecursoPage() {
  const user = await requireAuth();

  const canCreate = ["admin", "pastor", "presbítero", "diácono"].includes(
    user.role
  );
  if (!canCreate) redirect("/403");

  const supabase = await createClient();

  // Busca liderança para o select de responsável
  const { data: members } = await supabase
    .from("members")
    .select("id, name, role")
    .eq("is_active", true)
    .in("role", ["admin", "pastor", "presbítero", "diácono", "líder"])
    .order("name");

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto">
      <PageHeader
        title="Novo Recurso"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Recursos", href: "/recursos" },
          { label: "Novo" },
        ]}
      />

      <div className="mt-6">
        <ResourceForm responsibleOptions={members ?? []} />
      </div>
    </div>
  );
}
