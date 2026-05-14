"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageCircleHeart,
  Lightbulb,
  AlertCircle,
  Inbox,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteFeedback } from "@/actions/feedbacks";
import type {
  FeedbackRow,
  FeedbackType,
  FeedbackStatus,
} from "@/lib/validators/feedbacks";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  FeedbackType,
  { label: string; icon: React.ElementType; color: string; pill: string }
> = {
  elogio: {
    label: "Elogio",
    icon: MessageCircleHeart,
    color: "text-[oklch(0.48_0.118_148)]",
    pill: "bg-[oklch(0.48_0.118_148/0.12)] text-[oklch(0.38_0.118_148)] ring-[oklch(0.48_0.118_148/0.25)]",
  },
  sugestao: {
    label: "Sugestão",
    icon: Lightbulb,
    color: "text-[oklch(0.62_0.148_58)]",
    pill: "bg-[oklch(0.62_0.148_58/0.12)] text-[oklch(0.50_0.148_58)] ring-[oklch(0.62_0.148_58/0.25)]",
  },
  reclamacao: {
    label: "Reclamação",
    icon: AlertCircle,
    color: "text-[oklch(0.52_0.148_28)]",
    pill: "bg-[oklch(0.52_0.148_28/0.12)] text-[oklch(0.42_0.148_28)] ring-[oklch(0.52_0.148_28/0.25)]",
  },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; pill: string }> = {
  aberto: {
    label: "Aberto",
    pill: "bg-[oklch(0.88_0.01_220/0.5)] text-[oklch(0.42_0.016_220)] ring-[oklch(0.88_0.01_220)]",
  },
  em_analise: {
    label: "Em análise",
    pill: "bg-[oklch(0.68_0.152_74/0.15)] text-[oklch(0.52_0.148_74)] ring-[oklch(0.68_0.152_74/0.3)]",
  },
  respondido: {
    label: "Respondido",
    pill: "bg-[oklch(0.48_0.118_148/0.12)] text-[oklch(0.38_0.118_148)] ring-[oklch(0.48_0.118_148/0.25)]",
  },
  fechado: {
    label: "Fechado",
    pill: "bg-[oklch(0.88_0.01_220/0.3)] text-[oklch(0.52_0.016_220)] ring-[oklch(0.88_0.01_220/0.6)]",
  },
};

// ─── Filter Pill ──────────────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-full text-[13px] font-medium ring-1 transition-all duration-150",
        active
          ? (color ??
              "bg-[oklch(0.32_0.096_224)] text-[oklch(0.97_0.006_220)] ring-[oklch(0.32_0.096_224)]")
          : "bg-transparent text-[oklch(0.42_0.016_220)] ring-[oklch(0.88_0.01_220)] hover:bg-[oklch(0.88_0.01_220/0.4)]"
      )}
    >
      {label}
    </button>
  );
}

// ─── FeedbackCard ─────────────────────────────────────────────────────────────

function FeedbackCard({
  fb,
  currentMemberId,
  onDelete,
}: {
  fb: FeedbackRow;
  currentMemberId: string;
  onDelete: (id: string) => void;
}) {
  const typeConf = TYPE_CONFIG[fb.type];
  const statusConf = STATUS_CONFIG[fb.status];
  const TypeIcon = typeConf.icon;
  const isAuthor = fb.member_id === currentMemberId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group bg-[oklch(0.99_0.003_75)] border border-[oklch(0.88_0.01_220/0.6)] rounded-xl p-4 flex items-start gap-3 hover:shadow-[0_4px_6px_oklch(0.32_0.096_224/0.08),0_2px_8px_oklch(0.32_0.096_224/0.06)] transition-shadow duration-200"
    >
      {/* Type icon */}
      <div
        className={cn(
          "mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          fb.type === "elogio"
            ? "bg-[oklch(0.48_0.118_148/0.1)]"
            : fb.type === "sugestao"
              ? "bg-[oklch(0.62_0.148_58/0.1)]"
              : "bg-[oklch(0.52_0.148_28/0.1)]"
        )}
      >
        <TypeIcon className={cn("w-4 h-4", typeConf.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <Link
            href={`/feedback/${fb.id}`}
            className="text-[15px] font-medium text-[oklch(0.18_0.012_230)] hover:text-[oklch(0.32_0.096_224)] transition-colors line-clamp-1"
          >
            {fb.title}
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Type badge */}
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-medium ring-1",
                typeConf.pill
              )}
            >
              {typeConf.label}
            </span>
            {/* Status badge */}
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-medium ring-1",
                statusConf.pill
              )}
            >
              {statusConf.label}
            </span>
          </div>
        </div>

        <p className="mt-1 text-[13px] text-[oklch(0.42_0.016_220)] line-clamp-2">
          {fb.description}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[12px] text-[oklch(0.52_0.016_220)]">
            {formatDistanceToNow(new Date(fb.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>

          <div className="flex items-center gap-2">
            {isAuthor && fb.status === "aberto" && (
              <button
                onClick={() => onDelete(fb.id)}
                className="p-1 rounded text-[oklch(0.52_0.016_220)] hover:text-[oklch(0.52_0.148_28)] hover:bg-[oklch(0.52_0.148_28/0.08)] transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Excluir feedback"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <Link
              href={`/feedback/${fb.id}`}
              className="flex items-center gap-0.5 text-[12px] text-[oklch(0.52_0.016_220)] hover:text-[oklch(0.32_0.096_224)] transition-colors"
            >
              Ver
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── FeedbackList ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

export function FeedbackList({
  feedbacks: initial,
  total,
  page,
  currentType,
  currentStatus,
  currentMemberId,
}: {
  feedbacks: FeedbackRow[];
  total: number;
  page: number;
  currentType?: FeedbackType;
  currentStatus?: FeedbackStatus;
  currentMemberId: string;
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

  function setType(type?: FeedbackType) {
    router.push(buildUrl({ type, status: currentStatus, page: "1" }));
  }

  function setStatus(status?: FeedbackStatus) {
    router.push(buildUrl({ type: currentType, status, page: "1" }));
  }

  async function handleDelete(id: string) {
    const result = await deleteFeedback(id);
    if ("error" in result && result.error) {
      toast.error(result.error);
    } else {
      toast.success("Feedback excluído.");
      router.refresh();
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <FilterPill
            label="Todos os tipos"
            active={!currentType}
            onClick={() => setType(undefined)}
          />
          {(["elogio", "sugestao", "reclamacao"] as FeedbackType[]).map((t) => (
            <FilterPill
              key={t}
              label={TYPE_CONFIG[t].label}
              active={currentType === t}
              onClick={() => setType(t)}
              color={cn(
                "ring-1",
                currentType === t ? TYPE_CONFIG[t].pill : undefined
              )}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterPill
            label="Todos os status"
            active={!currentStatus}
            onClick={() => setStatus(undefined)}
          />
          {(
            [
              "aberto",
              "em_analise",
              "respondido",
              "fechado",
            ] as FeedbackStatus[]
          ).map((s) => (
            <FilterPill
              key={s}
              label={STATUS_CONFIG[s].label}
              active={currentStatus === s}
              onClick={() => setStatus(s)}
            />
          ))}
        </div>
      </div>

      {/* Lista */}
      {initial.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <Inbox className="w-10 h-10 text-[oklch(0.52_0.016_220)]" />
          <p className="text-[15px] font-medium text-[oklch(0.42_0.016_220)]">
            Nenhum feedback encontrado
          </p>
          <p className="text-[13px] text-[oklch(0.52_0.016_220)] max-w-64">
            {currentType || currentStatus
              ? "Tente remover os filtros ativos."
              : 'Clique em "Novo Feedback" para enviar sua primeira mensagem à equipe Koinos.'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {initial.map((fb) => (
              <FeedbackCard
                key={fb.id}
                fb={fb}
                currentMemberId={currentMemberId}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[13px] text-[oklch(0.52_0.016_220)]">
            {total} feedback{total !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() =>
                router.push(
                  buildUrl({
                    type: currentType,
                    status: currentStatus,
                    page: String(page - 1),
                  })
                )
              }
              className="px-3 py-1.5 rounded-lg text-[13px] font-medium border border-[oklch(0.88_0.01_220)] disabled:opacity-40 hover:bg-[oklch(0.88_0.01_220/0.4)] transition-colors"
            >
              Anterior
            </button>
            <span className="text-[13px] text-[oklch(0.42_0.016_220)]">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() =>
                router.push(
                  buildUrl({
                    type: currentType,
                    status: currentStatus,
                    page: String(page + 1),
                  })
                )
              }
              className="px-3 py-1.5 rounded-lg text-[13px] font-medium border border-[oklch(0.88_0.01_220)] disabled:opacity-40 hover:bg-[oklch(0.88_0.01_220/0.4)] transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
