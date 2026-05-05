"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, CheckCircle } from "lucide-react";

const TOUR_KEY = "koinos_tour_v1";

interface TourStep {
  title: string;
  description: string;
  targetSelector?: string;
  position: "top" | "bottom" | "left" | "right" | "center";
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Bem-vindo ao Koinos!",
    description:
      "Sua plataforma de gestão para igrejas está pronta. Vamos dar uma volta rápida pelas principais funcionalidades.",
    position: "center",
  },
  {
    title: "Menu de navegação",
    description:
      "No menu lateral você acessa todos os módulos: membros, eventos, financeiro, liturgia e muito mais.",
    targetSelector: "nav",
    position: "right",
  },
  {
    title: "Busca global",
    description:
      "Use Cmd+K (ou o ícone de lupa no celular) para buscar membros, eventos e músicas instantaneamente.",
    position: "center",
  },
  {
    title: "Comece pelos membros",
    description:
      "Cadastre os membros da sua igreja em Membros → Novo membro. Você pode importar dados a qualquer momento.",
    position: "center",
  },
  {
    title: "Crie um evento",
    description:
      "Em Eventos você agenda cultos, reuniões e retiros com recorrência automática, lista de ministérios e liturgia integrada.",
    position: "center",
  },
  {
    title: "Tudo pronto!",
    description:
      "Você já pode começar a usar o Koinos. Se precisar de ajuda, consulte as configurações da sua conta.",
    position: "center",
  },
];

interface OnboardingTourProps {
  userRole: string;
  /** Passa true se o membro foi criado há menos de 7 dias */
  isNew: boolean;
}

export function OnboardingTour({ userRole, isNew }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isNew) return;
    if (!["pastor", "admin"].includes(userRole)) return;

    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, [isNew, userRole]);

  function next() {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  function finish() {
    localStorage.setItem(TOUR_KEY, "done");
    setVisible(false);
  }

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
            onClick={finish}
            aria-hidden="true"
          />

          {/* Tooltip/card central */}
          <motion.div
            key={`step-${step}`}
            role="dialog"
            aria-label={`Tour passo ${step + 1} de ${TOUR_STEPS.length}`}
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,22rem)]"
          >
            <div
              className="rounded-2xl border border-border shadow-2xl overflow-hidden"
              style={{ background: "var(--surface-1)" }}
            >
              {/* Progress bar */}
              <div
                className="h-1 transition-all duration-300"
                style={{
                  background: "var(--muted)",
                  position: "relative",
                }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${((step + 1) / TOUR_STEPS.length) * 100}%`,
                    background: "var(--primary)",
                  }}
                />
              </div>

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {isLast ? (
                      <CheckCircle
                        className="size-4 shrink-0"
                        style={{ color: "var(--primary)" }}
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className="text-xs font-mono font-medium shrink-0"
                        style={{ color: "var(--muted-foreground)" }}
                        aria-hidden="true"
                      >
                        {step + 1}/{TOUR_STEPS.length}
                      </span>
                    )}
                    <h2
                      className="text-base font-semibold leading-snug"
                      style={{ color: "var(--foreground)" }}
                    >
                      {current.title}
                    </h2>
                  </div>
                  <button
                    onClick={finish}
                    className="shrink-0 rounded-full p-1 transition-colors hover:bg-muted"
                    aria-label="Fechar tour"
                  >
                    <X
                      className="size-3.5"
                      style={{ color: "var(--muted-foreground)" }}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <p
                  className="text-sm leading-relaxed mb-5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {current.description}
                </p>

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={finish}
                    className="text-xs transition-colors"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Pular tour
                  </button>
                  <button
                    onClick={next}
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                      background: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }}
                  >
                    {isLast ? "Começar" : "Próximo"}
                    {!isLast && (
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
