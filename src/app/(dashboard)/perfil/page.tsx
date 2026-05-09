import Link from "next/link";
import { Shield, Lock, Palette } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getProfile } from "@/actions/profile";
import { getMyStreak } from "@/actions/devotion";
import { getMyBadges } from "@/actions/badges";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "./profile-form";
import { BadgesSection } from "./badges-section";
import { PublicProfileSection } from "./public-profile-section";

export const metadata = { title: "Meu Perfil — Koinos" };

export default async function PerfilPage() {
  const user = await requireAuth();
  const [result, streakResult, badgesResult] = await Promise.all([
    getProfile(),
    getMyStreak(),
    getMyBadges(),
  ]);
  const streak =
    streakResult && "data" in streakResult && streakResult.data
      ? streakResult.data.current_streak
      : 0;

  if (!result.success) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <PageHeader title="Meu Perfil" />
        <p className="text-sm text-destructive">{result.error}</p>
      </div>
    );
  }

  const badges =
    badgesResult && "data" in badgesResult && badgesResult.data
      ? badgesResult.data
      : [];

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie suas informações pessoais e foto."
      />
      <ProfileForm
        profile={result.data}
        churchId={user.church_id}
        streak={streak}
      />

      {/* Perfil público */}
      <PublicProfileSection profile={result.data} />

      {/* Conquistas */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <BadgesSection initialBadges={badges} />
      </div>

      {/* Links de conta */}
      <div className="flex flex-col gap-2 pt-2">
        <Link
          href="/perfil/seguranca"
          className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Shield className="h-4 w-4 text-gray-400" />
          <span>Segurança e autenticação em dois fatores</span>
        </Link>
        <Link
          href="/perfil/aparencia"
          className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Palette className="h-4 w-4 text-gray-400" />
          <span>Aparência e modo escuro programado</span>
        </Link>
        <Link
          href="/perfil/privacidade"
          className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Lock className="h-4 w-4 text-gray-400" />
          <span>Privacidade e dados LGPD</span>
        </Link>
      </div>
    </div>
  );
}
