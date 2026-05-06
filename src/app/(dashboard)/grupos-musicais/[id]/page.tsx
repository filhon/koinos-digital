import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { getMusicGroupById } from "@/actions/music-groups";
import { MusicGroupDetails } from "./music-group-details";
import type { MemberSummary } from "@/actions/music-groups";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const result = await getMusicGroupById(id);
  if (!result || "code" in result || result.error) {
    return { title: "Grupo Musical — Koinos" };
  }
  return { title: `${result.data?.name} — Koinos` };
}

export default async function GrupoMusicalPage({ params }: PageProps) {
  const { id } = await params;

  const [result, user] = await Promise.all([getMusicGroupById(id), getUser()]);

  if (!result || "code" in result || result.error || !result.data) {
    notFound();
  }

  const group = result.data;

  const canEdit =
    !!user && ["admin", "pastor", "presbítero"].includes(user.role);
  const canManage =
    !!user &&
    (["admin", "pastor", "presbítero", "diácono"].includes(user.role) ||
      (user.role === "líder" && group.leader?.id !== undefined));

  // Carrega todos os membros para adicionar ao grupo
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("members")
    .select("id, name, avatar_url, role")
    .eq("church_id", user!.church_id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  const allMembers = (members ?? []) as MemberSummary[];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={group.name}
        description="Detalhes e componentes do grupo musical"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Grupos Musicais", href: "/grupos-musicais" },
          { label: group.name },
        ]}
      />

      <div className="mt-6">
        <MusicGroupDetails
          group={group}
          allMembers={allMembers}
          canManage={canManage}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
