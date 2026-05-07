"use client";

import { useState, useTransition } from "react";
import {
  getTenantFeatureOverrides,
  setTenantFeatureOverride,
  removeTenantFeatureOverride,
  type AdminTenant,
  type TenantFeatureOverride,
} from "@/actions/admin";
import { ChevronDown, ChevronRight, Loader2, RotateCcw } from "lucide-react";

// ─── Todas as features do sistema ────────────────────────────────────────────

const PLAN_FEATURES: { key: string; label: string; plan: string }[] = [
  { key: "membros", label: "Membros", plan: "Grátis" },
  { key: "agenda", label: "Agenda", plan: "Grátis" },
  { key: "eventos", label: "Eventos", plan: "Grátis" },
  { key: "mural", label: "Mural", plan: "Grátis" },
  { key: "gamificacao_basica", label: "Gamificação Básica", plan: "Grátis" },
  { key: "ministerios", label: "Ministérios", plan: "Crescimento" },
  { key: "escalas", label: "Escalas", plan: "Crescimento" },
  { key: "grupos_musicais", label: "Grupos Musicais", plan: "Crescimento" },
  { key: "repertorio", label: "Repertório", plan: "Crescimento" },
  { key: "recursos", label: "Recursos", plan: "Crescimento" },
  { key: "financeiro_basico", label: "Financeiro Básico", plan: "Igreja" },
  { key: "assembleia", label: "Assembléia", plan: "Igreja" },
  { key: "multi_congregacao", label: "Multi-Congregação", plan: "Catedral" },
  {
    key: "suporte_prioritario",
    label: "Suporte Prioritário",
    plan: "Catedral",
  },
];

const ADDON_FEATURES: { key: string; label: string }[] = [
  { key: "liturgia_ia", label: "Liturgia IA" },
  { key: "escala_ia", label: "Escala IA" },
  { key: "landing_dominio", label: "Domínio Personalizado" },
  { key: "financeiro_avancado", label: "Financeiro Avançado" },
  { key: "assembleia_votacao", label: "Votação em Assembléia" },
  { key: "analytics_gamificacao", label: "Analytics de Gamificação" },
];

const ALL_FEATURE_KEYS = [
  ...PLAN_FEATURES.map((f) => f.key),
  ...ADDON_FEATURES.map((f) => f.key),
];

// ─── PLAN_BADGE ───────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  gratis: "bg-white/10 text-white/50",
  crescimento: "bg-emerald-500/20 text-emerald-400",
  igreja: "bg-primary-500/20 text-primary-400",
  catedral: "bg-amber-500/20 text-amber-400",
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${PLAN_COLORS[plan] ?? "bg-white/10 text-white/40"}`}
    >
      {plan}
    </span>
  );
}

// ─── IgrejasManager ───────────────────────────────────────────────────────────

export function IgrejasManager({ tenants }: { tenants: AdminTenant[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<
    Record<string, TenantFeatureOverride[]>
  >({});
  const [loading, setLoading] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleExpand(tenantId: string) {
    if (expanded === tenantId) {
      setExpanded(null);
      return;
    }
    setExpanded(tenantId);
    if (overrides[tenantId]) return;

    setLoading(tenantId);
    const { data } = await getTenantFeatureOverrides(tenantId);
    setOverrides((prev) => ({ ...prev, [tenantId]: data ?? [] }));
    setLoading(null);
  }

  function getOverride(
    tenantId: string,
    featureKey: string
  ): boolean | undefined {
    const list = overrides[tenantId] ?? [];
    const found = list.find((o) => o.feature_key === featureKey);
    return found?.enabled;
  }

  function handleToggle(
    tenantId: string,
    featureKey: string,
    enabled: boolean
  ) {
    startTransition(async () => {
      const { error } = await setTenantFeatureOverride({
        tenant_id: tenantId,
        feature_key: featureKey,
        enabled,
      });
      if (!error) {
        setOverrides((prev) => {
          const list = prev[tenantId] ?? [];
          const existing = list.findIndex((o) => o.feature_key === featureKey);
          if (existing >= 0) {
            const updated = [...list];
            updated[existing] = { feature_key: featureKey, enabled };
            return { ...prev, [tenantId]: updated };
          }
          return {
            ...prev,
            [tenantId]: [...list, { feature_key: featureKey, enabled }],
          };
        });
      }
    });
  }

  function handleRemove(tenantId: string, featureKey: string) {
    startTransition(async () => {
      const { error } = await removeTenantFeatureOverride({
        tenant_id: tenantId,
        feature_key: featureKey,
      });
      if (!error) {
        setOverrides((prev) => ({
          ...prev,
          [tenantId]: (prev[tenantId] ?? []).filter(
            (o) => o.feature_key !== featureKey
          ),
        }));
      }
    });
  }

  function handleEnableAll(tenantId: string) {
    startTransition(async () => {
      for (const key of ALL_FEATURE_KEYS) {
        await setTenantFeatureOverride({
          tenant_id: tenantId,
          feature_key: key,
          enabled: true,
        });
      }
      const { data } = await getTenantFeatureOverrides(tenantId);
      setOverrides((prev) => ({ ...prev, [tenantId]: data ?? [] }));
    });
  }

  function handleClearAll(tenantId: string) {
    startTransition(async () => {
      for (const key of ALL_FEATURE_KEYS) {
        await removeTenantFeatureOverride({
          tenant_id: tenantId,
          feature_key: key,
        });
      }
      setOverrides((prev) => ({ ...prev, [tenantId]: [] }));
    });
  }

  return (
    <div className="space-y-2">
      {tenants.map((tenant) => {
        const isOpen = expanded === tenant.id;
        const tenantOverrides = overrides[tenant.id] ?? [];
        const overrideCount = tenantOverrides.length;

        return (
          <div
            key={tenant.id}
            className="border border-white/6 rounded-xl overflow-hidden"
          >
            {/* Header da igreja */}
            <button
              onClick={() => handleExpand(tenant.id)}
              className="w-full flex items-center gap-4 px-5 py-4 bg-white/2 hover:bg-white/4 transition-colors text-left"
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {tenant.name}
                </p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  /{tenant.slug}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {overrideCount > 0 && (
                  <span className="text-[11px] text-amber-400 font-medium">
                    {overrideCount} override{overrideCount !== 1 ? "s" : ""}
                  </span>
                )}
                <PlanBadge plan={tenant.plan} />
              </div>
            </button>

            {/* Painel de overrides */}
            {isOpen && (
              <div className="border-t border-white/6 bg-[#080b11] p-5">
                {loading === tenant.id ? (
                  <div className="flex items-center gap-2 text-white/30 text-sm py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando...
                  </div>
                ) : (
                  <>
                    {/* Ações rápidas */}
                    <div className="flex items-center gap-3 mb-5">
                      <button
                        onClick={() => handleEnableAll(tenant.id)}
                        disabled={pending}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors disabled:opacity-40"
                      >
                        Ativar tudo
                      </button>
                      <button
                        onClick={() => handleClearAll(tenant.id)}
                        disabled={pending}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/6 text-white/50 hover:text-white/70 hover:bg-white/8 transition-colors disabled:opacity-40"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Remover todos overrides
                      </button>
                      {pending && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white/30 ml-auto" />
                      )}
                    </div>

                    {/* Features do plano */}
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-3">
                      Features do Plano
                    </p>
                    <div className="grid grid-cols-2 gap-1 mb-5">
                      {PLAN_FEATURES.map((feature) => (
                        <FeatureRow
                          key={feature.key}
                          featureKey={feature.key}
                          label={feature.label}
                          override={getOverride(tenant.id, feature.key)}
                          disabled={pending}
                          onEnable={() =>
                            handleToggle(tenant.id, feature.key, true)
                          }
                          onDisable={() =>
                            handleToggle(tenant.id, feature.key, false)
                          }
                          onRemove={() => handleRemove(tenant.id, feature.key)}
                        />
                      ))}
                    </div>

                    {/* Add-ons */}
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-3">
                      Add-ons
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {ADDON_FEATURES.map((feature) => (
                        <FeatureRow
                          key={feature.key}
                          featureKey={feature.key}
                          label={feature.label}
                          override={getOverride(tenant.id, feature.key)}
                          disabled={pending}
                          onEnable={() =>
                            handleToggle(tenant.id, feature.key, true)
                          }
                          onDisable={() =>
                            handleToggle(tenant.id, feature.key, false)
                          }
                          onRemove={() => handleRemove(tenant.id, feature.key)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── FeatureRow ───────────────────────────────────────────────────────────────

function FeatureRow({
  featureKey,
  label,
  override,
  disabled,
  onEnable,
  onDisable,
  onRemove,
}: {
  featureKey: string;
  label: string;
  override: boolean | undefined;
  disabled: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onRemove: () => void;
}) {
  const hasOverride = override !== undefined;
  const isEnabled = override === true;
  const isDisabled = override === false;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
        hasOverride
          ? isEnabled
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : "bg-red-500/10 border border-red-500/20"
          : "bg-white/2 border border-transparent"
      }`}
    >
      <span
        className="flex-1 text-[13px] text-white/70 truncate"
        title={featureKey}
      >
        {label}
      </span>

      {hasOverride && (
        <button
          onClick={onRemove}
          disabled={disabled}
          title="Remover override"
          className="text-white/20 hover:text-white/50 transition-colors disabled:opacity-30"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}

      <div className="flex gap-1 shrink-0">
        <button
          onClick={onEnable}
          disabled={disabled || isEnabled}
          className={`text-[11px] px-2 py-0.5 rounded transition-colors disabled:opacity-40 ${
            isEnabled
              ? "bg-emerald-500 text-white"
              : "bg-white/6 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10"
          }`}
        >
          On
        </button>
        <button
          onClick={onDisable}
          disabled={disabled || isDisabled}
          className={`text-[11px] px-2 py-0.5 rounded transition-colors disabled:opacity-40 ${
            isDisabled
              ? "bg-red-500 text-white"
              : "bg-white/6 text-white/40 hover:text-red-400 hover:bg-red-500/10"
          }`}
        >
          Off
        </button>
      </div>
    </div>
  );
}
