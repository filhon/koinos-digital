"use client";

import Link from "next/link";
import { Users, Shield, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MinistryWithRelations } from "@/actions/ministries";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

interface MinistryCardProps {
  ministry: MinistryWithRelations;
}

export function MinistryCard({ ministry }: MinistryCardProps) {
  return (
    <Link
      href={`/ministerios/${ministry.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4",
        "hover:shadow-sm hover:bg-muted/30 transition-all duration-150"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-150 leading-tight">
          {ministry.name}
        </p>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          <Users className="size-2.5" />
          {ministry.member_count}
        </span>
      </div>

      {/* Counselor + Leader */}
      <div className="flex flex-col gap-1.5">
        {ministry.counselor && (
          <div className="flex items-center gap-2">
            <Shield className="size-3 text-muted-foreground shrink-0" />
            <Avatar size="sm" className="shrink-0">
              {ministry.counselor.avatar_url && (
                <AvatarImage
                  src={ministry.counselor.avatar_url}
                  alt={ministry.counselor.name}
                />
              )}
              <AvatarFallback className="text-[9px] bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {getInitials(ministry.counselor.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground truncate">
              {ministry.counselor.name}
              <span className="ml-1 text-[10px] text-muted-foreground/60">
                conselheiro
              </span>
            </span>
          </div>
        )}

        {ministry.leader && (
          <div className="flex items-center gap-2">
            <Crown className="size-3 text-muted-foreground shrink-0" />
            <Avatar size="sm" className="shrink-0">
              {ministry.leader.avatar_url && (
                <AvatarImage
                  src={ministry.leader.avatar_url}
                  alt={ministry.leader.name}
                />
              )}
              <AvatarFallback className="text-[9px] bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {getInitials(ministry.leader.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground truncate">
              {ministry.leader.name}
              <span className="ml-1 text-[10px] text-muted-foreground/60">
                líder
              </span>
            </span>
          </div>
        )}

        {!ministry.counselor && !ministry.leader && (
          <p className="text-[11px] text-muted-foreground/60 italic">
            Sem conselheiro ou líder definido
          </p>
        )}
      </div>
    </Link>
  );
}
