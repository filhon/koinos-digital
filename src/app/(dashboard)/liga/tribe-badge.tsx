"use client";

import { cn } from "@/lib/utils";

interface TribeBadgeProps {
  teamName: string;
  teamColor: string;
  size?: "sm" | "md";
  className?: string;
}

export function TribeBadge({
  teamName,
  teamColor,
  size = "sm",
  className,
}: TribeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-xs",
        className
      )}
      style={{
        backgroundColor: `${teamColor}1a`,
        color: teamColor,
        border: `1px solid ${teamColor}40`,
      }}
    >
      <span
        className="rounded-full"
        style={{
          width: size === "sm" ? 6 : 8,
          height: size === "sm" ? 6 : 8,
          backgroundColor: teamColor,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {teamName}
    </span>
  );
}
