"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  MessageCircleHeart,
  Lightbulb,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { respondToFeedback, updateFeedbackStatus } from "@/actions/admin";
import type {
  FeedbackRow,
  FeedbackType,
  FeedbackStatus,
} from "@/lib/validators/feedbacks";

// ─── Configs ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  FeedbackType,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  elogio: {
    label: "Elogio",
    icon: MessageCircleHeart,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  sugestao: {
    label: "Sugestão",
    icon: Lightbulb,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  reclamacao: {
    label: "Reclamação",
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
};

const STATUS_OPTIONS: {
  value: FeedbackStatus;
  label: string;
  color: string;
}[] = [
  { value: "aberto", label: "Aberto", color: "text-white/60" },
  { value: "em_analise", label: "Em análise", color: "text-amber-400" },
  { value: "respondido", label: "Respondido", color: "text-emerald-400" },
  { value: "fechado", label: "Fechado", color: "text-white/30" },
];

// ─── Status select ────────────────────────────────────────────────────────────

function StatusSelect({
  feedbackId,
  current,
}: {
  feedbackId: string;
  current: FeedbackStatus;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const conf = STATUS_OPTIONS.find((s) => s.value === current);

  async function handleChange(value: FeedbackStatus) {
    const result = await updateFeedbackStatus(feedbackId, value);
    if ("error" in result && result.error) {
      toast.error(result.error);
    } else {
      toast.success("Status atualizado.");
      startTransition(() => router.refresh());
    }
  }

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value as FeedbackStatus)}
      className={cn(
        "bg-white/6 border border-white/10 rounded-lg px-2 py-1 text-[12px] font-medium outline-none cursor-pointer hover:bg-white/10 transition-colors",
        conf?.color
      )}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ─── Reply form ───────────────────────────────────────────────────────────────

function ReplyForm({ feedbackId }: { feedbackId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    const result = await respondToFeedback(feedbackId, content);
    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
    } else {
      toast.success("Resposta enviada e notificação enviada ao membro.");
      setContent("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escreva a resposta para a liderança..."
        rows={3}
        maxLength={2000}
        className="w-full px-3 py-2 rounded-lg bg-white/6 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 resize-none transition-colors"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/30 tabular-nums">
          {content.length}/2000
        </span>
        <button
          type="submit"
          disabled={loading || content.trim().length < 5}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-[12px] font-medium hover:bg-blue-500/30 disabled:opacity-40 transition-colors"
        >
          <Send className="w-3 h-3" />
          {loading ? "Enviando..." : "Responder"}
        </button>
      </div>
    </form>
  );
}

// ─── FeedbackRow ──────────────────────────────────────────────────────────────

function FeedbackItem({
  fb,
}: {
  fb: FeedbackRow & { tenant?: { name: string; slug: string } | null };
}) {
  const [open, setOpen] = useState(false);
  const typeConf = TYPE_CONFIG[fb.type];
  const TypeIcon = typeConf.icon;
  const responses = fb.responses ?? [];

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/3 transition-colors"
      >
        <div
          className={cn(
            "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5",
            typeConf.bg
          )}
        >
          <TypeIcon className={cn("w-3.5 h-3.5", typeConf.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-[14px] font-medium text-white/90 line-clamp-1">
                {fb.title}
              </p>
              <p className="text-[12px] text-white/40 mt-0.5">
                {(fb as FeedbackRow & { tenant?: { name: string } | null })
                  .tenant?.name ?? "—"}{" "}
                ·{" "}
                {formatDistanceToNow(new Date(fb.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <StatusSelect feedbackId={fb.id} current={fb.status} />
              {open ? (
                <ChevronUp className="w-4 h-4 text-white/30" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/30" />
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-white/6 space-y-4">
              {/* Descrição */}
              <p className="text-[14px] text-white/70 leading-relaxed whitespace-pre-wrap">
                {fb.description}
              </p>

              {/* Respostas existentes */}
              {responses.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
                    Respostas ({responses.length})
                  </p>
                  {responses.map((r) => (
                    <div key={r.id} className="flex items-start gap-2.5">
                      <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Bot className="w-3 h-3 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-medium text-white/70">
                            Equipe Koinos
                          </span>
                          <span className="text-[10px] text-white/30">
                            {format(
                              new Date(r.created_at),
                              "d MMM 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </span>
                        </div>
                        <p className="text-[13px] text-white/60 leading-relaxed">
                          {r.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form para nova resposta */}
              <div>
                <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1">
                  Nova resposta
                </p>
                <ReplyForm feedbackId={fb.id} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function AdminFilterBar({
  currentFilters,
}: {
  currentFilters: {
    type?: FeedbackType;
    status?: FeedbackStatus;
    page: number;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();

  function buildUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function setFilter(key: string, value?: string) {
    router.push(
      buildUrl({
        type: key === "type" ? value : currentFilters.type,
        status:
          key === "status" ? (value as FeedbackStatus) : currentFilters.status,
        page: "1",
      })
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Type */}
      <button
        onClick={() => setFilter("type", undefined)}
        className={cn(
          "px-3 py-1 rounded-lg text-[12px] font-medium transition-colors",
          !currentFilters.type
            ? "bg-white/12 text-white"
            : "bg-white/4 text-white/50 hover:text-white/70"
        )}
      >
        Todos
      </button>
      {(["elogio", "sugestao", "reclamacao"] as FeedbackType[]).map((t) => (
        <button
          key={t}
          onClick={() => setFilter("type", t)}
          className={cn(
            "px-3 py-1 rounded-lg text-[12px] font-medium transition-colors",
            currentFilters.type === t
              ? "bg-white/12 text-white"
              : "bg-white/4 text-white/50 hover:text-white/70"
          )}
        >
          {TYPE_CONFIG[t].label}
        </button>
      ))}

      <div className="w-px bg-white/10" />

      {/* Status */}
      <button
        onClick={() => setFilter("status", undefined)}
        className={cn(
          "px-3 py-1 rounded-lg text-[12px] font-medium transition-colors",
          !currentFilters.status
            ? "bg-white/12 text-white"
            : "bg-white/4 text-white/50 hover:text-white/70"
        )}
      >
        Todos os status
      </button>
      {STATUS_OPTIONS.map((s) => (
        <button
          key={s.value}
          onClick={() => setFilter("status", s.value)}
          className={cn(
            "px-3 py-1 rounded-lg text-[12px] font-medium transition-colors",
            currentFilters.status === s.value
              ? "bg-white/12 text-white"
              : "bg-white/4 text-white/50 hover:text-white/70"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AdminFeedbacksManager({
  feedbacks,
  total,
  currentFilters,
}: {
  feedbacks: FeedbackRow[];
  total: number;
  currentFilters: {
    type?: FeedbackType;
    status?: FeedbackStatus;
    page: number;
  };
}) {
  return (
    <div className="space-y-4">
      <AdminFilterBar currentFilters={currentFilters} />

      <p className="text-[12px] text-white/30">
        {total} feedback{total !== 1 ? "s" : ""}
      </p>

      {feedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-[15px] font-medium text-white/40">
            Nenhum feedback encontrado
          </p>
          <p className="text-[13px] text-white/25">
            Tente remover os filtros ativos.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {feedbacks.map((fb) => (
            <FeedbackItem
              key={fb.id}
              fb={
                fb as FeedbackRow & {
                  tenant?: { name: string; slug: string } | null;
                }
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
