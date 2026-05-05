"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Star } from "lucide-react";

const words = [
  "ministérios",
  "escalas",
  "financeiro",
  "assembleias",
  "membros",
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
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, oklch(0.76 0.082 234 / 0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, oklch(0.70 0.136 62 / 0.10) 0%, transparent 60%), var(--background)",
        }}
      />

      <div className="mx-auto max-w-4xl text-center">
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
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-5xl sm:text-6xl md:text-7xl leading-[1.1] tracking-tight text-foreground mb-6"
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
          className="text-lg sm:text-xl text-text-body max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Membros, {/* Visible animated word — hidden from screen readers */}
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
          {/* Accessible live region for the rotating word */}
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {words[wordIndex]}
          </span>
          , mural de interação, gamificação e muito mais. Tudo pensado para
          igrejas brasileiras, com foco em engajamento e simplicidade.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/signup/igreja"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-all hover:shadow-[0_8px_24px_oklch(0.32_0.096_224/0.3)] active:scale-[0.98]"
          >
            Criar minha igreja grátis
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-primary/20 text-primary text-base font-medium hover:bg-primary/5 transition-colors"
          >
            Já tenho uma conta
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-8 text-sm text-text-body"
        >
          Grátis para até 100 membros · Sem cartão de crédito · Configure em
          minutos
        </motion.p>
      </div>
    </section>
  );
}
