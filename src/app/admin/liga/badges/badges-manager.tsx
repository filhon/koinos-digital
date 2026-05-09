"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Award } from "lucide-react";
import {
  createAdminBadge,
  updateAdminBadge,
  deleteAdminBadge,
} from "@/actions/admin";
import type { AdminBadge } from "@/actions/admin";

const TRIGGER_TYPES = [
  { value: "first_checkin", label: "Primeiro check-in" },
  { value: "invite_count", label: "Total de convites" },
  { value: "streak", label: "Streak de devoção" },
  { value: "tenure", label: "Tempo de membro (dias)" },
  { value: "manual", label: "Manual (atribuição direta)" },
] as const;

type TriggerType = (typeof TRIGGER_TYPES)[number]["value"];

const TRIGGER_CONFIG_HINTS: Record<TriggerType, string> = {
  first_checkin: "{ } — nenhuma configuração necessária",
  invite_count: '{ "min": 5 } — mínimo de convites aceitos',
  streak: '{ "min": 7 } — dias consecutivos de leitura',
  tenure: '{ "min": 365 } — dias como membro',
  manual: "{ } — atribuído manualmente pela liderança",
};

interface BadgeFormData {
  name: string;
  description: string;
  icon: string;
  trigger_type: TriggerType;
  trigger_config_raw: string;
}

const EMPTY_FORM: BadgeFormData = {
  name: "",
  description: "",
  icon: "🏅",
  trigger_type: "first_checkin",
  trigger_config_raw: "{}",
};

interface BadgesManagerProps {
  initialBadges: AdminBadge[];
}

function BadgeRow({
  badge,
  onEdit,
  onDelete,
}: {
  badge: AdminBadge;
  onEdit: (badge: AdminBadge) => void;
  onDelete: (id: string) => void;
}) {
  const [isDeleting, startDelete] = useTransition();

  function handleDelete() {
    if (
      !confirm(
        `Excluir badge "${badge.name}"? Esta ação não pode ser desfeita.`
      )
    )
      return;
    startDelete(async () => {
      const result = await deleteAdminBadge(badge.id);
      if (!result || !("data" in result) || !result.data) {
        toast.error("Erro ao excluir badge.");
        return;
      }
      toast.success("Badge excluído.");
      onDelete(badge.id);
    });
  }

  const triggerLabel =
    TRIGGER_TYPES.find((t) => t.value === badge.trigger_type)?.label ??
    badge.trigger_type;

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-xl shrink-0">
        {badge.icon ?? <Award className="w-5 h-5 text-white/30" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/90">
            {badge.name}
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary-500/15 text-primary-400 border border-primary-500/20">
            {triggerLabel}
          </span>
        </div>
        {badge.description && (
          <p className="text-xs text-white/30 mt-0.5 truncate">
            {badge.description}
          </p>
        )}
        <p className="text-[10px] text-white/20 mt-0.5 font-mono">
          config: {JSON.stringify(badge.trigger_config)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(badge)}
          className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function BadgeForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: AdminBadge;
  onSave: (badge: AdminBadge) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<BadgeFormData>(
    initial
      ? {
          name: initial.name,
          description: initial.description ?? "",
          icon: initial.icon ?? "🏅",
          trigger_type: initial.trigger_type as TriggerType,
          trigger_config_raw: JSON.stringify(initial.trigger_config, null, 2),
        }
      : EMPTY_FORM
  );
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof BadgeFormData>(k: K, v: BadgeFormData[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function handleSave() {
    let config: Record<string, unknown> = {};
    try {
      config = JSON.parse(form.trigger_config_raw || "{}");
    } catch {
      toast.error("trigger_config inválido (JSON esperado).");
      return;
    }

    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        icon: form.icon.trim() || undefined,
        trigger_type: form.trigger_type,
        trigger_config: config,
      };

      let result;
      if (initial) {
        result = await updateAdminBadge(initial.id, payload);
      } else {
        result = await createAdminBadge(payload);
      }

      if (!result || !("data" in result) || !result.data) {
        toast.error("Erro ao salvar badge.");
        return;
      }

      toast.success(initial ? "Badge atualizado." : "Badge criado.");
      onSave({
        id: result.data.id,
        ...payload,
        description: payload.description ?? null,
        icon: payload.icon ?? null,
        trigger_config: config,
        created_at: initial?.created_at ?? new Date().toISOString(),
      } as AdminBadge);
    });
  }

  return (
    <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white/70">
        {initial ? "Editar badge" : "Novo badge"}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
            Nome *
          </label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ex: Evangelista"
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary-500/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
            Ícone (emoji)
          </label>
          <input
            value={form.icon}
            onChange={(e) => set("icon", e.target.value)}
            placeholder="🏅"
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary-500/50"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
          Descrição
        </label>
        <input
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Descrição da conquista..."
          className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary-500/50"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
            Tipo de trigger
          </label>
          <select
            value={form.trigger_type}
            onChange={(e) => {
              set("trigger_type", e.target.value as TriggerType);
              set("trigger_config_raw", "{}");
            }}
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50"
          >
            {TRIGGER_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-[#0a0d14]">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
            Configuração (JSON)
          </label>
          <input
            value={form.trigger_config_raw}
            onChange={(e) => set("trigger_config_raw", e.target.value)}
            placeholder={TRIGGER_CONFIG_HINTS[form.trigger_type]}
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-primary-500/50"
          />
          <p className="text-[10px] text-white/20">
            {TRIGGER_CONFIG_HINTS[form.trigger_type]}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={isPending || !form.name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-40 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          {isPending ? "Salvando..." : "Salvar"}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function BadgesManager({ initialBadges }: BadgesManagerProps) {
  const [badges, setBadges] = useState<AdminBadge[]>(initialBadges);
  const [formMode, setFormMode] = useState<"hidden" | "create" | AdminBadge>(
    "hidden"
  );

  function handleSave(badge: AdminBadge) {
    setBadges((prev) => {
      const idx = prev.findIndex((b) => b.id === badge.id);
      if (idx >= 0) {
        return prev.map((b) => (b.id === badge.id ? badge : b));
      }
      return [badge, ...prev];
    });
    setFormMode("hidden");
  }

  function handleDelete(id: string) {
    setBadges((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/30">{badges.length} badge(s)</span>
        {formMode === "hidden" && (
          <button
            onClick={() => setFormMode("create")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-500/15 border border-primary-500/20 text-primary-400 text-sm font-medium hover:bg-primary-500/25 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo badge
          </button>
        )}
      </div>

      {/* Create form */}
      {formMode === "create" && (
        <BadgeForm onSave={handleSave} onCancel={() => setFormMode("hidden")} />
      )}

      {/* List */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        {badges.length === 0 && formMode === "hidden" ? (
          <p className="px-5 py-10 text-sm text-white/30 text-center">
            Nenhum badge cadastrado.
          </p>
        ) : (
          badges.map((badge) => (
            <div key={badge.id}>
              {typeof formMode === "object" && formMode.id === badge.id ? (
                <div className="p-4">
                  <BadgeForm
                    initial={badge}
                    onSave={handleSave}
                    onCancel={() => setFormMode("hidden")}
                  />
                </div>
              ) : (
                <BadgeRow
                  badge={badge}
                  onEdit={(b) => setFormMode(b)}
                  onDelete={handleDelete}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
