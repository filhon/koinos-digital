import { getScoreConfig } from "@/actions/admin";
import { ScoreConfigManager } from "./score-config-manager";

export const metadata = { title: "Pontuação — Admin Koinos" };

export default async function AdminScoringPage() {
  const result = await getScoreConfig();

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Tabela de pontuação
        </h1>
        <p className="text-sm text-white/30 mt-1">
          Edite os pontos padrão concedidos por cada ação de engajamento
        </p>
      </div>

      {result.error ? (
        <p className="text-sm text-red-400/80">{result.error}</p>
      ) : (
        <ScoreConfigManager initialConfig={result.data ?? []} />
      )}
    </div>
  );
}
