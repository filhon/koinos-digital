import { PageHeader } from "@/components/layout/PageHeader";
import { getMyScale } from "@/actions/scales";
import { MyScaleView } from "./my-scale-view";
import { PremiumGate } from "@/components/ui/premium-gate";

export const metadata = { title: "Minha Escala — Koinos" };

export default async function EscalasPage() {
  const result = await getMyScale();
  const entries = "data" in result ? (result.data ?? []) : [];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Minha Escala"
        description="Veja os eventos em que você está escalado"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Minha Escala" },
        ]}
      />

      <PremiumGate feature="escalas">
        <div className="mt-6">
          {result.error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
              Erro ao carregar escala: {result.error}
            </div>
          ) : (
            <MyScaleView entries={entries} />
          )}
        </div>
      </PremiumGate>
    </div>
  );
}
