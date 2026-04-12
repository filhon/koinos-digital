"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Zap, Check, RotateCcw } from "lucide-react";
import { updateScoreConfig } from "@/actions/admin";
import type { ScoreConfigRow } from "@/actions/admin";
import { cn } from "@/lib/utils";

interface ScoreConfigManagerProps {
  initialConfig: ScoreConfigRow[];
}

const ACTION_ICONS: Record<string, string> = {
  checkin: "✅",
  invite: "👥",
  daily_read: "📖",
  streak_7: "🔥",
  streak_30: "⚡",
};

export function ScoreConfigManager({ initialConfig }: ScoreConfigManagerProps) {
  const [config, setConfig] = useState<ScoreConfigRow[]>(initialConfig);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [saving, startSave] = useTransition();
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  function setDraft(action_type: string, value: number) {
    setDrafts((prev) => ({ ...prev, [action_type]: value }));
  }

  function getDraft(action_type: string): number {
    return (
      drafts[action_type] ??
      config.find((c) => c.action_type === action_type)?.points ??
      0
    );
  }

  function isDirty(action_type: string): boolean {
    const original =
      config.find((c) => c.action_type === action_type)?.points ?? 0;
    return action_type in drafts && drafts[action_type] !== original;
  }

  function reset(action_type: string) {
    setDrafts((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [action_type]: _, ...next } = prev;
      return next;
    });
  }

  function save(action_type: string) {
    const points = getDraft(action_type);
    startSave(async () => {
      const result = await updateScoreConfig({ action_type, points });
      if (!result || !("data" in result) || !result.data) {
        toast.error("Erro ao salvar.");
        return;
      }
      setConfig((prev) =>
        prev.map((c) => (c.action_type === action_type ? { ...c, points } : c))
      );
      setDrafts((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [action_type]: _, ...next } = prev;
        return next;
      });
      setSavedKeys((prev) => {
        const next = new Set(prev);
        next.add(action_type);
        setTimeout(() => {
          setSavedKeys((s) => {
            const n = new Set(s);
            n.delete(action_type);
            return n;
          });
        }, 2000);
        return next;
      });
      toast.success("Pontuação atualizada.");
    });
  }

  return (
    <div className="space-y-3">
      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300/70">
          Os valores editados aqui são usados pelas funções SQL de pontuação em
          tempo real. Alterações têm efeito imediato nos próximos eventos de
          gamificação.
        </p>
      </div>

      {/* Rows */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-6 py-3 text-left text-[11px] font-medium text-white/30 uppercase tracking-wider">
                Ação
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-medium text-white/30 uppercase tracking-wider hidden sm:table-cell">
                Descrição
              </th>
              <th className="px-6 py-3 text-right text-[11px] font-medium text-white/30 uppercase tracking-wider w-40">
                Pontos
              </th>
              <th className="px-6 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {config.map((row) => {
              const draft = getDraft(row.action_type);
              const dirty = isDirty(row.action_type);
              const saved = savedKeys.has(row.action_type);

              return (
                <tr
                  key={row.action_type}
                  className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Label */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">
                        {ACTION_ICONS[row.action_type] ?? "⭐"}
                      </span>
                      <span className="font-medium text-white/80">
                        {row.label}
                      </span>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4 text-white/30 text-xs hidden sm:table-cell">
                    {row.description}
                  </td>

                  {/* Points input */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="number"
                        min={0}
                        max={10000}
                        value={draft}
                        onChange={(e) =>
                          setDraft(row.action_type, Number(e.target.value))
                        }
                        className={cn(
                          "w-20 text-right bg-white/[0.06] border rounded-lg px-2.5 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-primary-500/50 transition-colors",
                          dirty ? "border-amber-500/40" : "border-white/10"
                        )}
                      />
                      {dirty && (
                        <button
                          onClick={() => reset(row.action_type)}
                          className="text-white/20 hover:text-white/50 transition-colors"
                          title="Resetar"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Save */}
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      {saved ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                          <Check className="w-3.5 h-3.5" />
                          Salvo
                        </span>
                      ) : (
                        <button
                          onClick={() => save(row.action_type)}
                          disabled={!dirty || saving}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            dirty
                              ? "bg-amber-500/15 border border-amber-500/20 text-amber-400 hover:bg-amber-500/25"
                              : "text-white/20 cursor-not-allowed"
                          )}
                        >
                          {saving ? "..." : "Salvar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
