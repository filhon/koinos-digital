import { listAdminTribes } from "@/actions/admin";
import { TribesManager } from "./tribes-manager";

export const metadata = { title: "Tribos — Admin Koinos" };

export default async function AdminTribesPage() {
  const result = await listAdminTribes();

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Tribos de Israel
        </h1>
        <p className="text-sm text-white/30 mt-1">
          Gerencie o nome e a cor das tribos em todos os tenants
        </p>
      </div>

      {result.error ? (
        <p className="text-sm text-red-400/80">{result.error}</p>
      ) : (
        <TribesManager initialTribes={result.data ?? []} />
      )}
    </div>
  );
}
