"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import {
  markStepCompleted,
  completeOnboarding,
  type OnboardingProgressData,
  type OnboardingStepKey,
  type StepConditions,
} from "@/actions/onboarding-progress";

// ─── Step definitions ─────────────────────────────────────────────────────────

type SubStep = {
  label: string;
  /** Key in StepConditions that determines if this sub-step is done. */
  conditionKey: keyof StepConditions;
  /** For OR-logic steps: completing ANY sub-step marks the parent done. */
  anyOf?: boolean;
};

type StepDef = {
  key: OnboardingStepKey;
  title: string;
  href: string;
  subSteps: SubStep[];
};

const ALL_STEPS: StepDef[] = [
  {
    key: "complete_profile",
    title: "Completar perfil",
    href: "/perfil",
    subSteps: [
      { label: "Adicionar foto de perfil", conditionKey: "has_avatar" },
      { label: "Informar telefone de contato", conditionKey: "has_phone" },
    ],
  },
  {
    key: "create_first_event",
    title: "Criar o primeiro evento",
    href: "/eventos/novo",
    subSteps: [
      {
        label: "Criar qualquer culto, reunião ou retiro",
        conditionKey: "has_event",
      },
    ],
  },
  {
    key: "invite_members",
    title: "Convidar membros",
    href: "/configuracoes/convites",
    subSteps: [
      { label: "Gerar um link de convite", conditionKey: "has_invite_link" },
    ],
  },
  {
    key: "create_ministry",
    title: "Criar um ministério",
    href: "/ministerios/novo",
    subSteps: [
      { label: "Cadastrar qualquer ministério", conditionKey: "has_ministry" },
    ],
  },
  {
    key: "customize_landing",
    title: "Personalizar a landing page",
    href: "/landing-page",
    subSteps: [
      {
        label: "Preencher o 'Sobre nós' da igreja",
        conditionKey: "has_about_us",
        anyOf: true,
      },
      {
        label: "Publicar a página da sua comunidade",
        conditionKey: "is_published",
        anyOf: true,
      },
    ],
  },
  {
    key: "explore_league",
    title: "Explorar a Liga",
    href: "/liga",
    subSteps: [
      { label: "Visitar a página da Liga", conditionKey: "visited_league" },
    ],
  },
];

// ─── Particle system ──────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  rotate: number;
}

function makeParticles(count: number): Particle[] {
  const colors = [
    "oklch(0.32 0.096 224)",
    "oklch(0.70 0.136 62)",
    "oklch(0.55 0.118 148)",
    "oklch(0.62 0.148 58)",
  ];
  // Deterministic spread using trigonometry so no Math.random hydration issues
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + i * 0.7;
    const radius = 60 + (i % 4) * 20;
    return {
      id: i,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius - 40,
      color: colors[i % colors.length],
      size: 5 + (i % 3) * 2,
      delay: i * 0.045,
      rotate: i * 37,
    };
  });
}

// ─── Completion card ──────────────────────────────────────────────────────────

function CompletionCard({
  celebrating,
  particles,
  onClose,
}: {
  celebrating: boolean;
  particles: Particle[];
  onClose: () => void;
}) {
  return (
    <div className="relative px-5 py-6 text-center overflow-hidden">
      {/* Particle burst */}
      <AnimatePresence>
        {celebrating && (
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            aria-hidden="true"
          >
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-sm"
                style={{
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  rotate: p.rotate,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
                transition={{
                  duration: 0.9,
                  delay: p.delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Icon */}
      <div className="mb-3 flex justify-center">
        <div
          className="size-12 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.62 0.148 58 / 0.12)" }}
        >
          <Sparkles
            className="size-6"
            style={{ color: "oklch(0.62 0.148 58)" }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Heading */}
      <h3
        className="mb-1.5"
        style={{
          fontFamily: "Instrument Serif, Georgia, serif",
          fontSize: "1.2rem",
          color: "oklch(0.18 0.012 230)",
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
        }}
      >
        Configuração completa!
      </h3>

      <p
        className="text-[13px] mb-5"
        style={{
          color: "oklch(0.42 0.016 220)",
          lineHeight: 1.55,
          maxWidth: "24ch",
          margin: "0 auto 1.25rem",
        }}
      >
        Sua comunidade está pronta no Koinos. Continue explorando tudo que a
        plataforma oferece.
      </p>

      <button
        onClick={onClose}
        className="w-full rounded-xl py-2 text-sm font-medium transition-all active:scale-[0.97]"
        style={{
          background: "oklch(0.62 0.148 58)",
          color: "oklch(0.97 0.008 70)",
        }}
      >
        Fechar
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface OnboardingChecklistProps {
  initialProgress: OnboardingProgressData | null;
  conditions: StepConditions;
  memberId: string;
}

export function OnboardingChecklist({
  initialProgress,
  conditions: initialConditions,
}: OnboardingChecklistProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);
  const [conditions, setConditions] = useState(initialConditions);
  const [minimized, setMinimized] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("koinos:onboarding-dismissed") === "true";
  });
  const [closing, setClosing] = useState(false);

  const particles = useMemo(() => makeParticles(16), []);
  const prevCountRef = useRef<number>(
    initialProgress?.steps_completed.length ?? 0
  );

  if (dismissed || progress?.completed_at) return null;

  const completedSet = new Set<OnboardingStepKey>(
    progress?.steps_completed ?? []
  );
  const completedCount = completedSet.size;
  const total = ALL_STEPS.length;
  const allDone = completedCount === total;
  const progressFraction = completedCount / total;

  function triggerCelebrationIfJustCompleted(newCount: number) {
    if (newCount === total && prevCountRef.current < total) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 1200);
    }
    prevCountRef.current = newCount;
  }

  async function handleGoStep(step: (typeof ALL_STEPS)[number]) {
    // explore_league is the only step marked on navigation
    if (step.key === "explore_league" && !completedSet.has("explore_league")) {
      try {
        await markStepCompleted("explore_league");
        const newSteps = [
          ...(progress?.steps_completed ?? []),
          "explore_league" as OnboardingStepKey,
        ];
        setProgress((prev) =>
          prev
            ? { ...prev, steps_completed: newSteps }
            : {
                id: "",
                member_id: "",
                church_id: "",
                steps_completed: newSteps,
                completed_at: null,
                created_at: "",
                updated_at: "",
              }
        );
        setConditions((prev) => ({ ...prev, visited_league: true }));
        triggerCelebrationIfJustCompleted(newSteps.length);
      } catch {
        toast.error("Erro ao registrar etapa. Tente novamente.");
      }
    }
    router.push(step.href);
  }

  async function handleClose() {
    setClosing(true);
    try {
      await completeOnboarding();
    } catch {
      toast.error("Erro ao encerrar o checklist.");
    } finally {
      localStorage.setItem("koinos:onboarding-dismissed", "true");
      setDismissed(true);
    }
  }

  return (
    <div
      className={`fixed z-80 pointer-events-none sm:bottom-4 sm:right-4 sm:left-auto sm:w-80 ${
        minimized
          ? "bottom-4 right-4 left-auto w-80"
          : "bottom-0 left-0 right-0"
      }`}
      role="complementary"
      aria-label="Checklist de onboarding"
    >
      <motion.div
        layout
        layoutRoot
        className={`pointer-events-auto overflow-hidden ${
          minimized ? "rounded-2xl" : "rounded-t-2xl sm:rounded-2xl"
        }`}
        style={{
          boxShadow:
            "0 -4px 20px oklch(0.32 0.096 224 / 0.08), 0 8px 24px oklch(0.32 0.096 224 / 0.10)",
        }}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Header (petroleum dusk) ─────────────────────────────────── */}
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{ background: "oklch(0.32 0.096 224)" }}
        >
          {/* Mobile drag handle affordance — only when expanded */}
          {!minimized && (
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full sm:hidden"
              style={{ background: "oklch(0.97 0.006 220 / 0.25)" }}
              aria-hidden="true"
            />
          )}

          {/* Title + progress bar */}
          <button
            className="flex-1 text-left"
            onClick={() => setMinimized((m) => !m)}
            aria-expanded={!minimized}
            aria-controls="onboarding-steps"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                style={{
                  fontFamily: "Instrument Serif, Georgia, serif",
                  fontSize: "0.875rem",
                  color: "oklch(0.97 0.006 220)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                }}
              >
                Primeiros passos
              </span>
              <span
                className="font-mono text-[11px]"
                style={{ color: "oklch(0.97 0.006 220 / 0.6)" }}
              >
                {completedCount}/{total}
              </span>
            </div>

            {/* Progress track */}
            <div
              className="h-0.75 rounded-full overflow-hidden"
              style={{ background: "oklch(0.97 0.006 220 / 0.15)" }}
            >
              <motion.div
                className="h-full rounded-full origin-left"
                style={{ background: "oklch(0.70 0.136 62)" }}
                animate={{ scaleX: progressFraction }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </button>

          {/* Minimize / expand toggle */}
          <button
            onClick={() => setMinimized((m) => !m)}
            className="shrink-0 rounded-lg p-1 transition-colors hover:bg-white/10"
            aria-label={
              minimized ? "Expandir checklist" : "Minimizar checklist"
            }
          >
            {minimized ? (
              <ChevronUp
                className="size-4"
                style={{ color: "oklch(0.97 0.006 220 / 0.75)" }}
                aria-hidden="true"
              />
            ) : (
              <ChevronDown
                className="size-4"
                style={{ color: "oklch(0.97 0.006 220 / 0.75)" }}
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        {/* ── Content ────────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {!minimized && (
            <motion.div
              id="onboarding-steps"
              key="content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                overflow: "hidden",
                background: "oklch(0.99 0.003 75)",
              }}
            >
              {allDone ? (
                <CompletionCard
                  celebrating={celebrating}
                  particles={particles}
                  onClose={handleClose}
                />
              ) : (
                <>
                  <ul
                    className="py-1 max-h-[50vh] sm:max-h-none overflow-y-auto"
                    role="list"
                  >
                    {ALL_STEPS.map((step, i) => {
                      const done = completedSet.has(step.key);
                      const isNext =
                        !done &&
                        ALL_STEPS.slice(0, i).every((s) =>
                          completedSet.has(s.key)
                        );

                      // Sub-step completion from conditions
                      const hasAny = step.subSteps.some((s) => s.anyOf);
                      const subDone = step.subSteps.map((s) => ({
                        ...s,
                        met: conditions[s.conditionKey],
                      }));

                      return (
                        <li
                          key={step.key}
                          className="px-4 py-2.5 transition-colors"
                          style={{
                            background: isNext
                              ? "oklch(0.96 0.008 224 / 0.45)"
                              : "transparent",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkbox indicator */}
                            <motion.div
                              className="shrink-0 size-4.5 rounded-full flex items-center justify-center"
                              style={{
                                background: done
                                  ? "oklch(0.32 0.096 224)"
                                  : "transparent",
                                border: done
                                  ? "none"
                                  : `1.5px solid ${
                                      isNext
                                        ? "oklch(0.62 0.148 58)"
                                        : "oklch(0.88 0.01 220)"
                                    }`,
                              }}
                              animate={done ? { scale: [1, 1.15, 1] } : {}}
                              transition={{ duration: 0.25 }}
                              aria-hidden="true"
                            >
                              {done && (
                                <Check
                                  className="size-2.5"
                                  style={{ color: "oklch(0.97 0.006 220)" }}
                                  strokeWidth={3}
                                />
                              )}
                            </motion.div>

                            {/* Step title */}
                            <span
                              className="flex-1 text-[13px] font-medium leading-snug"
                              style={{
                                color: done
                                  ? "oklch(0.52 0.016 220)"
                                  : isNext
                                    ? "oklch(0.18 0.012 230)"
                                    : "oklch(0.42 0.016 220)",
                                textDecoration: done
                                  ? "line-through oklch(0.72 0.016 220)"
                                  : "none",
                              }}
                            >
                              {step.title}
                            </span>

                            {/* Navigate button */}
                            <button
                              onClick={() => handleGoStep(step)}
                              className="shrink-0 flex items-center gap-0.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors hover:bg-muted"
                              style={{
                                color: done
                                  ? "oklch(0.62 0.016 220)"
                                  : "oklch(0.32 0.096 224)",
                              }}
                              aria-label={`Ir para ${step.title}`}
                            >
                              Ir
                              <ArrowRight
                                className="size-3"
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                            </button>
                          </div>

                          {/* Sub-steps — shown when step is not done */}
                          {!done && (
                            <ul
                              className="mt-1.5 ml-7 space-y-1"
                              aria-label={`Requisitos para ${step.title}`}
                            >
                              {hasAny && (
                                <li
                                  className="text-[10px] font-medium mb-0.5"
                                  style={{ color: "oklch(0.52 0.016 220)" }}
                                  aria-hidden="true"
                                >
                                  Complete pelo menos um:
                                </li>
                              )}
                              {subDone.map((sub) => (
                                <li
                                  key={sub.conditionKey}
                                  className="flex items-center gap-1.5"
                                >
                                  {/* Sub-step indicator */}
                                  <div
                                    className="shrink-0 size-3.5 rounded-full flex items-center justify-center"
                                    style={{
                                      background: sub.met
                                        ? "oklch(0.55 0.118 148)"
                                        : "transparent",
                                      border: sub.met
                                        ? "none"
                                        : "1.5px solid oklch(0.88 0.01 220)",
                                    }}
                                    aria-hidden="true"
                                  >
                                    {sub.met && (
                                      <Check
                                        className="size-2"
                                        style={{
                                          color: "oklch(0.97 0.006 148)",
                                        }}
                                        strokeWidth={3}
                                      />
                                    )}
                                  </div>
                                  <span
                                    className="text-[11px] leading-tight"
                                    style={{
                                      color: sub.met
                                        ? "oklch(0.55 0.118 148)"
                                        : "oklch(0.52 0.016 220)",
                                    }}
                                  >
                                    {sub.label}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {/* Footer dismiss */}
                  <div
                    className="flex justify-end px-4 py-2 border-t"
                    style={{ borderColor: "oklch(0.88 0.01 220 / 0.6)" }}
                  >
                    <button
                      onClick={handleClose}
                      disabled={closing}
                      className="flex items-center gap-1 text-[11px] transition-colors hover:text-foreground"
                      style={{ color: "oklch(0.52 0.016 220)" }}
                    >
                      <X className="size-3" aria-hidden="true" />
                      Dispensar
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Legacy export (keeps backward-compat with dashboard/layout.tsx import) ──
/** @deprecated Use OnboardingChecklist */
export { OnboardingChecklist as OnboardingTour };
