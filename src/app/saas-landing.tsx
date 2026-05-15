import Link from "next/link";
import { Check, ChevronRight, Shield, Zap, Globe } from "lucide-react";
import { LandingNav } from "./_landing-nav";
import { LandingHero } from "./_landing-hero";
import { FeatureStackSection } from "./_landing-features-stack";
import { KoinosLogo } from "@/components/ui/koinos-logo";
import { Card, CardContent } from "@/components/ui/card";

// ─── Trust Signals ────────────────────────────────────────────────────────────

function TrustSignals() {
  const signals = [
    {
      icon: Shield,
      label: "Em conformidade com a LGPD",
      desc: "Consentimento, exportação e exclusão de dados",
    },
    {
      icon: Zap,
      label: "100% responsivo",
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
      <ul className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-center gap-5 sm:gap-16">
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
            Quatro planos.
            <br />
            <span className="text-primary">O gratuito já faz muita coisa.</span>
          </h2>
          <p className="mt-4 text-base text-text-body">
            Comece grátis. Faça upgrade quando precisar.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative rounded-2xl p-0 ${
                plan.highlight
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_32px_oklch(0.32_0.096_224/0.3)]"
                  : ""
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-primary-900 text-[10px] font-bold tracking-widest uppercase">
                  Mais escolhido
                </div>
              )}

              <CardContent className="flex flex-col p-6 h-full">
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
              </CardContent>
            </Card>
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
            O cadastro tem 3 passos. O plano Grátis já inclui membros, agenda,
            mural e gamificação.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup/igreja"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-accent text-primary-900 text-base font-semibold hover:bg-accent/90 transition-all hover:shadow-[0_8px_32px_oklch(0.62_0.148_58/0.5)] active:scale-[0.97]"
            >
              Cadastrar minha Igreja
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup/membro"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full border border-primary-400/40 text-primary-200 text-base font-medium hover:bg-primary-400/10 transition-colors"
            >
              Já sou membro
            </Link>
          </div>
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
        </Link>
        <div className="flex flex-wrap items-center gap-6 text-sm text-text-subtle">
          <Link
            href="/login"
            className="hover:text-primary transition-colors rounded-sm"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="hover:text-primary transition-colors rounded-sm"
          >
            Cadastrar
          </Link>
          <Link
            href="/roadmap"
            className="hover:text-primary transition-colors rounded-sm"
          >
            Roadmap
          </Link>
          <Link
            href="/termos"
            className="hover:text-primary transition-colors rounded-sm"
          >
            Termos de Uso
          </Link>
          <Link
            href="/privacidade"
            className="hover:text-primary transition-colors rounded-sm"
          >
            Privacidade
          </Link>
        </div>
        <p className="text-xs text-text-body">
          Versão Beta · © {new Date().getFullYear()} Koinos · Em conformidade
          com a LGPD
        </p>
      </div>
    </footer>
  );
}

// ─── SaasLanding (export) ─────────────────────────────────────────────────────

export function SaasLanding() {
  return (
    <div className="force-light min-h-screen bg-background font-sans">
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo
      </a>
      <LandingNav />
      <main id="main-content">
        <LandingHero />
        <TrustSignals />
        <FeatureStackSection />
        <Pricing />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
