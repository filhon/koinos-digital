"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Star } from "lucide-react";
import { AppPreview } from "./_landing-preview";
import { KoinosLogo } from "@/components/ui/koinos-logo";

const words = [
  "ministérios",
  "escalas",
  "financeiro",
  "assembleias",
  "eventos",
  "comunicação",
  "relatórios",
  "repertório musical",
];

export function LandingHero() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setWordIndex((i) => (i + 1) % words.length),
      2800
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative pt-24 pb-16 px-6 overflow-hidden">
      {/* Background gradients */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 10% 20%, oklch(0.76 0.082 234 / 0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 90% 80%, oklch(0.70 0.136 62 / 0.08) 0%, transparent 60%), var(--background)",
        }}
      />

      {/* Brand pattern — ghost logo marks */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute"
          style={{
            top: "-8%",
            right: "0%",
            opacity: 0.08,
            transform: "rotate(14deg)",
            color: "oklch(0.32 0.096 224)",
          }}
        >
          <KoinosLogo size={340} />
        </div>
        <div
          className="absolute"
          style={{
            bottom: "-10%",
            left: "-4%",
            opacity: 0.06,
            transform: "rotate(-10deg)",
            color: "oklch(0.62 0.148 58)",
          }}
        >
          <KoinosLogo size={280} />
        </div>
        <div
          className="absolute"
          style={{
            top: "35%",
            right: "30%",
            opacity: 0.05,
            transform: "rotate(6deg)",
            color: "oklch(0.32 0.096 224)",
          }}
        >
          <KoinosLogo size={150} />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Split layout: text left, preview right */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: copy */}
          <div className="flex-1 min-w-0 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-accent/40 bg-accent/10 text-accent-700 text-xs font-semibold tracking-wider uppercase"
            >
              <Star className="w-3 h-3 fill-current" />
              Plano gratuito para sempre · sem cartão
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.1] tracking-tight text-foreground mb-6"
            >
              Gestão completa
              <br />
              <span className="text-primary">para sua igreja,</span>
              <br />
              em um só lugar.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
              className="text-base sm:text-lg text-text-body max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed"
            >
              Membros,{" "}
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block"
                  aria-hidden="true"
                >
                  {words[wordIndex]}
                </motion.span>
              </AnimatePresence>
              <span className="sr-only" aria-live="polite" aria-atomic="true">
                {words[wordIndex]}
              </span>
              , mural de interação, gamificação e muito mais. Tudo pensado para
              igrejas brasileiras.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link
                href="/signup/igreja"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-[0_8px_24px_oklch(0.32_0.096_224/0.3)] active:scale-[0.98]"
              >
                Cadastrar minha Igreja
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/signup/membro"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-primary/20 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
              >
                Já sou membro
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="mt-6 text-xs text-text-body text-center lg:text-left"
            >
              Grátis para até 100 membros · Sem cartão de crédito · Configure em
              minutos
            </motion.p>
          </div>

          {/* Right: navigable preview */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full lg:w-120 shrink-0"
          >
            <AppPreview />
          </motion.div>
        </div>

        {/* Mobile preview label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center text-[11px] text-text-body mt-6 lg:hidden"
        >
          Navegue pelo sistema — dados fictícios para demonstração
        </motion.p>
      </div>
    </section>
  );
}
