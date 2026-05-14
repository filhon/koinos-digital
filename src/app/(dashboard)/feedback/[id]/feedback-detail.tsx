"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  MessageCircleHeart,
  Lightbulb,
  AlertCircle,
  MessageSquare,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  FeedbackRow,
  FeedbackType,
  FeedbackStatus,
  FeedbackResponseRow,
} from "@/lib/validators/feedbacks";

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  FeedbackType,
  { label: string; icon: React.ElementType; iconColor: string; bg: string }
> = {
  elogio: {
    label: "Elogio",
    icon: MessageCircleHeart,
    iconColor: "text-[oklch(0.48_0.118_148)]",
    bg: "bg-[oklch(0.48_0.118_148/0.1)]",
  },
  sugestao: {
    label: "Sugestão",
    icon: Lightbulb,
    iconColor: "text-[oklch(0.62_0.148_58)]",
    bg: "bg-[oklch(0.62_0.148_58/0.1)]",
  },
  reclamacao: {
    label: "Reclamação",
    icon: AlertCircle,
    iconColor: "text-[oklch(0.52_0.148_28)]",
    bg: "bg-[oklch(0.52_0.148_28/0.1)]",
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

// ─── Response bubble ──────────────────────────────────────────────────────────

function ResponseBubble({
  response,
  index,
}: {
  response: FeedbackResponseRow;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.06, ease: "easeOut" }}
      className="flex items-start gap-3"
    >
      {/* Avatar equipe */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center">
        <Bot className="w-4 h-4 text-[oklch(0.97_0.006_220)]" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-medium text-[oklch(0.18_0.012_230)]">
            Equipe Koinos
          </span>
          <span className="text-[11px] text-[oklch(0.52_0.016_220)]">
            {format(new Date(response.created_at), "d 'de' MMM 'às' HH:mm", {
              locale: ptBR,
            })}
          </span>
        </div>
        <div className="bg-[oklch(0.32_0.096_224/0.06)] border border-[oklch(0.32_0.096_224/0.15)] rounded-xl rounded-tl-sm px-4 py-3">
          <p className="text-[14px] text-[oklch(0.18_0.012_230)] leading-relaxed whitespace-pre-wrap">
            {response.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── FeedbackDetail ───────────────────────────────────────────────────────────

export function FeedbackDetail({ feedback: fb }: { feedback: FeedbackRow }) {
  const typeConf = TYPE_CONFIG[fb.type];
  const statusConf = STATUS_CONFIG[fb.status];
  const TypeIcon = typeConf.icon;
  const responses = fb.responses ?? [];

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-[oklch(0.99_0.003_75)] border border-[oklch(0.88_0.01_220/0.6)] rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
                typeConf.bg
              )}
            >
              <TypeIcon className={cn("w-5 h-5", typeConf.iconColor)} />
            </div>
            <div>
              <h1 className="font-[Instrument_Serif,Georgia,serif] text-[1.375rem] text-[oklch(0.18_0.012_230)] tracking-[-0.01em] leading-[1.3]">
                {fb.title}
              </h1>
              <p className="text-[13px] text-[oklch(0.52_0.016_220)] mt-0.5">
                {format(new Date(fb.created_at), "d 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium ring-1",
                TYPE_CONFIG[fb.type].bg,
                typeConf.iconColor,
                "ring-current"
              )}
            >
              {typeConf.label}
            </span>
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium ring-1",
                statusConf.pill
              )}
            >
              {statusConf.label}
            </span>
          </div>
        </div>

        <p className="text-[15px] text-[oklch(0.18_0.012_230)] leading-relaxed whitespace-pre-wrap">
          {fb.description}
        </p>

        {fb.allow_public && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-[oklch(0.48_0.118_148)] bg-[oklch(0.48_0.118_148/0.1)] px-2.5 py-0.5 rounded-full ring-1 ring-[oklch(0.48_0.118_148/0.25)]">
              Divulgação autorizada
            </span>
          </div>
        )}
      </div>

      {/* Respostas */}
      {responses.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[oklch(0.52_0.016_220)]" />
            <span className="text-[13px] font-medium text-[oklch(0.42_0.016_220)]">
              {responses.length} resposta{responses.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-4 pl-1">
            {responses.map((r, i) => (
              <ResponseBubble key={r.id} response={r} index={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <div className="w-10 h-10 rounded-full bg-[oklch(0.88_0.01_220/0.5)] flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[oklch(0.52_0.016_220)]" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-[oklch(0.42_0.016_220)]">
              Aguardando resposta
            </p>
            <p className="text-[13px] text-[oklch(0.52_0.016_220)] mt-0.5">
              A equipe Koinos vai analisar e responder em breve.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
