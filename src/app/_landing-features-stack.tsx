"use client";

import {
  Users,
  CalendarDays,
  MessageSquare,
  Banknote,
  Trophy,
  BookOpen,
  Flame,
  Clock,
  GripVertical,
  Music,
  Mic,
  Book,
  CheckCircle2,
  Heart,
  HandMetal,
  Search,
} from "lucide-react";

// ─── Mini UI screens per module ───────────────────────────────────────────────

function MembrosUI() {
  const members = [
    {
      name: "Ana Lima",
      role: "Líder",
      tribe: "Judá",
      color: "#7c3aed",
      initials: "AL",
      active: true,
    },
    {
      name: "Marcos Souza",
      role: "Membro",
      tribe: "Rubem",
      color: "#0891b2",
      initials: "MS",
      active: true,
    },
    {
      name: "Carla Dias",
      role: "Diáconisa",
      tribe: "Efraim",
      color: "#059669",
      initials: "CD",
      active: true,
    },
    {
      name: "Pedro Alves",
      role: "Presbítero",
      tribe: "Dan",
      color: "#d97706",
      initials: "PA",
      active: false,
    },
    {
      name: "Julia Costa",
      role: "Membro",
      tribe: "Manassés",
      color: "#dc2626",
      initials: "JC",
      active: true,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white/5 rounded-2xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-white/80">Membros</span>
        <span className="text-[10px] text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
          247 ativos
        </span>
      </div>
      {/* Search bar */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2 bg-white/8 rounded-lg px-2.5 py-1.5 border border-white/10">
          <Search className="w-3 h-3 text-white/30" />
          <span className="text-[10px] text-white/30">Buscar por nome...</span>
        </div>
      </div>
      {/* List */}
      <div className="flex-1 overflow-hidden divide-y divide-white/5">
        {members.map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ background: m.color + "cc" }}
            >
              {m.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white/90 truncate">
                {m.name}
              </p>
              <p className="text-[9px] text-white/40">{m.role}</p>
            </div>
            <span
              className="text-[8px] font-medium px-1.5 py-0.5 rounded-full shrink-0 border"
              style={{
                background: m.color + "22",
                color: m.color,
                borderColor: m.color + "44",
              }}
            >
              {m.tribe}
            </span>
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.active ? "bg-emerald-400" : "bg-white/20"}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AgendaUI() {
  const events = [
    {
      title: "Culto de Domingo",
      time: "10h00",
      min: "Louvor + Preg.",
      dot: "oklch(0.64 0.102 232)",
    },
    {
      title: "Reunião de Líderes",
      time: "Ter · 19h30",
      min: "Sala de reuniões",
      dot: "oklch(0.62 0.148 58)",
    },
    {
      title: "Grupo de Louvor",
      time: "Qua · 18h00",
      min: "Auditório principal",
      dot: "oklch(0.55 0.118 148)",
    },
    {
      title: "Estudo Bíblico",
      time: "Qui · 20h00",
      min: "Sala 02",
      dot: "oklch(0.52 0.118 228)",
    },
  ];
  const days = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Mini calendar */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-white/80">
            Maio 2026
          </span>
          <div className="flex gap-1">
            <span className="text-[10px] text-white/30 cursor-pointer hover:text-white/60 px-1">
              ‹
            </span>
            <span className="text-[10px] text-white/30 cursor-pointer hover:text-white/60 px-1">
              ›
            </span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {days.map((d, i) => (
            <div
              key={i}
              className="text-[8px] font-medium text-white/30 text-center py-0.5"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <div
              key={d}
              className="text-[9px] text-center py-0.5 rounded cursor-pointer transition-colors"
              style={
                d === 7
                  ? {
                      background: "oklch(0.64 0.102 232)",
                      color: "white",
                      fontWeight: 700,
                    }
                  : d === 11 || d === 13 || d === 18 || d === 20
                    ? {
                        background: "oklch(1 0 0 / 0.12)",
                        color: "oklch(1 0 0 / 0.85)",
                      }
                    : { color: "oklch(1 0 0 / 0.3)" }
              }
            >
              {d}
            </div>
          ))}
        </div>
      </div>
      {/* Event list */}
      <div className="flex flex-col gap-1.5">
        {events.map((ev) => (
          <div
            key={ev.title}
            className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2 border border-white/10"
          >
            <div
              className="w-1 h-8 rounded-full shrink-0"
              style={{ background: ev.dot }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-white/90 truncate">
                {ev.title}
              </p>
              <p className="text-[9px] text-white/40">
                {ev.time} · {ev.min}
              </p>
            </div>
            <Clock className="w-3 h-3 text-white/20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MuralUI() {
  const posts = [
    {
      initials: "AL",
      color: "#7c3aed",
      name: "Ana Lima",
      tribe: "Judá",
      tribeColor: "#7c3aed",
      time: "há 2h",
      text: "Que culto abençoado hoje! Deus esteve presente de forma especial. Gratidão!",
      orars: 14,
      gratas: 8,
    },
    {
      initials: "MS",
      color: "#0891b2",
      name: "Marcos Souza",
      tribe: "Rubem",
      tribeColor: "#0891b2",
      time: "há 5h",
      text: "Pedido de oração para a família Silva. Passando por um momento difícil.",
      orars: 31,
      gratas: 2,
    },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Streak banner */}
      <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-400/25 rounded-xl px-3 py-2">
        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-[10px] font-semibold text-amber-300">
          Sua tribo Judá está em 1º lugar!
        </span>
      </div>
      {/* Posts */}
      {posts.map((p) => (
        <div
          key={p.name}
          className="bg-white/5 rounded-2xl border border-white/10 p-3 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
              style={{ background: p.color + "cc" }}
            >
              {p.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-white/90 truncate">
                {p.name}
              </p>
              <p className="text-[8px] text-white/30">{p.time}</p>
            </div>
            <span
              className="text-[8px] font-medium px-1.5 py-0.5 rounded-full border shrink-0"
              style={{
                background: p.tribeColor + "22",
                color: p.tribeColor,
                borderColor: p.tribeColor + "44",
              }}
            >
              {p.tribe}
            </span>
          </div>
          <p className="text-[10px] text-white/65 leading-relaxed">{p.text}</p>
          <div className="flex items-center gap-3 pt-1 border-t border-white/8">
            <button className="flex items-center gap-1 text-[9px] text-white/40 hover:text-rose-400 transition-colors">
              <HandMetal className="w-3 h-3" />
              <span>{p.orars} Orar</span>
            </button>
            <button className="flex items-center gap-1 text-[9px] text-white/40 hover:text-amber-400 transition-colors">
              <Heart className="w-3 h-3" />
              <span>{p.gratas} Gratidão</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function FinanceiroUI() {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const income = [8200, 9100, 7800, 10200, 9600, 11300];
  const expense = [6100, 7200, 5900, 8100, 7400, 8900];
  const maxVal = Math.max(...income, ...expense);

  const txs = [
    { desc: "Dízimo — Culto Dom.", val: "+R$ 3.240", type: "in" },
    { desc: "Água e Luz", val: "-R$ 420", type: "out" },
    { desc: "Oferta Especial", val: "+R$ 1.180", type: "in" },
    { desc: "Material de louvor", val: "-R$ 285", type: "out" },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2">
        <div
          className="rounded-xl p-2.5 text-center"
          style={{
            background: "oklch(0.32 0.096 224 / 0.5)",
            border: "1px solid oklch(0.64 0.102 232 / 0.25)",
          }}
        >
          <p
            className="text-[8px] font-medium uppercase tracking-wide mb-0.5"
            style={{ color: "oklch(0.78 0.052 224)" }}
          >
            Saldo
          </p>
          <p className="text-[13px] font-bold text-white">R$ 24k</p>
        </div>
        <div className="rounded-xl p-2.5 text-center bg-emerald-500/15 border border-emerald-400/20">
          <p className="text-[8px] font-medium uppercase tracking-wide text-emerald-400 mb-0.5">
            Receitas
          </p>
          <p className="text-[13px] font-bold text-emerald-300">R$ 11k</p>
        </div>
        <div className="rounded-xl p-2.5 text-center bg-red-500/15 border border-red-400/20">
          <p className="text-[8px] font-medium uppercase tracking-wide text-red-400 mb-0.5">
            Despesas
          </p>
          <p className="text-[13px] font-bold text-red-300">R$ 8,9k</p>
        </div>
      </div>
      {/* Bar chart */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-3">
        <p className="text-[9px] font-semibold text-white/40 mb-2.5">
          Receitas vs Despesas (2026)
        </p>
        <div className="flex items-end gap-1.5 h-16">
          {months.map((m, i) => (
            <div key={m} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex gap-0.5 items-end">
                <div
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: `${(income[i] / maxVal) * 52}px`,
                    background: "oklch(0.64 0.102 232 / 0.7)",
                  }}
                />
                <div
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: `${(expense[i] / maxVal) * 52}px`,
                    background: "oklch(0.62 0.148 58 / 0.6)",
                  }}
                />
              </div>
              <span className="text-[7px] text-white/25">{m}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Transactions */}
      <div className="flex flex-col divide-y divide-white/6">
        {txs.map((t) => (
          <div
            key={t.desc}
            className="flex items-center justify-between py-1.5 text-[10px]"
          >
            <span className="text-white/55 truncate">{t.desc}</span>
            <span
              className={`font-semibold shrink-0 ml-2 ${t.type === "in" ? "text-emerald-400" : "text-red-400"}`}
            >
              {t.val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssembleiaUI() {
  const candidates = [
    { name: "Pr. Carlos Silva", votes: 68, pct: 68 },
    { name: "Pr. Roberto Melo", votes: 21, pct: 21 },
    { name: "Pr. José Andrade", votes: 11, pct: 11 },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Assembly header */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-3">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/30 mb-0.5">
              Assembleia
            </p>
            <p className="text-[12px] font-semibold text-white/90">
              Eleição Pastoral 2026
            </p>
          </div>
          <span className="text-[8px] font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/20">
            Em andamento
          </span>
        </div>
        <p className="text-[9px] text-white/40">
          100 votos registrados · Votação anônima (SHA-256)
        </p>
      </div>
      {/* Results */}
      <div className="flex flex-col gap-2">
        <p className="text-[9px] font-semibold text-white/40 uppercase tracking-wide">
          Apuração em tempo real
        </p>
        {candidates.map((c, i) => (
          <div
            key={c.name}
            className="bg-white/5 rounded-xl border border-white/8 p-2.5"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-white/80 truncate">
                {c.name}
              </span>
              <span className="text-[10px] font-bold text-white/90 ml-2 shrink-0">
                {c.pct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${c.pct}%`,
                  background:
                    i === 0 ? "oklch(0.64 0.102 232)" : "oklch(1 0 0 / 0.25)",
                }}
              />
            </div>
            <p className="text-[8px] text-white/30 mt-1">{c.votes} votos</p>
          </div>
        ))}
      </div>
      {/* Security note */}
      <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/8 px-3 py-2">
        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
        <span className="text-[9px] text-white/45">
          Votação verificada e anônima · OTP por e-mail
        </span>
      </div>
    </div>
  );
}

function LiturgiaUI() {
  const items = [
    { label: "Louvor de Abertura", detail: "3 músicas", icon: Music },
    { label: "Oração de Abertura", detail: "Pr. Carlos", icon: Mic },
    { label: "Leitura Bíblica", detail: "Romanos 8:28", icon: Book },
    { label: "Sermão", detail: "Fé que transforma", icon: Mic },
    { label: "Cântico de Encerramento", detail: "1 música", icon: Music },
  ];

  return (
    <div className="flex flex-col h-full gap-2.5">
      {/* Header */}
      <div className="bg-white/5 rounded-2xl border border-white/10 px-3 py-2.5">
        <p className="text-[9px] text-white/35 font-medium mb-0.5">
          Liturgia do Culto
        </p>
        <p className="text-[12px] font-semibold text-white/90">
          Culto de Domingo
        </p>
        <p className="text-[9px] text-white/35">11 de Mai · 10h00</p>
      </div>
      {/* Drag list */}
      <div className="flex flex-col gap-1.5 flex-1">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/8 group"
            >
              <GripVertical className="w-3 h-3 text-white/20 cursor-grab shrink-0" />
              <span className="text-[9px] font-mono font-semibold text-white/20 tabular-nums w-3 shrink-0">
                {i + 1}
              </span>
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-white/10">
                <Icon className="w-3 h-3 text-white/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-white/85 truncate">
                  {item.label}
                </p>
                <p className="text-[8px] text-white/35">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
      {/* AI hint */}
      <div
        className="rounded-xl px-3 py-2 text-[9px] font-medium"
        style={{
          background: "oklch(0.62 0.148 58 / 0.12)",
          color: "oklch(0.80 0.12 62)",
          border: "1px solid oklch(0.62 0.148 58 / 0.2)",
        }}
      >
        ✦ IA sugeriu 2 cânticos para o tema desta semana
      </div>
    </div>
  );
}

// ─── Feature config ───────────────────────────────────────────────────────────

const features = [
  {
    icon: Users,
    title: "Membros & Famílias",
    description:
      "Cadastro completo com CPF criptografado, vínculos familiares, papéis por hierarquia e portal de privacidade LGPD integrado.",
    detail:
      "Gerencie toda a sua congregação em um só lugar, com segurança e conformidade.",
    bg: "oklch(0.26 0.082 226)",
    Screen: MembrosUI,
  },
  {
    icon: CalendarDays,
    title: "Agenda & Eventos",
    description:
      "Calendário mensal e semanal, eventos recorrentes, ministérios, escalas automáticas e liturgia editável com arrastar e soltar.",
    detail:
      "Nunca mais perca um compromisso. Toda a agenda da sua igreja sincronizada.",
    bg: "oklch(0.24 0.072 220)",
    Screen: AgendaUI,
  },
  {
    icon: MessageSquare,
    title: "Mural & Engajamento",
    description:
      'Feed de posts com reações "Orar" e "Gratidão", gamificação com as 12 Tribos de Israel, streaks de devoção e QR code de check-in.',
    detail:
      "Aproxime sua comunidade com ferramentas pensadas para a cultura da sua igreja.",
    bg: "oklch(0.26 0.086 228)",
    Screen: MuralUI,
  },
  {
    icon: Banknote,
    title: "Financeiro",
    description:
      "Controle de contas e transações imutáveis com comprovantes, relatórios gráficos, suporte a múltiplas congregações e exportação PDF.",
    detail:
      "Transparência total para a liderança. Relatórios prontos para prestação de contas.",
    bg: "oklch(0.22 0.068 222)",
    Screen: FinanceiroUI,
  },
  {
    icon: Trophy,
    title: "Assembleia & Votação",
    description:
      "Gestão de assembleias com eleições anônimas (SHA-256), votação presencial e remota com OTP por e-mail e apuração em tempo real.",
    detail:
      "Processos democráticos com segurança e credibilidade para toda a congregação.",
    bg: "oklch(0.24 0.078 224)",
    Screen: AssembleiaUI,
  },
  {
    icon: BookOpen,
    title: "Liturgia Inteligente",
    description:
      "Estruture cultos com itens arrastáveis. Com o add-on premium, a IA sugere leituras e cânticos do repertório baseados no objetivo do culto.",
    detail:
      "Do planejamento à execução. Cada culto com a qualidade que a sua congregação merece.",
    bg: "oklch(0.26 0.082 226)",
    Screen: LiturgiaUI,
  },
] as const;

// ─── Feature card ─────────────────────────────────────────────────────────────

interface FeatureCardProps {
  feature: (typeof features)[number];
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const Icon = feature.icon;
  const { Screen } = feature;
  const stickyTop = 80 + index * 20;

  return (
    <div className="sticky" style={{ top: stickyTop }}>
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{ background: feature.bg }}
      >
        {/* Subtle noise texture via radial gradients */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 10% 0%, oklch(1 0 0 / 0.04) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 90% 100%, oklch(0.32 0.096 224 / 0.3) 0%, transparent 60%)",
          }}
        />

        <div className="relative grid lg:grid-cols-2 min-h-125 lg:min-h-140">
          {/* Left: live UI preview */}
          <div className="relative flex items-center justify-center p-8 lg:p-10 order-2 lg:order-1">
            {/* Watermark number */}
            <span
              className="absolute bottom-4 left-6 font-mono text-[96px] font-bold leading-none select-none pointer-events-none"
              style={{ color: "oklch(1 0 0 / 0.04)", letterSpacing: "-0.04em" }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>

            {/* UI screen container */}
            <div className="relative w-full max-w-xs">
              {/* Glow behind card */}
              <div
                className="absolute -inset-4 rounded-3xl blur-2xl opacity-30 pointer-events-none"
                style={{ background: "oklch(0.64 0.102 232 / 0.4)" }}
              />
              <div
                className="relative rounded-2xl overflow-hidden p-3"
                style={{
                  background: "oklch(0.20 0.060 224 / 0.8)",
                  border: "1px solid oklch(1 0 0 / 0.08)",
                  backdropFilter: "blur(12px)",
                  maxHeight: 400,
                }}
              >
                <Screen />
              </div>
            </div>
          </div>

          {/* Right: copy */}
          <div className="flex flex-col justify-center px-8 py-12 lg:px-12 order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "oklch(1 0 0 / 0.10)" }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: "oklch(1 0 0 / 0.85)" }}
                  strokeWidth={1.75}
                />
              </div>
              <span
                className="text-xs font-semibold tracking-[0.15em] uppercase"
                style={{ color: "oklch(1 0 0 / 0.40)" }}
              >
                Módulo {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <h3
              className="font-display text-3xl lg:text-4xl mb-4 leading-tight"
              style={{
                color: "oklch(0.97 0.006 220)",
                letterSpacing: "-0.02em",
              }}
            >
              {feature.title}
            </h3>

            <p
              className="text-base leading-relaxed mb-6"
              style={{ color: "oklch(1 0 0 / 0.60)" }}
            >
              {feature.description}
            </p>

            <p
              className="text-sm font-medium leading-relaxed pt-6 border-t"
              style={{
                color: "oklch(1 0 0 / 0.38)",
                borderColor: "oklch(1 0 0 / 0.10)",
              }}
            >
              {feature.detail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FeatureStackSection ──────────────────────────────────────────────────────

export function FeatureStackSection() {
  return (
    <section id="funcionalidades" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent-700 mb-3">
            Funcionalidades
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground leading-tight">
            Cada módulo,
            <br />
            <span className="text-primary">
              construído para igrejas brasileiras.
            </span>
          </h2>
          <p className="mt-4 text-base text-text-body max-w-lg mx-auto">
            Um sistema completo que cresce com a sua comunidade. Scroll para
            explorar.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
