"use client";

import Link from "next/link";
import { Users, Crown, Music2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MusicGroupWithRelations } from "@/actions/music-groups";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function getAccentClass(name: string): string {
  const colors = [
    "border-l-amber-500",
    "border-l-primary",
    "border-l-violet-500",
    "border-l-rose-500",
    "border-l-emerald-500",
    "border-l-sky-500",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

interface MusicGroupCardProps {
  group: MusicGroupWithRelations;
}

export function MusicGroupCard({ group }: MusicGroupCardProps) {
  const accent = getAccentClass(group.name);

  return (
    <Link
      href={`/grupos-musicais/${group.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4",
        "border-l-4 hover:shadow-sm transition-all duration-150",
        accent
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Music2 className="size-3.5 text-muted-foreground shrink-0" />
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-150 leading-tight truncate">
            {group.name}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          <Users className="size-2.5" />
          {group.member_count}
        </span>
      </div>

      {/* Leader */}
      <div className="flex flex-col gap-1.5">
        {group.leader ? (
          <div className="flex items-center gap-2">
            <Crown className="size-3 text-amber-500 shrink-0" />
            <Avatar size="sm" className="shrink-0">
              {group.leader.avatar_url && (
                <AvatarImage
                  src={group.leader.avatar_url}
                  alt={group.leader.name}
                />
              )}
              <AvatarFallback className="text-[9px] bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {getInitials(group.leader.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground truncate">
              {group.leader.name}
              <span className="ml-1 text-[10px] text-muted-foreground/60">
                líder
              </span>
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground/60 italic">
            Sem líder definido
          </p>
        )}
      </div>

      {/* Chevron */}
      <div className="flex justify-end">
        <svg
          viewBox="0 0 16 16"
          className="size-3.5 text-muted-foreground/30 group-hover:text-primary/40 transition-colors duration-150"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 12l4-4-4-4"
          />
        </svg>
      </div>
    </Link>
  );
}
