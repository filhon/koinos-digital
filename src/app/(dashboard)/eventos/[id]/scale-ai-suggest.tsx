"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
  X,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PremiumGate } from "@/components/ui/premium-gate";
import { suggestScale, upsertScaleMember } from "@/actions/scales";
import type { ScaleSuggestionResult } from "@/lib/validators/ai";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

// ─── Suggestion Card ──────────────────────────────────────────────────────────

interface SuggestionCardProps {
  suggestion: ScaleSuggestionResult;
  isSelected: boolean;
  onToggle: () => void;
}

function SuggestionCard({
  suggestion,
  isSelected,
  onToggle,
}: SuggestionCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      onClick={onToggle}
      className={[
        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all duration-150",
        isSelected
          ? "bg-primary/5 border-primary/25 shadow-sm"
          : "bg-background border-border/50 opacity-55 hover:opacity-75",
      ].join(" ")}
    >
      {/* Checkbox */}
      <div className="shrink-0 mt-0.5">
        {isSelected ? (
          <CheckCircle2 className="size-4 text-primary" />
        ) : (
          <Circle className="size-4 text-muted-foreground/50" />
        )}
      </div>

      {/* Avatar */}
      <Avatar size="sm" className="shrink-0">
        {suggestion.memberAvatar && (
          <AvatarImage
            src={suggestion.memberAvatar}
            alt={suggestion.memberName}
          />
        )}
        <AvatarFallback className="text-[9px] bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          {getInitials(suggestion.memberName)}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground leading-tight">
          {suggestion.memberName}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground italic leading-relaxed">
          &quot;{suggestion.reason}&quot;
        </p>
      </div>
    </motion.div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function SuggestionsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[60px] rounded-lg bg-muted/50 animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

// ─── AI Panel (inner, depois de PremiumGate) ──────────────────────────────────

interface AIInnerPanelProps {
  eventMinistryId: string;
}

function AIInnerPanel({ eventMinistryId }: AIInnerPanelProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState("");
  const [suggestions, setSuggestions] = useState<ScaleSuggestionResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasGenerated, setHasGenerated] = useState(false);

  const [isGenerating, startGenerating] = useTransition();
  const [isApplying, startApplying] = useTransition();

  const handleGenerate = () => {
    startGenerating(async () => {
      const result = await suggestScale({
        eventMinistryId,
        context: context.trim() || undefined,
      });

      if (!result || "code" in result) {
        toast.error(
          (result as { error: string } | null)?.error ??
            "Erro ao gerar sugestões"
        );
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }

      const data = result.data ?? [];
      setSuggestions(data);
      setSelected(new Set(data.map((s) => s.memberId)));
      setHasGenerated(true);
    });
  };

  const handleToggle = (memberId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const handleApply = () => {
    const toApply = suggestions.filter((s) => selected.has(s.memberId));
    if (!toApply.length) {
      toast.error("Selecione ao menos um membro para aplicar");
      return;
    }

    startApplying(async () => {
      let successCount = 0;
      for (const s of toApply) {
        const result = await upsertScaleMember({
          eventMinistryId,
          memberId: s.memberId,
        });
        if (!result || "code" in result || result.error) {
          toast.error(`Erro ao escalar ${s.memberName}`);
        } else {
          successCount++;
        }
      }
      if (successCount > 0) {
        toast.success(
          `${successCount} membro${successCount !== 1 ? "s" : ""} adicionado${successCount !== 1 ? "s" : ""} à escala`
        );
        setIsOpen(false);
        setSuggestions([]);
        setHasGenerated(false);
        setContext("");
        router.refresh();
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setSuggestions([]);
    setHasGenerated(false);
    setContext("");
  };

  const handleRegenerate = () => {
    setHasGenerated(false);
    setSuggestions([]);
    setSelected(new Set());
  };

  return (
    <div className="mt-2.5">
      {/* Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group inline-flex items-center gap-1.5 text-[11px] font-medium text-primary/70 hover:text-primary transition-colors"
        >
          <Sparkles className="size-3 group-hover:scale-110 transition-transform" />
          Sugerir escala com IA
        </button>
      )}

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="ai-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-primary/20 bg-gradient-to-b from-primary/[0.03] to-transparent p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/15">
                    <Sparkles className="size-3 text-primary" />
                  </div>
                  <span className="text-[11px] font-semibold text-foreground tracking-wide">
                    Sugestão de escala por IA
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  title="Fechar"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Context input + generate (antes de gerar) */}
              {!hasGenerated && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2.5"
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Contexto do evento{" "}
                      <span className="font-normal normal-case tracking-normal">
                        (opcional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleGenerate();
                      }}
                      placeholder="Ex: culto de missões, casamento, louvorzão..."
                      maxLength={200}
                      className="w-full h-8 px-3 text-xs bg-background border border-input rounded-lg placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>

                  <button
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Sparkles className="size-3" />
                    Gerar sugestões
                  </button>
                </motion.div>
              )}

              {/* Loading */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Consultando IA...
                  </div>
                  <SuggestionsSkeleton />
                </div>
              )}

              {/* Suggestions */}
              {!isGenerating && hasGenerated && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {suggestions.length} sugestão
                    {suggestions.length !== 1 ? "ões" : ""} — selecione para
                    aplicar
                  </p>

                  <div className="space-y-1.5">
                    {suggestions.map((s) => (
                      <SuggestionCard
                        key={s.memberId}
                        suggestion={s}
                        isSelected={selected.has(s.memberId)}
                        onToggle={() => handleToggle(s.memberId)}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      onClick={handleApply}
                      disabled={isApplying || selected.size === 0}
                      className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                    >
                      {isApplying ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-3" />
                      )}
                      Aplicar{selected.size > 0 ? ` ${selected.size}` : ""}{" "}
                      selecionado{selected.size !== 1 ? "s" : ""}
                    </button>

                    <button
                      onClick={handleRegenerate}
                      disabled={isApplying}
                      title="Gerar novas sugestões"
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-border/80 disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className="size-3" />
                      Regerar
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ScaleAISuggest (exportado) ───────────────────────────────────────────────

interface ScaleAISuggestProps {
  eventMinistryId: string;
  ministryName: string;
}

export function ScaleAISuggest({ eventMinistryId }: ScaleAISuggestProps) {
  return (
    <PremiumGate feature="escala_ia">
      <AIInnerPanel eventMinistryId={eventMinistryId} />
    </PremiumGate>
  );
}
