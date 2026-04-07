import { requireAuth } from "@/lib/auth/session";
import { getProfile } from "@/actions/profile";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Meu Perfil — Koinos" };

export default async function PerfilPage() {
  const user = await requireAuth();
  const result = await getProfile();

  if (!result.success) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Meu Perfil" />
        <p className="text-sm text-destructive">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie suas informações pessoais e foto."
      />
      <ProfileForm profile={result.data} churchId={user.church_id} />
    </div>
  );
}
