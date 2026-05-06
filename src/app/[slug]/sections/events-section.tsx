"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FullLandingData } from "@/lib/validators/landing-page";

interface Props {
  data: FullLandingData;
}

const MODALITY_LABEL: Record<string, string> = {
  presencial: "Presencial",
  online: "Online",
  hibrido: "Híbrido",
};

export default function EventsSection({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className="py-28 px-6"
      style={{ background: "oklch(0.12 0.03 250)" }}
    >
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p
            className="text-xs font-medium tracking-widest uppercase mb-4"
            style={{ color: "oklch(0.55 0.06 250)" }}
          >
            Agenda
          </p>
          <h2
            className="text-3xl sm:text-4xl font-normal"
            style={{
              fontFamily: "var(--font-display)",
              color: "oklch(0.92 0.01 250)",
            }}
          >
            Próximos eventos
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative pl-8">
          {/* Vertical line */}
          <div
            className="absolute left-3 top-0 bottom-0 w-px"
            style={{ background: "oklch(0.25 0.04 250)" }}
          />

          <div className="space-y-10">
            {data.upcomingEvents.map((event, i) => {
              const date = parseISO(event.date);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative"
                >
                  {/* Dot */}
                  <div
                    className="absolute -left-8 top-2 w-3 h-3 rounded-full border-2"
                    style={{
                      background: "oklch(0.78 0.13 55)",
                      borderColor: "oklch(0.12 0.03 250)",
                      boxShadow: "0 0 0 4px oklch(0.78 0.13 55 / 0.2)",
                    }}
                  />

                  <div
                    className="rounded-xl p-5"
                    style={{ background: "oklch(0.17 0.04 250)" }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Date badge */}
                      <div
                        className="shrink-0 rounded-lg px-3 py-2 text-center min-w-[52px]"
                        style={{ background: "oklch(0.78 0.13 55 / 0.12)" }}
                      >
                        <p
                          className="text-xl font-semibold leading-none"
                          style={{ color: "oklch(0.88 0.1 55)" }}
                        >
                          {format(date, "dd")}
                        </p>
                        <p
                          className="text-xs uppercase mt-0.5"
                          style={{ color: "oklch(0.7 0.07 55)" }}
                        >
                          {format(date, "MMM", { locale: ptBR })}
                        </p>
                      </div>

                      <div className="flex-1">
                        <p
                          className="text-base font-medium mb-1"
                          style={{ color: "oklch(0.9 0.01 250)" }}
                        >
                          {event.name}
                        </p>
                        <div
                          className="flex flex-wrap gap-3 text-sm"
                          style={{ color: "oklch(0.55 0.04 250)" }}
                        >
                          {event.start_time && (
                            <span>{event.start_time.slice(0, 5)}</span>
                          )}
                          {event.location && <span>{event.location}</span>}
                          <span
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{
                              background: "oklch(0.25 0.06 250)",
                              color: "oklch(0.7 0.06 250)",
                            }}
                          >
                            {MODALITY_LABEL[event.modality] ?? event.modality}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
