"use client";

import { motion } from "framer-motion";
import { slideInLeft, staggerContainer, fadeUp } from "@/lib/motion";
import { KoinosLogo } from "@/components/ui/koinos-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Branding Panel ── */}
      <motion.div
        className="relative lg:w-1/2 overflow-hidden"
        initial="hidden"
        animate="show"
        variants={slideInLeft}
      >
        {/* Warm gradient mesh background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 20%, oklch(0.82 0.14 72 / 0.9) 0%, transparent 60%),
              radial-gradient(ellipse 70% 70% at 80% 80%, oklch(0.68 0.18 50 / 0.8) 0%, transparent 55%),
              radial-gradient(ellipse 60% 80% at 50% 50%, oklch(0.75 0.16 65 / 0.6) 0%, transparent 70%),
              oklch(0.72 0.15 62)
            `,
          }}
        />

        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />

        {/* Decorative circles */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20"
          style={{ background: "oklch(0.90 0.10 80)" }}
        />
        <div
          className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full opacity-15"
          style={{ background: "oklch(0.55 0.18 45)" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full min-h-70 lg:min-h-screen px-10 py-10 lg:px-16 lg:py-16">
          {/* Top: Logo */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <KoinosLogo size={36} style={{ color: "oklch(0.18 0.04 55)" }} />

              <span
                className="text-5xl lg:text-6xl tracking-tight"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "oklch(0.18 0.04 55)",
                  letterSpacing: "-0.02em",
                }}
              >
                Koinos
              </span>
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="mt-3 text-sm font-medium tracking-[0.2em] uppercase"
              style={{ color: "oklch(0.30 0.06 55)" }}
            >
              Comunidade · Missão · Propósito
            </motion.p>
          </motion.div>

          {/* Middle: Decorative cross (desktop only) */}
          <motion.div
            className="hidden lg:flex flex-col items-center justify-center flex-1"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          >
            <svg
              width="120"
              height="140"
              viewBox="0 0 120 140"
              fill="none"
              aria-hidden="true"
              className="opacity-25"
            >
              {/* Cross */}
              <rect
                x="52"
                y="10"
                width="16"
                height="120"
                rx="4"
                fill="oklch(0.22 0.06 55)"
              />
              <rect
                x="20"
                y="38"
                width="80"
                height="16"
                rx="4"
                fill="oklch(0.22 0.06 55)"
              />
              {/* Olive branches */}
              <path
                d="M30 80 Q20 70 15 55 Q25 60 30 72"
                stroke="oklch(0.28 0.08 55)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M90 80 Q100 70 105 55 Q95 60 90 72"
                stroke="oklch(0.28 0.08 55)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <ellipse
                cx="22"
                cy="63"
                rx="5"
                ry="7"
                fill="oklch(0.35 0.10 60)"
                opacity="0.6"
                transform="rotate(-20 22 63)"
              />
              <ellipse
                cx="98"
                cy="63"
                rx="5"
                ry="7"
                fill="oklch(0.35 0.10 60)"
                opacity="0.6"
                transform="rotate(20 98 63)"
              />
            </svg>
          </motion.div>

          {/* Bottom: Scripture quote */}
          <motion.blockquote
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-xs"
          >
            <p
              className="text-base italic leading-relaxed"
              style={{
                fontFamily: "var(--font-display)",
                color: "oklch(0.28 0.06 55)",
              }}
            >
              &quot;…para que todos sejam um.&quot;
            </p>
            <cite
              className="mt-1 block text-xs not-italic tracking-wider font-medium"
              style={{ color: "oklch(0.38 0.07 58)" }}
            >
              — João 17:21
            </cite>
          </motion.blockquote>
        </div>
      </motion.div>

      {/* ── Form Panel ── */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center bg-white px-6 py-12 lg:px-16">
        <div className="w-full max-w-105">{children}</div>
      </div>
    </div>
  );
}
