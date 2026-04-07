import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getProfile } from "@/actions/profile";
import { getConsents } from "@/actions/privacy";
import { PageHeader } from "@/components/layout/PageHeader";
import { PrivacyPortal } from "./privacy-portal";

export const metadata = { title: "Privacidade — Koinos" };

export default async function PrivacidadePage() {
  await requireAuth();

  const [profileResult, consentsResult] = await Promise.all([
    getProfile(),
    getConsents(),
  ]);

  if (!profileResult.success || !consentsResult.success) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Privacidade" />
        <p className="text-sm text-destructive">
          {!profileResult.success
            ? profileResult.error
            : !consentsResult.success
              ? consentsResult.error
              : "Erro desconhecido."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          href="/perfil"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Voltar ao perfil
        </Link>
      </div>

      <PageHeader
        title="Privacidade e dados pessoais"
        description="Gerencie seus dados, consentimentos e direitos previstos na LGPD."
      />

      <PrivacyPortal
        profile={profileResult.data}
        consents={consentsResult.data}
      />
    </div>
  );
}
