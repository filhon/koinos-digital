import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { getMinistryById } from "@/actions/ministries";
import { PageHeader } from "@/components/layout/PageHeader";
import { MinistryDetails } from "./ministry-details";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const result = await getMinistryById(id);
  const name = ("data" in result ? result.data?.name : null) ?? "Ministério";
  return { title: `${name} — Koinos` };
}

export default async function MinistryPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const result = await getMinistryById(id);

  if (!("data" in result) || !result.data) {
    notFound();
  }

  const ministry = result.data;

  // Carrega todos os membros da church para o painel de componentes (busca via search route)
  // Passa flags de permissão
  const isPresbiteroPlus = ["admin", "pastor", "presbítero"].includes(
    user.role
  );

  // Verifica se o usuário é o líder deste ministério
  const supabase = await createClient();
  let isMinistryLeader = false;

  if (user.role === "líder" && ministry.leader_id) {
    const { data: memberProfile } = await supabase
      .from("members")
      .select("id")
      .eq("church_id", user.church_id)
      .eq("email", user.email!)
      .maybeSingle();

    isMinistryLeader = memberProfile?.id === ministry.leader_id;
  }

  const canEditScale = isPresbiteroPlus || isMinistryLeader;
  const canManageMembers = isPresbiteroPlus || isMinistryLeader;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={ministry.name}
        description={
          ministry.leader ? `Líder: ${ministry.leader.name}` : "Ministério"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Ministérios", href: "/ministerios" },
          { label: ministry.name },
        ]}
      />

      <MinistryDetails
        ministry={ministry}
        canManageMembers={canManageMembers}
        canEditScale={canEditScale}
        canEditInfo={isPresbiteroPlus}
      />
    </div>
  );
}
