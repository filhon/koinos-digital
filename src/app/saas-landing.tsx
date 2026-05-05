import Link from "next/link";
import {
  Users,
  CalendarDays,
  MessageSquare,
  Banknote,
  Trophy,
  BookOpen,
  Check,
  ChevronRight,
  Shield,
  Zap,
  Globe,
} from "lucide-react";
import { LandingNav } from "./_landing-nav";
import { LandingHero } from "./_landing-hero";

// ─── Logo ────────────────────────────────────────────────────────────────────

function KoinosLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="20" cy="20" r="9" fill="currentColor" opacity="0.15" />
      <circle cx="20" cy="20" r="4" fill="currentColor" />
    </svg>
  );
}

// ─── Trust Signals ────────────────────────────────────────────────────────────

function TrustSignals() {
  const signals = [
    {
      icon: Shield,
      label: "LGPD Compliant",
      desc: "Consentimento, exportação e exclusão de dados",
    },
    {
      icon: Zap,
      label: "Mobile-first",
      desc: "100% responsivo, otimizado para celular",
    },
    {
      icon: Globe,
      label: "Multi-congregação",
      desc: "Matriz e filiais em gestão unificada",
    },
  ];

  return (
    <section
      aria-label="Diferenciais"
      className="py-10 px-6 border-y border-border"
    >
      <ul className="mx-auto max-w-3xl flex flex-col sm:flex-row items-start sm:items-center justify-center gap-5 sm:gap-12">
        {signals.map(({ icon: Icon, label, desc }) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            <Icon
              className="w-4 h-4 text-primary shrink-0"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>
              <strong className="font-semibold text-foreground">{label}</strong>
              <span className="text-text-body"> · {desc}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Users,
    title: "Membros & Famílias",
    description:
      "Cadastro completo com CPF criptografado, vínculos familiares, roles por hierarquia e portal de privacidade LGPD integrado.",
    color: "oklch(0.52 0.118 228)",
    bg: "oklch(0.93 0.028 238 / 0.4)",
  },
  {
    icon: CalendarDays,
    title: "Agenda & Eventos",
    description:
      "Calendário mensal e semanal, eventos recorrentes, ministérios, escalas automáticas e liturgia editável com drag-and-drop.",
    color: "oklch(0.55 0.118 148)",
    bg: "oklch(0.94 0.048 148 / 0.4)",
  },
  {
    icon: MessageSquare,
    title: "Mural & Engajamento",
    description:
      'Feed de posts com reações "Orar" e "Gratidão", gamificação com as 12 Tribos de Israel, streaks de devoção e QR code de check-in.',
    color: "oklch(0.62 0.148 58)",
    bg: "oklch(0.93 0.042 70 / 0.4)",
  },
  {
    icon: Banknote,
    title: "Financeiro",
    description:
      "Controle de contas e transações imutáveis com comprovantes, relatórios gráficos, suporte a múltiplas congregações e exportação PDF.",
    color: "oklch(0.55 0.148 28)",
    bg: "oklch(0.94 0.048 28 / 0.3)",
  },
  {
    icon: Trophy,
    title: "Assembleia & Votação",
    description:
      "Gestão de assembleias com eleições anônimas (SHA-256), votação presencial e remota com OTP por e-mail e apuração em tempo real.",
    color: "oklch(0.44 0.118 50)",
    bg: "oklch(0.87 0.078 68 / 0.3)",
  },
  {
    icon: BookOpen,
    title: "Liturgia Inteligente",
    description:
      "Estruture cultos com itens arrastáveis. Com o add-on premium, a IA sugere leituras e cânticos do repertório baseados no objetivo do culto.",
    color: "oklch(0.42 0.04 228)",
    bg: "oklch(0.93 0.028 238 / 0.35)",
  },
];

function Features() {
  return (
    <section id="funcionalidades" className="py-24 px-6 bg-card">
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
        </div>

        <ol className="divide-y divide-border">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <li
                key={feat.title}
                className="group grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3rem_1fr_auto] gap-4 sm:gap-6 py-7 items-center"
              >
                <span className="font-mono text-xs font-semibold text-text-body tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-xl text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-text-body leading-relaxed">
                    {feat.description}
                  </p>
                </div>
                <div
                  className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: feat.bg }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: feat.color }}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

const plans = [
  {
    name: "Grátis",
    price: "R$ 0",
    period: "/mês",
    members: "Até 100 membros",
    highlight: false,
    cta: "Começar agora",
    href: "/signup/igreja",
    features: [
      "Módulo de Membros",
      "Agenda e Eventos",
      "Mural de interação",
      "Gamificação básica (tribos + streaks)",
      "QR Code de check-in",
      "Portal LGPD",
    ],
  },
  {
    name: "Crescimento",
    price: "R$ 49",
    period: "/mês",
    members: "Até 300 membros",
    highlight: false,
    cta: "Escolher plano",
    href: "/signup/igreja",
    features: [
      "Tudo do Grátis",
      "Ministérios e Escalas",
      "Grupos Musicais e Repertório",
      "Recursos e patrimônio",
      "Landing page personalizada",
    ],
  },
  {
    name: "Igreja",
    price: "R$ 129",
    period: "/mês",
    members: "Até 1.000 membros",
    highlight: true,
    cta: "Escolher plano",
    href: "/signup/igreja",
    features: [
      "Tudo do Crescimento",
      "Financeiro (contas e transações)",
      "Assembleia e Votação Digital",
      "Relatórios financeiros avançados",
    ],
  },
  {
    name: "Catedral",
    price: "R$ 299",
    period: "/mês",
    members: "Membros ilimitados",
    highlight: false,
    cta: "Escolher plano",
    href: "/signup/igreja",
    features: [
      "Tudo do Igreja",
      "Múltiplas congregações",
      "Financeiro consolidado",
      "Suporte prioritário",
    ],
  },
];

function Pricing() {
  return (
    <section id="precos" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent-700 mb-3">
            Preços
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground leading-tight">
            Simples e transparente.
            <br />
            <span className="text-primary">Cresça no seu ritmo.</span>
          </h2>
          <p className="mt-4 text-base text-text-body">
            Comece grátis. Faça upgrade quando precisar.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_32px_oklch(0.32_0.096_224/0.3)]"
                  : "border-border bg-card text-foreground"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-primary-900 text-[10px] font-bold tracking-widest uppercase">
                  Popular
                </div>
              )}

              <div className="mb-5">
                <h3
                  className={`text-sm font-semibold mb-1 ${
                    plan.highlight ? "text-primary-200" : "text-text-subtle"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl leading-none">
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${
                      plan.highlight ? "text-primary-200" : "text-text-body"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`text-xs mt-1.5 ${
                    plan.highlight ? "text-primary-200" : "text-text-body"
                  }`}
                >
                  {plan.members}
                </p>
              </div>

              <ul className="flex-1 space-y-2.5 mb-6">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm">
                    <Check
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        plan.highlight ? "text-accent-400" : "text-primary"
                      }`}
                      strokeWidth={2.5}
                    />
                    <span
                      className={
                        plan.highlight ? "text-primary-100" : "text-text-body"
                      }
                    >
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  plan.highlight
                    ? "bg-background text-primary hover:bg-card"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {plan.cta}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center mt-10 text-sm text-text-body">
          Add-ons disponíveis: Liturgia com IA (R$ 29), Escala Automática por IA
          (R$ 19), Relatórios Avançados (R$ 39) e mais.
        </p>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section className="py-20 px-6">
      <div
        className="mx-auto max-w-4xl rounded-3xl overflow-hidden relative"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 30% 50%, oklch(0.4 0.112 226) 0%, oklch(0.24 0.076 222) 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, oklch(0.70 0.136 62) 0%, transparent 50%)",
          }}
        />
        <div className="relative px-8 py-16 sm:px-16 text-center">
          <h2 className="font-display text-4xl sm:text-5xl text-primary-foreground leading-tight mb-4">
            Comece hoje.
            <br />
            <span className="text-accent-300">É gratuito.</span>
          </h2>
          <p className="text-primary-300 text-lg mb-10 max-w-lg mx-auto">
            Cadastre sua igreja em minutos e comece a usar todos os módulos do
            plano Grátis imediatamente.
          </p>
          <Link
            href="/signup/igreja"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-accent text-primary-900 text-base font-semibold hover:bg-accent/90 transition-all hover:shadow-[0_8px_32px_oklch(0.62_0.148_58/0.5)] active:scale-[0.97]"
          >
            Criar minha conta grátis
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border py-10 px-6">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-primary rounded-sm"
        >
          <KoinosLogo size={22} />
          <span className="font-display text-lg">Koinos</span>
        </Link>
        <div className="flex flex-wrap items-center gap-6 text-sm text-text-subtle">
          <Link
            href="/login"
            className="hover:text-primary transition-colors rounded-sm"
          >
            Entrar
          </Link>
          <Link
            href="/signup/igreja"
            className="hover:text-primary transition-colors rounded-sm"
          >
            Cadastrar
          </Link>
        </div>
        <p className="text-xs text-text-body">
          © {new Date().getFullYear()} Koinos · LGPD Compliant
        </p>
      </div>
    </footer>
  );
}

// ─── SaasLanding (export) ─────────────────────────────────────────────────────

export function SaasLanding() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo
      </a>
      <LandingNav />
      <main id="main-content">
        <LandingHero />
        <TrustSignals />
        <Features />
        <Pricing />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
