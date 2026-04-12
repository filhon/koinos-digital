"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Check, X, ChevronDown } from "lucide-react";
import { updateAdminTribe } from "@/actions/admin";
import type { AdminTribe } from "@/actions/admin";
import { cn } from "@/lib/utils";

interface TribesManagerProps {
  initialTribes: AdminTribe[];
}

interface EditState {
  id: string;
  name: string;
  color: string;
}

// Group tribes by church
function groupByChurch(tribes: AdminTribe[]) {
  const map = new Map<string, { churchName: string; tribes: AdminTribe[] }>();
  for (const t of tribes) {
    if (!map.has(t.church_id)) {
      map.set(t.church_id, { churchName: t.church_name, tribes: [] });
    }
    map.get(t.church_id)!.tribes.push(t);
  }
  return Array.from(map.entries()).map(([churchId, v]) => ({
    churchId,
    ...v,
  }));
}

const COLOR_PRESETS = [
  "#4f46e5",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#65a30d",
  "#0284c7",
  "#6d28d9",
  "#b45309",
];

export function TribesManager({ initialTribes }: TribesManagerProps) {
  const [tribes, setTribes] = useState(initialTribes);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expandedChurches, setExpandedChurches] = useState<Set<string>>(
    new Set()
  );

  const groups = groupByChurch(tribes);

  function startEdit(tribe: AdminTribe) {
    setEditing({
      id: tribe.id,
      name: tribe.name,
      color: tribe.color ?? "#4f46e5",
    });
  }

  function cancelEdit() {
    setEditing(null);
  }

  function saveEdit() {
    if (!editing) return;
    startTransition(async () => {
      const result = await updateAdminTribe({
        id: editing.id,
        name: editing.name,
        color: editing.color,
      });

      if (!result || !("data" in result) || !result.data) {
        toast.error("Erro ao salvar tribo.");
        return;
      }

      setTribes((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? { ...t, name: editing.name, color: editing.color }
            : t
        )
      );
      toast.success("Tribo atualizada.");
      setEditing(null);
    });
  }

  function toggleChurch(churchId: string) {
    setExpandedChurches((prev) => {
      const next = new Set(prev);
      if (next.has(churchId)) next.delete(churchId);
      else next.add(churchId);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {groups.map(({ churchId, churchName, tribes: churchTribes }) => {
        const expanded = expandedChurches.has(churchId);
        return (
          <div
            key={churchId}
            className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
          >
            {/* Church header */}
            <button
              onClick={() => toggleChurch(churchId)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white/80">
                  {churchName}
                </span>
                <span className="text-xs text-white/30">
                  {churchTribes.length} tribos
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-white/30 transition-transform duration-200",
                  expanded && "rotate-180"
                )}
              />
            </button>

            {/* Tribes list */}
            {expanded && (
              <div className="border-t border-white/[0.06]">
                {churchTribes.map((tribe) => {
                  const isEditing = editing?.id === tribe.id;
                  return (
                    <div
                      key={tribe.id}
                      className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Color dot */}
                      <div
                        className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/10"
                        style={{
                          backgroundColor: isEditing
                            ? editing!.color
                            : (tribe.color ?? "#4f46e5"),
                        }}
                      />

                      {isEditing ? (
                        <>
                          {/* Name input */}
                          <input
                            type="text"
                            value={editing!.name}
                            onChange={(e) =>
                              setEditing((prev) =>
                                prev ? { ...prev, name: e.target.value } : prev
                              )
                            }
                            className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary-500/50"
                            autoFocus
                          />

                          {/* Color presets */}
                          <div className="flex items-center gap-1">
                            {COLOR_PRESETS.map((c) => (
                              <button
                                key={c}
                                onClick={() =>
                                  setEditing((prev) =>
                                    prev ? { ...prev, color: c } : prev
                                  )
                                }
                                className={cn(
                                  "w-4 h-4 rounded-full ring-1 transition-transform hover:scale-110",
                                  editing!.color === c
                                    ? "ring-white scale-110"
                                    : "ring-white/20"
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={saveEdit}
                              disabled={isPending}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-400/10 transition-colors disabled:opacity-40"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-white/70">
                            {tribe.name}
                          </span>
                          {tribe.tribe_name && (
                            <span className="text-xs text-white/30 font-mono">
                              {tribe.tribe_name}
                            </span>
                          )}
                          <button
                            onClick={() => startEdit(tribe)}
                            className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {groups.length === 0 && (
        <p className="text-sm text-white/30 py-8 text-center">
          Nenhuma tribo cadastrada.
        </p>
      )}
    </div>
  );
}
