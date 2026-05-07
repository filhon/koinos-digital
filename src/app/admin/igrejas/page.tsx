import { listAdminTenants } from "@/actions/admin";
import { IgrejasManager } from "./igrejas-manager";

export const metadata = { title: "Igrejas — Admin Koinos" };

export default async function AdminIgrejasPage() {
  const { data: tenants, error } = await listAdminTenants();

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-400 text-sm">
          Erro ao carregar igrejas: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Igrejas</h1>
        <p className="text-white/40 text-sm mt-1">
          Gerencie acesso a features por tenant. Overrides sobrescrevem o plano
          base.
        </p>
      </div>

      <IgrejasManager tenants={tenants ?? []} />
    </div>
  );
}
