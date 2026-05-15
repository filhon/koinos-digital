import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getProfile } from "@/actions/profile";
import { getConsents, getEmailDigestStatus } from "@/actions/privacy";
import { PageHeader } from "@/components/layout/PageHeader";
import { PrivacyPortal } from "./privacy-portal";

export const metadata = { title: "Privacidade — Koinos" };

export default async function PrivacidadePage() {
  await requireAuth();

  const [profileResult, consentsResult, emailDigestStatus] = await Promise.all([
    getProfile(),
    getConsents(),
    getEmailDigestStatus(),
  ]);

  if (!profileResult.success || !consentsResult.success) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
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
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/perfil"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Voltar ao perfil
        </Link>

        <PageHeader
          title="Privacidade e dados pessoais"
          description="Gerencie seus dados, consentimentos e direitos previstos na LGPD."
        />
      </div>

      <PrivacyPortal
        profile={profileResult.data}
        consents={consentsResult.data}
        emailDigestEnabled={emailDigestStatus.enabled}
      />
    </div>
  );
}
