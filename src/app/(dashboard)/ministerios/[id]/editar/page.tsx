import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { getMinistryById } from "@/actions/ministries";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditMinistryForm } from "./edit-ministry-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Editar Ministério — Koinos" };

export default async function EditarMinistryPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireRole(["admin", "pastor", "presbítero"]);

  const [ministryResult, supabase] = await Promise.all([
    getMinistryById(id),
    createClient(),
  ]);

  if (!("data" in ministryResult) || !ministryResult.data) {
    notFound();
  }

  const ministry = ministryResult.data;

  const { data: members } = await supabase
    .from("members")
    .select("id, name, role, avatar_url")
    .eq("church_id", user.church_id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  const allMembers = (members ?? []) as {
    id: string;
    name: string;
    role: string;
    avatar_url: string | null;
  }[];

  const counselorOptions = allMembers.filter((m) =>
    ["pastor", "presbítero"].includes(m.role)
  );
  const leaderOptions = allMembers.filter((m) =>
    ["pastor", "presbítero", "diácono", "líder"].includes(m.role)
  );

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Editar Ministério"
        description={ministry.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Ministérios", href: "/ministerios" },
          { label: ministry.name, href: `/ministerios/${id}` },
          { label: "Editar" },
        ]}
      />

      <div className="mt-6">
        <EditMinistryForm
          ministryId={id}
          defaultValues={{
            name: ministry.name,
            counselor_id: ministry.counselor_id ?? "",
            leader_id: ministry.leader_id ?? "",
          }}
          counselorOptions={counselorOptions}
          leaderOptions={leaderOptions}
        />
      </div>
    </div>
  );
}
