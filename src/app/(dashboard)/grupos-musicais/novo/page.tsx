import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { MusicGroupForm } from "./music-group-form";

export const metadata = { title: "Novo Grupo Musical — Koinos" };

export default async function NovoGrupoMusicalPage() {
  const user = await requireRole(["admin", "pastor", "presbítero"]);

  if (!["admin", "pastor", "presbítero"].includes(user.role)) {
    redirect("/403");
  }

  const supabase = await createClient();

  const { data: members } = await supabase
    .from("members")
    .select("id, name, role")
    .eq("church_id", user.church_id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  const leaderOptions = (members ?? []).filter((m) =>
    ["pastor", "presbítero", "diácono", "líder"].includes(m.role)
  ) as { id: string; name: string; role: string }[];

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Novo Grupo Musical"
        description="Crie um grupo de louvor para sua igreja"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Grupos Musicais", href: "/grupos-musicais" },
          { label: "Novo" },
        ]}
      />

      <div className="mt-6">
        <MusicGroupForm leaderOptions={leaderOptions} />
      </div>
    </div>
  );
}
