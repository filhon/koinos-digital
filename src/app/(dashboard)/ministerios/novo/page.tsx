import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { MinistryForm } from "./ministry-form";

export const metadata = { title: "Novo Ministério — Koinos" };

export default async function NovoMinisterioPage() {
  const user = await requireRole(["admin", "pastor", "presbítero"]);

  const supabase = await createClient();

  // Carrega membros disponíveis para conselheiro e líder
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

  // Conselheiros: presbítero ou pastor
  const counselorOptions = allMembers.filter((m) =>
    ["pastor", "presbítero"].includes(m.role)
  );

  // Líderes: qualquer membro com papel de gestão
  const leaderOptions = allMembers.filter((m) =>
    ["pastor", "presbítero", "diácono", "líder"].includes(m.role)
  );

  if (!["admin", "pastor", "presbítero"].includes(user.role)) {
    redirect("/403");
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto">
      <PageHeader
        title="Novo Ministério"
        description="Crie um novo ministério para sua igreja"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Ministérios", href: "/ministerios" },
          { label: "Novo" },
        ]}
      />

      <div className="mt-6">
        <MinistryForm
          counselorOptions={counselorOptions}
          leaderOptions={leaderOptions}
        />
      </div>
    </div>
  );
}
