"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check, Tag } from "lucide-react";
import { toast } from "sonner";
import { updateMemberTags } from "@/actions/members";
import { PRESET_TAGS } from "@/lib/validators/members";
import { cn } from "@/lib/utils";

// Cores fixas por tag pré-definida
const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> =
  {
    Intercessor: {
      bg: "bg-rose-50 dark:bg-rose-900/20",
      text: "text-rose-700 dark:text-rose-300",
      border: "border-rose-200 dark:border-rose-800",
    },
    Servidor: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-200 dark:border-blue-800",
    },
    "Líder de Louvor": {
      bg: "bg-violet-50 dark:bg-violet-900/20",
      text: "text-violet-700 dark:text-violet-300",
      border: "border-violet-200 dark:border-violet-800",
    },
    Evangelista: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-200 dark:border-amber-800",
    },
    Discipulador: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-200 dark:border-emerald-800",
    },
    Testemunha: {
      bg: "bg-teal-50 dark:bg-teal-900/20",
      text: "text-teal-700 dark:text-teal-300",
      border: "border-teal-200 dark:border-teal-800",
    },
  };

const DEFAULT_COLOR = {
  bg: "bg-muted",
  text: "text-muted-foreground",
  border: "border-border",
};

export function getTagColor(tag: string) {
  return TAG_COLORS[tag] ?? DEFAULT_COLOR;
}

interface TagChipProps {
  tag: string;
  size?: "sm" | "md";
}

export function TagChip({ tag, size = "sm" }: TagChipProps) {
  const color = getTagColor(tag);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        color.bg,
        color.text,
        color.border,
        size === "sm"
          ? "px-1.5 py-0.5 text-[10px] gap-0.5"
          : "px-2 py-0.5 text-xs gap-1"
      )}
    >
      <Tag
        className={cn("shrink-0", size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3")}
      />
      {tag}
    </span>
  );
}

interface TagsEditorProps {
  memberId: string;
  initialTags: string[];
}

export function TagsEditor({ memberId, initialTags }: TagsEditorProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [isPending, startTransition] = useTransition();

  const atMax = tags.length >= 3;

  function toggle(tag: string) {
    if (tags.includes(tag)) {
      save(tags.filter((t) => t !== tag));
    } else if (!atMax) {
      save([...tags, tag]);
    }
  }

  function addCustom() {
    const trimmed = customInput.trim();
    if (!trimmed || tags.includes(trimmed) || atMax) return;
    save([...tags, trimmed]);
    setCustomInput("");
    setShowCustom(false);
  }

  function save(next: string[]) {
    setTags(next);
    startTransition(async () => {
      const result = await updateMemberTags({ memberId, tags: next });
      if (!result || !("data" in result) || !result.data) {
        toast.error("Erro ao salvar tags.");
        setTags(tags); // revert
        return;
      }
      toast.success("Tags atualizadas.");
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
          Tags de atribuição
        </h3>
        {atMax && (
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            Máx. 3 tags
          </span>
        )}
      </div>

      {/* Tags selecionadas */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence>
            {tags.map((tag) => {
              const color = getTagColor(tag);
              return (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium",
                    color.bg,
                    color.text,
                    color.border
                  )}
                >
                  {tag}
                  <button
                    onClick={() => toggle(tag)}
                    disabled={isPending}
                    className="ml-0.5 rounded-full hover:opacity-70 transition-opacity"
                    aria-label={`Remover tag ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Chips pré-definidos */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          Sugestões
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TAGS.map((tag) => {
            const selected = tags.includes(tag);
            const color = getTagColor(tag);
            const disabled = !selected && atMax;
            return (
              <button
                key={tag}
                onClick={() => toggle(tag)}
                disabled={isPending || disabled}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all duration-150",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? cn(color.bg, color.text, color.border)
                    : disabled
                      ? "bg-muted/40 text-muted-foreground/40 border-border/40 cursor-not-allowed"
                      : "bg-background text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {selected && <Check className="w-2.5 h-2.5" />}
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tag personalizada */}
      <div>
        {showCustom ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustom();
                if (e.key === "Escape") {
                  setShowCustom(false);
                  setCustomInput("");
                }
              }}
              placeholder="Nome da tag..."
              maxLength={50}
              autoFocus
              className="flex-1 h-8 px-3 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
            />
            <button
              onClick={addCustom}
              disabled={!customInput.trim() || atMax || isPending}
              className="h-8 px-3 text-xs font-medium rounded-lg bg-primary text-primary-foreground disabled:opacity-50 transition-opacity"
            >
              Adicionar
            </button>
            <button
              onClick={() => {
                setShowCustom(false);
                setCustomInput("");
              }}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCustom(true)}
            disabled={atMax || isPending}
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
              (atMax || isPending) && "opacity-40 cursor-not-allowed"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Tag personalizada
          </button>
        )}
      </div>
    </div>
  );
}
