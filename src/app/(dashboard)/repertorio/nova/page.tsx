import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { SongForm } from "./song-form";

interface PageProps {
  searchParams: Promise<{ grupo?: string }>;
}

export const metadata = { title: "Nova Música — Koinos" };

export default async function NovaMusicaPage({ searchParams }: PageProps) {
  const user = await requireRole([
    "admin",
    "pastor",
    "presbítero",
    "diácono",
    "líder",
  ]);

  const params = await searchParams;

  const supabase = await createClient();

  // Carrega grupos musicais do tenant
  const { data: groups } = await supabase
    .from("music_groups")
    .select("id, name, leader_id")
    .eq("church_id", user.church_id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (!groups || groups.length === 0) {
    redirect("/grupos-musicais");
  }

  // Se for líder, filtra para mostrar apenas seu grupo
  let availableGroups = groups as {
    id: string;
    name: string;
    leader_id: string | null;
  }[];

  if (user.role === "líder") {
    const { data: memberProfile } = await supabase
      .from("members")
      .select("id")
      .eq("church_id", user.church_id)
      .eq("email", user.email!)
      .maybeSingle();

    if (memberProfile) {
      availableGroups = availableGroups.filter(
        (g) => g.leader_id === memberProfile.id
      );
    }

    if (availableGroups.length === 0) {
      redirect("/repertorio");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Nova Música"
        description="Adicione uma música ao repertório do grupo"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Repertório", href: "/repertorio" },
          { label: "Nova música" },
        ]}
      />

      <div className="mt-6">
        <SongForm groups={availableGroups} defaultGroupId={params.grupo} />
      </div>
    </div>
  );
}
