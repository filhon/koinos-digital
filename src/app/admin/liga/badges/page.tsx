import { listAdminBadges } from "@/actions/admin";
import { BadgesManager } from "./badges-manager";

export const metadata = { title: "Badges — Admin Koinos" };

export default async function AdminBadgesPage() {
  const result = await listAdminBadges();

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Badges globais
        </h1>
        <p className="text-sm text-white/30 mt-1">
          CRUD de conquistas disponíveis para todos os tenants
        </p>
      </div>

      {result.error ? (
        <p className="text-sm text-red-400/80">{result.error}</p>
      ) : (
        <BadgesManager initialBadges={result.data ?? []} />
      )}
    </div>
  );
}
