"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

// ─── Frame styles ─────────────────────────────────────────────────────────────

type FrameStyle = "silver" | "gold" | "tribal" | "glow" | null;

interface FrameConfig {
  ring: string;
  glow?: string;
  animate?: boolean;
}

function getFrameConfig(
  style: FrameStyle,
  frameColor: string | null,
  teamColor: string | null
): FrameConfig | null {
  if (!style) return null;

  switch (style) {
    case "silver":
      return {
        ring: "oklch(0.72 0.02 220)",
      };
    case "gold":
      return {
        ring: "oklch(0.78 0.14 82)",
      };
    case "tribal":
      return {
        ring: teamColor ?? frameColor ?? "oklch(0.62 0.148 58)",
      };
    case "glow":
      return {
        ring: frameColor ?? "oklch(0.75 0.18 56)",
        glow: frameColor ?? "oklch(0.75 0.18 56)",
        animate: true,
      };
    default:
      return null;
  }
}

// ─── Sizes ────────────────────────────────────────────────────────────────────

const SIZE_MAP = {
  xs: { avatar: "h-6 w-6", padding: "p-[2px]", text: "text-[9px]" },
  sm: { avatar: "h-8 w-8", padding: "p-[2px]", text: "text-[10px]" },
  md: { avatar: "h-10 w-10", padding: "p-[2.5px]", text: "text-xs" },
  lg: { avatar: "h-14 w-14", padding: "p-[3px]", text: "text-sm" },
  xl: { avatar: "h-20 w-20", padding: "p-[3.5px]", text: "text-base" },
} as const;

type AvatarSize = keyof typeof SIZE_MAP;

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvatarWithFrameProps {
  src: string | null | undefined;
  fallback: string;
  size?: AvatarSize;
  frameStyle?: FrameStyle;
  frameColor?: string | null;
  teamColor?: string | null;
  hasBoost?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AvatarWithFrame({
  src,
  fallback,
  size = "md",
  frameStyle = null,
  frameColor = null,
  teamColor = null,
  hasBoost = false,
  className,
}: AvatarWithFrameProps) {
  const sizes = SIZE_MAP[size];
  const config = getFrameConfig(frameStyle, frameColor, teamColor);

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {/* Frame ring */}
      {config ? (
        <div
          className={cn("rounded-full", sizes.padding)}
          style={{ background: config.ring }}
        >
          {config.animate ? (
            <motion.div
              className="rounded-full"
              animate={{
                boxShadow: [
                  `0 0 0px 0px ${config.glow}`,
                  `0 0 8px 2px ${config.glow}55`,
                  `0 0 0px 0px ${config.glow}`,
                ],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Avatar className={cn(sizes.avatar, "ring-0")}>
                {src && <AvatarImage src={src} alt="" />}
                <AvatarFallback
                  className={cn(
                    sizes.text,
                    "bg-[oklch(0.92_0.012_220)] text-primary-700 font-medium"
                  )}
                >
                  {fallback}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          ) : (
            <Avatar className={cn(sizes.avatar, "ring-0")}>
              {src && <AvatarImage src={src} alt="" />}
              <AvatarFallback
                className={cn(
                  sizes.text,
                  "bg-[oklch(0.92_0.012_220)] text-primary-700 font-medium"
                )}
              >
                {fallback}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ) : (
        <Avatar className={cn(sizes.avatar)}>
          {src && <AvatarImage src={src} alt="" />}
          <AvatarFallback
            className={cn(
              sizes.text,
              "bg-[oklch(0.92_0.012_220)] text-primary-700 font-medium"
            )}
          >
            {fallback}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Boost sparkle badge */}
      {hasBoost && (
        <motion.span
          className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[oklch(0.78_0.14_82)] text-[8px] shadow-sm"
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          title="Boost de XP ativo"
        >
          ⚡
        </motion.span>
      )}
    </div>
  );
}
