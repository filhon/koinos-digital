"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { FullLandingData } from "@/lib/validators/landing-page";

interface Props {
  data: FullLandingData;
}

export default function AddressSection({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className="py-24 px-6"
      style={{ background: "oklch(0.14 0.03 250)" }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p
            className="text-xs font-medium tracking-widest uppercase mb-4"
            style={{ color: "oklch(0.55 0.06 250)" }}
          >
            Localização
          </p>
          <h2
            className="text-3xl sm:text-4xl font-normal"
            style={{
              fontFamily: "var(--font-display)",
              color: "oklch(0.92 0.01 250)",
            }}
          >
            Como chegar
          </h2>
          {data.address_text && (
            <p
              className="mt-4 text-base"
              style={{ color: "oklch(0.62 0.03 250)" }}
            >
              {data.address_text}
            </p>
          )}
        </motion.div>

        {data.address_embed_url && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative rounded-2xl overflow-hidden"
            style={{
              height: "380px",
              boxShadow: "0 20px 50px oklch(0.08 0.02 250 / 0.5)",
            }}
          >
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none z-10"
              style={{ boxShadow: "inset 0 0 0 1px oklch(0.25 0.04 250)" }}
            />
            <iframe
              src={data.address_embed_url}
              title="Localização"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
              style={{
                filter:
                  "invert(90%) hue-rotate(180deg) saturate(0.4) brightness(0.8)",
              }}
            />
          </motion.div>
        )}

        {!data.address_embed_url && data.address_text && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center"
          >
            <div
              className="inline-flex items-center gap-3 px-6 py-4 rounded-xl"
              style={{ background: "oklch(0.18 0.04 250)" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="oklch(0.78 0.13 55)"
                strokeWidth="1.5"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span style={{ color: "oklch(0.75 0.03 250)" }}>
                {data.address_text}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
