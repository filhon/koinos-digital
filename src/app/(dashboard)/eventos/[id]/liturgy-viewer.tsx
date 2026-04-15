"use client";

import {
  BookOpen,
  Music2,
  Heart,
  Mic2,
  Gift,
  Bell,
  Users,
  Droplets,
  FileText,
  HandHeart,
} from "lucide-react";
import { motion } from "framer-motion";
import type { LiturgyRow, LiturgyItemType } from "@/lib/validators/liturgy";
import { LITURGY_ITEM_TYPE_LABELS } from "@/lib/validators/liturgy";

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  LiturgyItemType,
  { icon: React.ElementType; dot: string; label: string }
> = {
  acolhimento: {
    icon: HandHeart,
    dot: "bg-success",
    label: LITURGY_ITEM_TYPE_LABELS.acolhimento,
  },
  louvor: {
    icon: Music2,
    dot: "bg-accent-500",
    label: LITURGY_ITEM_TYPE_LABELS.louvor,
  },
  oracao: {
    icon: Heart,
    dot: "bg-error",
    label: LITURGY_ITEM_TYPE_LABELS.oracao,
  },
  leitura_biblica: {
    icon: BookOpen,
    dot: "bg-primary-500",
    label: LITURGY_ITEM_TYPE_LABELS.leitura_biblica,
  },
  pregacao: {
    icon: Mic2,
    dot: "bg-primary-700",
    label: LITURGY_ITEM_TYPE_LABELS.pregacao,
  },
  oferta: {
    icon: Gift,
    dot: "bg-warning",
    label: LITURGY_ITEM_TYPE_LABELS.oferta,
  },
  avisos: {
    icon: Bell,
    dot: "bg-warning-dark",
    label: LITURGY_ITEM_TYPE_LABELS.avisos,
  },
  comunhao: {
    icon: Users,
    dot: "bg-success-dark",
    label: LITURGY_ITEM_TYPE_LABELS.comunhao,
  },
  batismo: {
    icon: Droplets,
    dot: "bg-primary-400",
    label: LITURGY_ITEM_TYPE_LABELS.batismo,
  },
  texto_livre: {
    icon: FileText,
    dot: "bg-muted-foreground",
    label: LITURGY_ITEM_TYPE_LABELS.texto_livre,
  },
};

interface LiturgyViewerProps {
  liturgy: LiturgyRow;
}

export function LiturgyViewer({ liturgy }: LiturgyViewerProps) {
  const items = liturgy.items;

  if (items.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum item na liturgia.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {items.map((item, idx) => {
        const config = TYPE_CONFIG[item.type];
        const Icon = config.icon;
        const isLast = idx === items.length - 1;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
            className="flex gap-4"
          >
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`size-2.5 rounded-full mt-1.5 shrink-0 ${config.dot}`}
              />
              {!isLast && <div className="w-px flex-1 bg-border mt-1.5 mb-0" />}
            </div>

            {/* Content */}
            <div className={`pb-5 min-w-0 flex-1 ${isLast ? "" : ""}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <Icon className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {config.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug">
                {item.title}
              </p>
              {item.content && (
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
