"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Banknote,
  BookOpen,
  Flame,
  Clock,
  GripVertical,
  Music,
  Mic,
  Book,
} from "lucide-react";
import { KoinosLogo } from "@/components/ui/koinos-logo";

// ─── Tab Config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "membros", label: "Membros", icon: Users },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "financeiro", label: "Financeiro", icon: Banknote },
  { id: "liturgia", label: "Liturgia", icon: BookOpen },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Mini Screen Components ───────────────────────────────────────────────────

function DashboardScreen() {
  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-hidden">
      {/* Welcome */}
      <div>
        <p className="text-[10px] text-slate-400 font-medium">Bom dia,</p>
        <p className="text-sm font-semibold text-slate-700 leading-tight">
          Pr. Carlos Silva
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="rounded-xl p-2.5"
          style={{ background: "oklch(0.32 0.096 224)" }}
        >
          <p
            className="text-[9px] font-medium uppercase tracking-wide mb-1"
            style={{ color: "oklch(0.78 0.052 224)" }}
          >
            Membros ativos
          </p>
          <p className="text-xl font-bold text-white leading-none">247</p>
        </div>
        <div className="rounded-xl p-2.5 bg-white border border-slate-100">
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400 mb-1">
            Próx. evento
          </p>
          <p className="text-[11px] font-semibold text-slate-700 leading-tight">
            Culto de Domingo
          </p>
          <p className="text-[9px] text-slate-400">Amanhã, 10h</p>
        </div>
      </div>

      {/* Reading widget */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-amber-600/70 mb-1">
          Leitura do dia
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-700">Salmos</p>
            <p className="text-[10px] text-slate-500">Capítulo 23</p>
          </div>
          <div className="flex items-center gap-1 bg-amber-500 text-white rounded-lg px-2 py-1">
            <Flame className="w-3 h-3" />
            <span className="text-[9px] font-bold">14 dias</span>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
          Próximos eventos
        </p>
        {[
          { title: "Culto de Domingo", date: "Dom, 10h" },
          { title: "Reunião de Líderes", date: "Ter, 19h30" },
          { title: "Grupo de Louvor", date: "Qua, 18h" },
        ].map((ev) => (
          <div
            key={ev.title}
            className="flex items-center gap-2 text-[10px] p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: "oklch(0.32 0.096 224)" }}
            />
            <span className="text-slate-600 font-medium flex-1 truncate">
              {ev.title}
            </span>
            <span className="text-slate-400 shrink-0">{ev.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MembrosScreen() {
  const members = [
    {
      name: "Ana Lima",
      role: "Líder",
      tribe: "Judá",
      tribeColor: "#7c3aed",
      initials: "AL",
    },
    {
      name: "Marcos Souza",
      role: "Membro",
      tribe: "Rubem",
      tribeColor: "#0891b2",
      initials: "MS",
    },
    {
      name: "Carla Dias",
      role: "Diáconisa",
      tribe: "Efraim",
      tribeColor: "#059669",
      initials: "CD",
    },
    {
      name: "Pedro Alves",
      role: "Presbítero",
      tribe: "Dan",
      tribeColor: "#d97706",
      initials: "PA",
    },
    {
      name: "Julia Costa",
      role: "Membro",
      tribe: "Manassés",
      tribeColor: "#dc2626",
      initials: "JC",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
          <Users className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] text-slate-400">Buscar por nome...</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-hidden">
        {members.map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ background: m.tribeColor + "cc" }}
            >
              {m.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-700 truncate">
                {m.name}
              </p>
              <p className="text-[9px] text-slate-400">{m.role}</p>
            </div>
            <span
              className="text-[8px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                background: m.tribeColor + "1a",
                color: m.tribeColor,
                border: `1px solid ${m.tribeColor}40`,
              }}
            >
              {m.tribe}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/60">
        <p className="text-[9px] text-slate-400 text-center">
          247 membros ativos
        </p>
      </div>
    </div>
  );
}

function AgendaScreen() {
  const days = ["D", "S", "T", "Q", "Q", "S", "S"];
  const today = 7;
  const events = [
    {
      title: "Culto de Domingo",
      time: "10h00",
      type: "culto",
      color: "oklch(0.32 0.096 224)",
    },
    {
      title: "Reunião de Líderes",
      time: "19h30",
      type: "reunião",
      color: "oklch(0.62 0.148 58)",
    },
    {
      title: "Grupo de Louvor",
      time: "18h00",
      type: "louvor",
      color: "oklch(0.55 0.118 148)",
    },
  ];

  return (
    <div className="flex flex-col gap-2.5 p-3 h-full overflow-hidden">
      {/* Calendar mini */}
      <div className="rounded-xl border border-slate-100 bg-white p-2.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-slate-700">Maio 2026</p>
          <div className="flex gap-1">
            <button className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:bg-slate-50 text-[10px]">
              ‹
            </button>
            <button className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:bg-slate-50 text-[10px]">
              ›
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((d, i) => (
            <div
              key={`${d}-${i}`}
              className="text-[8px] font-medium text-slate-400 text-center py-0.5"
            >
              {d}
            </div>
          ))}
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <div
              key={d}
              className={`text-[9px] text-center py-0.5 rounded cursor-pointer transition-colors ${
                d === today
                  ? "text-white font-bold"
                  : d === 11 || d === 14 || d === 18
                    ? "text-slate-700 font-medium"
                    : "text-slate-400"
              }`}
              style={
                d === today
                  ? { background: "oklch(0.32 0.096 224)" }
                  : d === 11 || d === 14 || d === 18
                    ? { background: "oklch(0.32 0.096 224 / 0.12)" }
                    : {}
              }
            >
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* Events */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
          Próximos
        </p>
        {events.map((ev) => (
          <div
            key={ev.title}
            className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-white"
          >
            <div
              className="w-1 h-7 rounded-full shrink-0"
              style={{ background: ev.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-slate-700 truncate">
                {ev.title}
              </p>
              <p className="text-[9px] text-slate-400">{ev.time}</p>
            </div>
            <Clock className="w-3 h-3 text-slate-300 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FinanceiroScreen() {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const income = [8200, 9100, 7800, 10200, 9600, 11300];
  const expense = [6100, 7200, 5900, 8100, 7400, 8900];
  const maxVal = Math.max(...income, ...expense);

  return (
    <div className="flex flex-col gap-2.5 p-3 h-full overflow-hidden">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-1.5">
        <div
          className="rounded-xl p-2 text-center"
          style={{ background: "oklch(0.32 0.096 224)" }}
        >
          <p
            className="text-[8px] font-medium uppercase tracking-wide mb-0.5"
            style={{ color: "oklch(0.78 0.052 224)" }}
          >
            Saldo
          </p>
          <p className="text-xs font-bold text-white">R$ 24k</p>
        </div>
        <div className="rounded-xl p-2 text-center bg-emerald-50 border border-emerald-100">
          <p className="text-[8px] font-medium uppercase tracking-wide text-emerald-500 mb-0.5">
            Receitas
          </p>
          <p className="text-xs font-bold text-emerald-700">R$ 11k</p>
        </div>
        <div className="rounded-xl p-2 text-center bg-red-50 border border-red-100">
          <p className="text-[8px] font-medium uppercase tracking-wide text-red-400 mb-0.5">
            Despesas
          </p>
          <p className="text-xs font-bold text-red-600">R$ 8,9k</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex-1 rounded-xl border border-slate-100 bg-white p-2.5">
        <p className="text-[9px] font-semibold text-slate-500 mb-2.5">
          Receitas vs Despesas (2026)
        </p>
        <div className="flex items-end gap-1 h-20">
          {months.map((m, i) => (
            <div key={m} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex gap-0.5 items-end">
                <div
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    height: `${(income[i] / maxVal) * 64}px`,
                    background: "oklch(0.32 0.096 224 / 0.7)",
                  }}
                />
                <div
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    height: `${(expense[i] / maxVal) * 64}px`,
                    background: "oklch(0.62 0.148 58 / 0.6)",
                  }}
                />
              </div>
              <span className="text-[7px] text-slate-400">{m}</span>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ background: "oklch(0.32 0.096 224 / 0.7)" }}
            />
            <span className="text-[8px] text-slate-500">Receitas</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ background: "oklch(0.62 0.148 58 / 0.6)" }}
            />
            <span className="text-[8px] text-slate-500">Despesas</span>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="flex flex-col gap-1">
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
          Últimas transações
        </p>
        {[
          { desc: "Dízimo - Culto Dom.", val: "+R$ 3.240", type: "income" },
          { desc: "Água e Luz", val: "-R$ 420", type: "expense" },
        ].map((t) => (
          <div
            key={t.desc}
            className="flex items-center justify-between text-[10px] py-1 border-b border-slate-50"
          >
            <span className="text-slate-600 truncate">{t.desc}</span>
            <span
              className={`font-semibold shrink-0 ml-2 ${t.type === "income" ? "text-emerald-600" : "text-red-500"}`}
            >
              {t.val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiturgiaScreen() {
  const items = [
    {
      type: "music",
      label: "Louvor de Abertura",
      detail: "3 músicas",
      icon: Music,
    },
    {
      type: "prayer",
      label: "Oração de Abertura",
      detail: "Pr. Carlos",
      icon: Mic,
    },
    {
      type: "reading",
      label: "Leitura Bíblica",
      detail: "Romanos 8:28",
      icon: Book,
    },
    { type: "sermon", label: "Sermão", detail: "Fé que transforma", icon: Mic },
    {
      type: "music",
      label: "Cântico de Encerramento",
      detail: "1 música",
      icon: Music,
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-100">
        <p className="text-[10px] text-slate-400 font-medium">Liturgia</p>
        <p className="text-sm font-semibold text-slate-700">Culto de Domingo</p>
        <p className="text-[10px] text-slate-400">11 de Mai · 10h00</p>
      </div>

      {/* Drag list */}
      <div className="flex-1 overflow-hidden p-2 flex flex-col gap-1.5">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-100 group"
            >
              <GripVertical className="w-3 h-3 text-slate-300 cursor-grab shrink-0" />
              <span className="text-[9px] font-mono font-semibold text-slate-300 tabular-nums w-3 shrink-0">
                {i + 1}
              </span>
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={{ background: "oklch(0.32 0.096 224 / 0.1)" }}
              >
                <Icon
                  className="w-3 h-3"
                  style={{ color: "oklch(0.32 0.096 224)" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-slate-700 truncate">
                  {item.label}
                </p>
                <p className="text-[8px] text-slate-400">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI hint */}
      <div
        className="m-2 mt-0 rounded-lg p-2 text-[9px] font-medium"
        style={{
          background: "oklch(0.62 0.148 58 / 0.08)",
          color: "oklch(0.44 0.118 50)",
          border: "1px solid oklch(0.62 0.148 58 / 0.2)",
        }}
      >
        ✦ IA sugeriu 2 cânticos para o tema desta semana
      </div>
    </div>
  );
}

const SCREEN_MAP: Record<TabId, React.FC> = {
  dashboard: DashboardScreen,
  membros: MembrosScreen,
  agenda: AgendaScreen,
  financeiro: FinanceiroScreen,
  liturgia: LiturgiaScreen,
};

// ─── LandingPreview ───────────────────────────────────────────────────────────

const tabIds = TABS.map((t) => t.id);

export function AppPreview() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function startAutoAdvance() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setActiveTab((current) => {
          const idx = tabIds.indexOf(current);
          return tabIds[(idx + 1) % tabIds.length];
        });
      }, 4000);
    }

    if (!isPaused) {
      startAutoAdvance();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  function handleTabClick(id: TabId) {
    setActiveTab(id);
    setIsPaused(true);
    // Resume auto-advance after 8s of inactivity
    setTimeout(() => setIsPaused(false), 8000);
  }

  const ActiveScreen = SCREEN_MAP[activeTab];

  return (
    <div
      className="relative w-full max-w-105 mx-auto select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Glow backdrop */}
      <div
        className="absolute -inset-4 rounded-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.32 0.096 224 / 0.12) 0%, transparent 70%)",
        }}
      />

      {/* Browser chrome */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-[0_24px_64px_oklch(0.32_0.096_224/0.18),0_4px_16px_oklch(0.32_0.096_224/0.10)]"
        style={{
          border: "1px solid oklch(0.88 0.01 220 / 0.6)",
          background: "oklch(0.97 0.004 78)",
        }}
      >
        {/* Chrome top bar */}
        <div
          className="flex items-center gap-3 px-4 py-2.5 border-b"
          style={{
            borderColor: "oklch(0.88 0.01 220 / 0.5)",
            background: "oklch(0.985 0.003 75)",
          }}
        >
          {/* Traffic lights */}
          <div className="flex gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>
          {/* URL bar */}
          <div
            className="flex-1 flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px]"
            style={{
              background: "oklch(0.96 0.004 75)",
              border: "1px solid oklch(0.88 0.01 220 / 0.4)",
              color: "oklch(0.52 0.016 220)",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "oklch(0.55 0.118 148)" }}
            />
            koinos.digital
          </div>
        </div>

        {/* App shell */}
        <div className="flex" style={{ height: 360 }}>
          {/* Sidebar */}
          <div
            className="flex flex-col py-3 gap-0.5 shrink-0"
            style={{
              width: 120,
              background: "oklch(0.978 0.004 78)",
              borderRight: "1px solid oklch(0.88 0.01 220 / 0.4)",
            }}
          >
            {/* Logo */}
            <div
              className="flex items-center px-3 mb-3"
              style={{ color: "oklch(0.62 0.148 58)" }}
            >
              <KoinosLogo size={22} />
            </div>

            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className="flex items-center gap-2 mx-2 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all text-left"
                  style={
                    isActive
                      ? {
                          background: "oklch(0.32 0.096 224 / 0.1)",
                          color: "oklch(0.32 0.096 224)",
                        }
                      : {
                          color: "oklch(0.52 0.016 220)",
                        }
                  }
                >
                  <Icon
                    className="w-3.5 h-3.5 shrink-0"
                    style={isActive ? { color: "oklch(0.32 0.096 224)" } : {}}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Main content */}
          <div
            className="flex-1 overflow-hidden relative"
            style={{ background: "oklch(0.982 0.004 80)" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 overflow-hidden"
              >
                <ActiveScreen />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="h-0.5 relative overflow-hidden"
          style={{ background: "oklch(0.88 0.01 220 / 0.3)" }}
        >
          {!isPaused && (
            <motion.div
              key={activeTab + "-progress"}
              className="absolute inset-y-0 left-0 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 4, ease: "linear" }}
              style={{ background: "oklch(0.32 0.096 224)" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
