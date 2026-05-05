"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Menu, X } from "lucide-react";

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

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border/20 bg-background/92 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-16">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-primary rounded-sm"
        >
          <KoinosLogo size={28} />
          <span className="font-display text-xl tracking-tight">Koinos</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-text-subtle font-medium">
          <Link
            href="#funcionalidades"
            className="hover:text-primary transition-colors rounded-sm"
          >
            Funcionalidades
          </Link>
          <Link
            href="#precos"
            className="hover:text-primary transition-colors rounded-sm"
          >
            Preços
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:block text-sm font-medium text-text-subtle hover:text-primary transition-colors px-3 py-2.5 rounded-sm"
          >
            Entrar
          </Link>
          <Link
            href="/signup/igreja"
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Começar grátis
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <button
            className="md:hidden p-3 text-text-subtle hover:text-primary transition-colors rounded-sm"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-border/20 bg-background"
          >
            <nav className="px-6 py-3 flex flex-col divide-y divide-border/20">
              <Link
                href="#funcionalidades"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-text-subtle hover:text-primary py-3 transition-colors rounded-sm"
              >
                Funcionalidades
              </Link>
              <Link
                href="#precos"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-text-subtle hover:text-primary py-3 transition-colors rounded-sm"
              >
                Preços
              </Link>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="sm:hidden text-sm font-medium text-text-subtle hover:text-primary py-3 transition-colors rounded-sm"
              >
                Entrar
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
