import Link from "next/link";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
} from "@/components/ui/avatar";
import { RoleBadge } from "./role-badge";
import type { FamilyGroup, MemberRow } from "@/actions/members";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function FamilyMemberRow({ member }: { member: MemberRow }) {
  return (
    <Link
      href={`/membros/${member.id}`}
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors duration-150"
    >
      <Avatar size="default" className="shrink-0">
        {member.avatar_url && (
          <AvatarImage src={member.avatar_url} alt={member.name} />
        )}
        <AvatarFallback className="text-xs font-medium bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-300">
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

interface FamilyCardProps {
  family: FamilyGroup;
}

export function FamilyCard({ family }: FamilyCardProps) {
  const { members } = family;

  // Determine family display name from the couple/parents in the group
  const spouses = members.filter((m) => m.is_active);
  const familyName = spouses
    .slice(0, 2)
    .map((m) => m.name.split(" ")[0])
    .join(" & ");

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Family header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-muted/30">
        <AvatarGroup>
          {members.slice(0, 3).map((m) => (
            <Avatar key={m.id} size="sm">
              {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.name} />}
              <AvatarFallback className="text-[10px] font-medium bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-300">
                {getInitials(m.name)}
              </AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Família {familyName}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {members.length} membro{members.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Members */}
      <div className="divide-y divide-border/40">
        {members.map((member) => (
          <FamilyMemberRow key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
