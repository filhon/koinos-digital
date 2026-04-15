"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import type { FullLandingData } from "@/lib/validators/landing-page";

interface Props {
  data: FullLandingData;
}

const ROLE_LABELS: Record<string, string> = {
  pastor: "Pastor",
  presbítero: "Presbítero",
  diácono: "Diácono",
};

export default function LeadershipSection({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className="py-28 px-6"
      style={{ background: "oklch(0.97 0.005 250)" }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p
            className="text-xs font-medium tracking-widest uppercase mb-4"
            style={{ color: "oklch(0.55 0.1 250)" }}
          >
            Nossa Liderança
          </p>
          <h2
            className="text-3xl sm:text-4xl font-normal"
            style={{
              fontFamily: "var(--font-display)",
              color: "oklch(0.18 0.04 250)",
            }}
          >
            Quem nos guia
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {data.leadership.map((leader, i) => (
            <motion.div
              key={leader.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col items-center text-center"
            >
              {/* Avatar */}
              <div
                className="relative w-20 h-20 rounded-full overflow-hidden mb-4 ring-2 ring-offset-2"
                style={
                  {
                    "--tw-ring-color": "oklch(0.78 0.13 55 / 0.3)",
                    background: "oklch(0.88 0.02 250)",
                  } as React.CSSProperties
                }
              >
                {leader.avatar_url ? (
                  <Image
                    src={leader.avatar_url}
                    alt={leader.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-2xl font-normal"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "oklch(0.45 0.07 250)",
                    }}
                  >
                    {leader.name.charAt(0)}
                  </div>
                )}
              </div>

              <p
                className="text-base font-medium leading-tight mb-1"
                style={{ color: "oklch(0.18 0.04 250)" }}
              >
                {leader.name}
              </p>
              <p className="text-xs" style={{ color: "oklch(0.55 0.08 55)" }}>
                {ROLE_LABELS[leader.role] ?? leader.role}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
