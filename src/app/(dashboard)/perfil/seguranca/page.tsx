import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import SecurityPanel from "./security-panel";

export default async function SegurancaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const activeFactor =
    factors?.totp?.find((f) => f.status === "verified") ?? null;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Segurança"
        description="Gerencie a autenticação em dois fatores da sua conta"
        breadcrumbs={[
          { label: "Perfil", href: "/perfil" },
          { label: "Segurança" },
        ]}
      />
      <SecurityPanel
        activeFactor={activeFactor ? { id: activeFactor.id } : null}
      />
    </div>
  );
}
