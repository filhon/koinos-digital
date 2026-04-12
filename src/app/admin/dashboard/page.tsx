import { getAdminStats } from "@/actions/admin";
import { Building2, Users, CheckCircle, Package } from "lucide-react";

export const metadata = { title: "Admin Dashboard — Koinos" };

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  basico: "Básico",
  pro: "Pro",
  enterprise: "Enterprise",
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-3 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
          {label}
        </span>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent}`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold tabular-nums tracking-tight text-white">
          {value}
        </p>
        {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const result = await getAdminStats();
  const stats = result.data;

  if (!stats) {
    return (
      <div className="p-8 text-white/40 text-sm">
        Erro ao carregar estatísticas.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Visão geral
        </h1>
        <p className="text-sm text-white/30 mt-1">
          Métricas agregadas do SaaS — sem dados pessoais de membros
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <StatCard
          label="Igrejas cadastradas"
          value={stats.total_tenants.toLocaleString("pt-BR")}
          icon={Building2}
          accent="bg-primary-500/20 text-primary-400"
        />
        <StatCard
          label="Igrejas ativas"
          value={stats.active_tenants.toLocaleString("pt-BR")}
          sub="com pelo menos 1 membro ativo"
          icon={CheckCircle}
          accent="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard
          label="Total de membros"
          value={stats.total_members.toLocaleString("pt-BR")}
          sub="membros ativos em todos os tenants"
          icon={Users}
          accent="bg-amber-500/20 text-amber-400"
        />
      </div>

      {/* Breakdown por plano */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <Package className="w-4 h-4 text-white/30" />
          <h2 className="text-sm font-semibold text-white/70">
            Distribuição por plano
          </h2>
        </div>

        {stats.by_plan.length === 0 ? (
          <p className="px-6 py-8 text-sm text-white/30">
            Nenhum dado disponível.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-6 py-3 text-left text-[11px] font-medium text-white/30 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-medium text-white/30 uppercase tracking-wider">
                  Igrejas
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-medium text-white/30 uppercase tracking-wider">
                  % do total
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.by_plan
                .sort((a, b) => b.count - a.count)
                .map(({ plan, count }) => (
                  <tr
                    key={plan}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-3 text-white/80 font-medium">
                      {PLAN_LABELS[plan] ?? plan}
                    </td>
                    <td className="px-6 py-3 text-right text-white tabular-nums">
                      {count.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-6 py-3 text-right text-white/40 tabular-nums">
                      {stats.total_tenants > 0
                        ? ((count / stats.total_tenants) * 100).toFixed(1) + "%"
                        : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Privacy notice */}
      <p className="mt-6 text-xs text-white/20">
        Este painel exibe apenas metadados agregados. CPF, RG, endereço e dados
        pessoais de membros nunca são expostos ao admin SaaS.
      </p>
    </div>
  );
}
