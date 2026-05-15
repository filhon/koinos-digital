"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Circle,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ROADMAP_ITEMS,
  ROADMAP_COLUMNS,
  type RoadmapStatus,
  type RoadmapCategory,
  type RoadmapItem,
} from "@/lib/constants/roadmap";

// ─── Category badge styles ────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<
  RoadmapCategory,
  { bg: string; text: string; border: string }
> = {
  Gestão: {
    bg: "bg-primary-50",
    text: "text-primary-700",
    border: "border-primary-200",
  },
  Comunidade: {
    bg: "bg-accent-50",
    text: "text-accent-700",
    border: "border-accent-200",
  },
  IA: {
    bg: "bg-secondary",
    text: "text-secondary-foreground",
    border: "border-border",
  },
  Liga: {
    bg: "bg-warning-light",
    text: "text-warning-dark",
    border: "border-warning",
  },
  Marketing: {
    bg: "bg-success-light",
    text: "text-success-dark",
    border: "border-success",
  },
  Plataforma: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
};

// ─── Column visual config ─────────────────────────────────────────────────────

const COLUMN_CONFIG: Record<
  RoadmapStatus,
  {
    Icon: typeof CheckCircle2;
    iconClass: string;
    labelClass: string;
    cardBg: string;
    cardBorder: string;
    iconWrapBg: string;
  }
> = {
  launched: {
    Icon: CheckCircle2,
    iconClass: "text-success",
    labelClass: "text-success-dark",
    cardBg: "bg-success-light/30",
    cardBorder: "border-success/20",
    iconWrapBg: "bg-success-light",
  },
  in_progress: {
    Icon: Clock,
    iconClass: "text-accent-500",
    labelClass: "text-accent-700",
    cardBg: "bg-accent-50",
    cardBorder: "border-accent-200",
    iconWrapBg: "bg-accent-100",
  },
  planned: {
    Icon: Circle,
    iconClass: "text-muted-foreground",
    labelClass: "text-muted-foreground",
    cardBg: "bg-card",
    cardBorder: "border-border/60",
    iconWrapBg: "bg-muted",
  },
};

// ─── Card ─────────────────────────────────────────────────────────────────────

function RoadmapCard({ item, index }: { item: RoadmapItem; index: number }) {
  const col = COLUMN_CONFIG[item.status];
  const cat = CATEGORY_STYLES[item.category];
  const Icon = item.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: index * 0.055,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ scale: 1.013 }}
      className={cn(
        "rounded-xl border p-4 transition-shadow duration-200 hover:shadow-md",
        col.cardBg,
        col.cardBorder
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn("mt-0.5 shrink-0 rounded-lg p-1.5", col.iconWrapBg)}>
          <Icon
            className={cn("w-[18px] h-[18px]", col.iconClass)}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground text-sm leading-snug mb-1">
            {item.title}
          </h3>
          <p
            className="text-xs leading-relaxed mb-3"
            style={{ color: "var(--text-body)" }}
          >
            {item.description}
          </p>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
              cat.bg,
              cat.text,
              cat.border
            )}
          >
            {item.category}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function RoadmapColumn({ status }: { status: RoadmapStatus }) {
  const col = COLUMN_CONFIG[status];
  const ColIcon = col.Icon;
  const colMeta = ROADMAP_COLUMNS.find((c) => c.status === status)!;
  const items = ROADMAP_ITEMS.filter((item) => item.status === status);

  return (
    <section aria-label={colMeta.label} className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
        <ColIcon
          className={cn("w-4 h-4 shrink-0", col.iconClass)}
          strokeWidth={1.75}
          aria-hidden
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-semibold", col.labelClass)}>
              {colMeta.label}
            </span>
            {status === "in_progress" && (
              <span className="relative flex h-2 w-2" aria-label="em andamento">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500" />
              </span>
            )}
          </div>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: "var(--text-subtle)" }}
          >
            {colMeta.description}
          </p>
        </div>

        <span className="shrink-0 text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2.5">
        {items.map((item, index) => (
          <RoadmapCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

// ─── Tab bar (mobile) ─────────────────────────────────────────────────────────

const TAB_ORDER: RoadmapStatus[] = ["launched", "in_progress", "planned"];

const TAB_LABELS: Record<RoadmapStatus, string> = {
  launched: "Lançado",
  in_progress: "Em Dev",
  planned: "Planejado",
};

// ─── RoadmapView (main export) ────────────────────────────────────────────────

export function RoadmapView() {
  const [activeTab, setActiveTab] = useState<RoadmapStatus>("launched");

  return (
    <div className="force-light min-h-screen bg-background font-sans">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors rounded-sm"
            aria-label="Voltar para o início"
          >
            <Image
              src="/favicon.svg"
              alt=""
              width={22}
              height={22}
              className="shrink-0"
            />
            <span
              className="text-lg tracking-tight hidden sm:block"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Koinos
            </span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors rounded-sm"
            >
              Entrar
            </Link>
            <Link
              href="/signup/igreja"
              className="rounded-xl bg-primary text-primary-foreground px-3.5 py-1.5 text-sm font-medium hover:brightness-90 transition-all"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="px-6 pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-xl"
        >
          <p className="text-xs font-semibold tracking-[0.14em] uppercase mb-4 text-accent-500">
            Roadmap público
          </p>
          <h1
            className="text-4xl sm:text-[2.75rem] leading-tight tracking-tight mb-5 text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
            }}
          >
            O que estamos
            <br className="hidden sm:block" /> construindo juntos
          </h1>
          <p
            className="text-base leading-relaxed max-w-[52ch] mx-auto"
            style={{ color: "var(--text-body)" }}
          >
            Acompanhe o que já entregamos, o que está em desenvolvimento e o que
            planejamos para o futuro do Koinos.
          </p>
        </motion.div>
      </section>

      {/* ── Mobile tabs (sticky below nav) ── */}
      <div className="lg:hidden sticky top-14 z-10 bg-background border-b border-border">
        <div
          className="flex overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
          role="tablist"
          aria-label="Status do roadmap"
        >
          {TAB_ORDER.map((status) => {
            const count = ROADMAP_ITEMS.filter(
              (i) => i.status === status
            ).length;
            const isActive = activeTab === status;

            return (
              <button
                key={status}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${status}`}
                onClick={() => setActiveTab(status)}
                className={cn(
                  "flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap",
                  "border-b-2 transition-colors duration-150 focus-visible:outline-none",
                  isActive
                    ? "border-accent-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {TAB_LABELS[status]}
                <span
                  className={cn(
                    "text-[11px] rounded-full px-1.5 py-0.5 font-medium",
                    isActive
                      ? "bg-accent-100 text-accent-700"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Kanban ── */}
      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 sm:px-6 py-10 pb-24"
      >
        {/* Desktop: 3-col grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
          {TAB_ORDER.map((status) => (
            <RoadmapColumn key={status} status={status} />
          ))}
        </div>

        {/* Mobile: animated single column */}
        <div className="lg:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-label={TAB_LABELS[activeTab]}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <RoadmapColumn status={activeTab} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
            Tem uma sugestão?{" "}
            <Link
              href="/feedback"
              className="text-primary hover:text-primary-600 transition-colors font-medium"
            >
              Envie seu feedback
              <ExternalLink
                className="inline-block ml-1 w-3 h-3"
                aria-hidden="true"
              />
            </Link>
          </p>
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--text-subtle)" }}
          >
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-foreground transition-colors rounded-sm"
            >
              <ArrowLeft className="w-3 h-3" aria-hidden />
              Voltar para o início
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
