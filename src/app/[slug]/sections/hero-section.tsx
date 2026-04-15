"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { FullLandingData } from "@/lib/validators/landing-page";

interface Props {
  data: FullLandingData;
}

export default function HeroSection({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Parallax: translateY até 30px conforme rola
  const y = useTransform(scrollYProgress, [0, 1], ["0px", "30px"]);

  return (
    <div
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background: imagem com parallax OU gradiente atmosférico */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-[110%] -top-[5%]"
      >
        {data.hero_image_url ? (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${data.hero_image_url})` }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background:
                "radial-gradient(ellipse 120% 80% at 60% 40%, oklch(0.35 0.08 230) 0%, oklch(0.18 0.045 250) 45%, oklch(0.10 0.025 265) 100%)",
            }}
          />
        )}
        {/* Overlay escuro */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.08 0.02 250 / 0.45) 0%, oklch(0.08 0.02 250 / 0.7) 60%, oklch(0.08 0.02 250 / 0.95) 100%)",
          }}
        />
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-6"
        >
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase"
            style={{
              background: "oklch(0.78 0.13 55 / 0.15)",
              border: "1px solid oklch(0.78 0.13 55 / 0.4)",
              color: "oklch(0.88 0.1 55)",
            }}
          >
            Bem-vindo
          </span>
        </motion.div>

        {/* Church name */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal leading-[1.05] mb-6"
          style={{
            fontFamily: "var(--font-display)",
            color: "oklch(0.97 0.005 250)",
            textShadow: "0 2px 40px oklch(0.08 0.02 250 / 0.8)",
          }}
        >
          {data.name}
        </motion.h1>

        {/* Slogan */}
        {data.slogan && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="text-lg sm:text-xl md:text-2xl font-light mb-12 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "oklch(0.82 0.02 250)" }}
          >
            {data.slogan}
          </motion.p>
        )}

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="#cta"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "oklch(0.78 0.13 55)",
              color: "oklch(0.13 0.025 250)",
              boxShadow: "0 8px 30px oklch(0.78 0.13 55 / 0.35)",
            }}
          >
            Faça parte
          </a>
          <a
            href="#about"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-medium transition-all duration-200 hover:bg-white/10"
            style={{
              border: "1px solid oklch(0.97 0.005 250 / 0.3)",
              color: "oklch(0.97 0.005 250)",
            }}
          >
            Conheça-nos
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: "oklch(0.65 0.02 250)" }}
      >
        <span className="text-xs tracking-widest uppercase">Role</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
          style={{ borderColor: "oklch(0.65 0.02 250 / 0.5)" }}
        >
          <div
            className="w-1 h-2 rounded-full"
            style={{ background: "oklch(0.78 0.13 55)" }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
