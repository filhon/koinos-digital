import { createAdminClient } from "@/lib/supabase/admin";
import { InviteRegisterForm } from "./invite-register-form";
import Link from "next/link";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function ConvitePage({ params }: Props) {
  const { code } = await params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invite_links")
    .select(
      "id, active, church_id, member_id, tenants(name, slug), members(name)"
    )
    .eq("code", code)
    .maybeSingle();

  // Convite inválido ou revogado
  if (!invite || !invite.active) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Link inválido
          </h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Este link de convite não existe ou foi revogado. Peça ao líder da
            sua comunidade um novo link.
          </p>
        </div>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85"
        >
          Criar conta sem convite
        </Link>
      </div>
    );
  }

  const churchName =
    (invite.tenants as { name?: string } | null)?.name ?? "sua igreja";
  const inviterName =
    (invite.members as { name?: string } | null)?.name ?? null;

  return (
    <div className="w-full">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          Convite recebido
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Bem-vindo a {churchName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {inviterName
            ? `${inviterName} está te convidando. Crie sua conta para participar.`
            : "Crie sua conta para participar da comunidade."}
        </p>
      </div>

      <InviteRegisterForm inviteCode={code} churchName={churchName} />
    </div>
  );
}
