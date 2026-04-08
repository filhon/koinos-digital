import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { RoleBadge } from "./role-badge";
import type { MemberRow } from "@/actions/members";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

interface MemberCardProps {
  member: MemberRow;
  compact?: boolean;
}

export function MemberCard({ member, compact = false }: MemberCardProps) {
  return (
    <Link
      href={`/membros/${member.id}`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/30 hover:bg-card/80 hover:shadow-sm transition-all duration-150"
    >
      <Avatar size={compact ? "sm" : "default"} className="shrink-0">
        {member.avatar_url && (
          <AvatarImage src={member.avatar_url} alt={member.name} />
        )}
        <AvatarFallback className="text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          {getInitials(member.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors duration-150">
          {member.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <RoleBadge role={member.role} />
          {!member.is_active && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-error-light text-error-dark">
              Inativo
            </span>
          )}
        </div>
      </div>

      <svg
        viewBox="0 0 16 16"
        className="size-4 text-muted-foreground/40 group-hover:text-primary/50 shrink-0 transition-colors duration-150"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12l4-4-4-4" />
      </svg>
    </Link>
  );
}
