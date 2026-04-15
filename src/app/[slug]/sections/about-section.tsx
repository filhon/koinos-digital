"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { FullLandingData } from "@/lib/validators/landing-page";

interface Props {
  data: FullLandingData;
}

export default function AboutSection({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div
      ref={ref}
      className="py-28 px-6"
      style={{ background: "oklch(0.97 0.005 250)" }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Label */}
          <p
            className="text-xs font-medium tracking-widest uppercase mb-6"
            style={{ color: "oklch(0.55 0.1 250)" }}
          >
            Sobre Nós
          </p>

          {/* Drop-cap text */}
          <div
            className="text-lg sm:text-xl leading-relaxed"
            style={{ color: "oklch(0.28 0.03 250)" }}
          >
            {data.about_us?.split("\n\n").map((paragraph, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "mb-6 first-letter:text-6xl first-letter:font-normal first-letter:float-left first-letter:mr-3 first-letter:leading-[0.85] first-letter:mt-1"
                    : "mb-6"
                }
                style={
                  i === 0
                    ? {
                        fontFamily: "var(--font-display)",
                      }
                    : undefined
                }
              >
                {paragraph}
              </p>
            ))}
          </div>
        </motion.div>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12 h-px origin-left"
          style={{
            background:
              "linear-gradient(to right, oklch(0.78 0.13 55), transparent)",
          }}
        />
      </div>
    </div>
  );
}
