import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { getMusicGroupById } from "@/actions/music-groups";
import { EditMusicGroupForm } from "./edit-music-group-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Editar Grupo Musical — Koinos" };

export default async function EditarGrupoMusicalPage({ params }: PageProps) {
  const user = await requireRole(["admin", "pastor", "presbítero"]);

  if (!["admin", "pastor", "presbítero"].includes(user.role)) {
    redirect("/403");
  }

  const { id } = await params;
  const result = await getMusicGroupById(id);

  if (!result || "code" in result || result.error || !result.data) {
    notFound();
  }

  const group = result.data;

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
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto">
      <PageHeader
        title="Editar Grupo Musical"
        description={`Editando: ${group.name}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Grupos Musicais", href: "/grupos-musicais" },
          { label: group.name, href: `/grupos-musicais/${group.id}` },
          { label: "Editar" },
        ]}
      />

      <div className="mt-6">
        <EditMusicGroupForm group={group} leaderOptions={leaderOptions} />
      </div>
    </div>
  );
}
