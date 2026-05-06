"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { FullLandingData } from "@/lib/validators/landing-page";

interface Props {
  data: FullLandingData;
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // YouTube watch?v=ID
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    // YouTube youtu.be/ID
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    // YouTube /live URL
    if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/live/")) {
      return `https://www.youtube.com/embed${u.pathname.replace("/live", "")}`;
    }
    return url;
  } catch {
    return null;
  }
}

export default function StreamingSection({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const embedUrl = data.streaming_url ? getEmbedUrl(data.streaming_url) : null;

  if (!embedUrl) return null;

  return (
    <div
      ref={ref}
      className="py-20 px-6"
      style={{ background: "oklch(0.97 0.005 250)" }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p
            className="text-xs font-medium tracking-widest uppercase mb-4"
            style={{ color: "oklch(0.55 0.1 250)" }}
          >
            Online
          </p>
          <h2
            className="text-3xl sm:text-4xl font-normal"
            style={{
              fontFamily: "var(--font-display)",
              color: "oklch(0.18 0.04 250)",
            }}
          >
            Transmissão ao vivo
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl overflow-hidden aspect-video"
          style={{ boxShadow: "0 20px 60px oklch(0.18 0.04 250 / 0.2)" }}
        >
          {/* Amber glow border */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-10"
            style={{ boxShadow: "inset 0 0 0 1px oklch(0.78 0.13 55 / 0.2)" }}
          />
          <iframe
            src={embedUrl}
            title="Transmissão"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </motion.div>
      </div>
    </div>
  );
}
