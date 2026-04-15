"use client";

import { useEffect, useState } from "react";
import { useScroll, motion } from "framer-motion";

interface Props {
  churchName: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.koinos.digital";

export default function LandingNav({ churchName }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const unsub = scrollY.on("change", (v) => setScrolled(v > 60));
    return unsub;
  }, [scrollY]);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        backdropFilter: scrolled ? "blur(16px)" : "none",
        backgroundColor: scrolled
          ? "oklch(0.13 0.025 250 / 0.9)"
          : "transparent",
        borderBottom: scrolled
          ? "1px solid oklch(0.25 0.02 250 / 0.5)"
          : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span
          className="text-[oklch(0.97_0.005_250)] text-lg font-medium tracking-wide"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {churchName}
        </span>
        <div className="flex items-center gap-3">
          <a
            href={`${APP_URL}/dashboard`}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={{
              color: "oklch(0.75 0.04 250)",
              border: "1px solid oklch(0.35 0.02 250 / 0.6)",
            }}
          >
            Acessar sistema
          </a>
          <a
            href="#cta"
            className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={{
              background: "oklch(0.78 0.13 55)",
              color: "oklch(0.13 0.025 250)",
            }}
          >
            Cadastre-se
          </a>
        </div>
      </div>
    </motion.nav>
  );
}
