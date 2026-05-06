"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import type { FullLandingData } from "@/lib/validators/landing-page";

interface Props {
  data: FullLandingData;
}

export default function PastorSection({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className="py-24 px-6"
      style={{ background: "oklch(0.12 0.03 250)" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-xs font-medium tracking-widest uppercase mb-16 text-center"
          style={{ color: "oklch(0.55 0.06 250)" }}
        >
          Sobre o Pastor
        </motion.p>

        <div className="grid md:grid-cols-[2fr_3fr] gap-12 md:gap-20 items-start">
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center md:items-start"
          >
            {data.pastor_photo_url ? (
              <div
                className="relative w-56 h-72 md:w-full md:h-96 rounded-2xl overflow-hidden"
                style={{ boxShadow: "0 30px 60px oklch(0.08 0.02 250 / 0.6)" }}
              >
                <Image
                  src={data.pastor_photo_url}
                  alt={data.pastor_name ?? "Pastor"}
                  fill
                  className="object-cover object-top"
                />
                {/* Amber overlay at bottom */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-24"
                  style={{
                    background:
                      "linear-gradient(to top, oklch(0.78 0.13 55 / 0.2), transparent)",
                  }}
                />
              </div>
            ) : (
              <div
                className="w-56 h-72 md:w-full md:h-96 rounded-2xl flex items-center justify-center"
                style={{ background: "oklch(0.2 0.04 250)" }}
              >
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="oklch(0.45 0.06 250)"
                  strokeWidth="1"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
            )}

            {data.pastor_name && (
              <p
                className="mt-4 text-xl font-normal text-center md:text-left"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "oklch(0.92 0.01 250)",
                }}
              >
                {data.pastor_name}
              </p>
            )}
          </motion.div>

          {/* Bio + quote */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: 0.8,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex flex-col justify-center gap-8"
          >
            {data.pastor_bio && (
              <p
                className="text-base sm:text-lg leading-relaxed"
                style={{ color: "oklch(0.7 0.025 250)" }}
              >
                {data.pastor_bio}
              </p>
            )}

            {data.pastor_quote && (
              <blockquote className="relative pl-6">
                {/* Amber left bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                  style={{ background: "oklch(0.78 0.13 55)" }}
                />
                <p
                  className="text-xl sm:text-2xl font-normal italic leading-relaxed"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "oklch(0.88 0.08 55)",
                  }}
                >
                  &ldquo;{data.pastor_quote}&rdquo;
                </p>
              </blockquote>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
