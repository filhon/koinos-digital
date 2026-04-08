"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreVertical, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RoleBadge } from "./role-badge";
import { updateMemberRole } from "@/actions/members";
import type { MemberRow } from "@/actions/members";

const ROLE_ORDER = [
  "pastor",
  "presbítero",
  "diácono",
  "tesoureiro",
  "líder",
  "membro",
  "visitante",
] as const;

const ROLE_LABELS: Record<string, string> = {
  pastor: "Pastor",
  presbítero: "Presbítero",
  diácono: "Diácono",
  tesoureiro: "Tesoureiro",
  líder: "Líder",
  membro: "Membro",
  visitante: "Visitante",
};

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
  isPastor?: boolean;
}

export function MemberCard({
  member,
  compact = false,
  isPastor = false,
}: MemberCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  const currentIndex = ROLE_ORDER.indexOf(
    member.role as (typeof ROLE_ORDER)[number]
  );
  const canPromote = currentIndex > 0;
  const canDemote = currentIndex < ROLE_ORDER.length - 1;

  const handleQuickAction = (newRole: string) => {
    setPendingRole(newRole);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!pendingRole) return;

    startTransition(async () => {
      const result = await updateMemberRole({
        memberId: member.id,
        newRole: pendingRole as (typeof ROLE_ORDER)[number],
      });

      if (!result || result.error) {
        toast.error(result?.error ?? "Erro ao alterar papel");
        setDialogOpen(false);
        return;
      }

      toast.success(`Papel alterado para ${ROLE_LABELS[pendingRole]}`);
      setDialogOpen(false);
      setPendingRole(null);
      router.refresh();
    });
  };

  return (
    <>
      <div className="group flex items-center rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 hover:shadow-sm transition-all duration-150 overflow-hidden">
        <Link
          href={`/membros/${member.id}`}
          className="flex items-center gap-3 flex-1 min-w-0 p-3"
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12l4-4-4-4"
            />
          </svg>
        </Link>

        {isPastor && (
          <div className="flex items-center pr-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none"
                aria-label="Ações do membro"
              >
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuLabel>Alterar papel</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!canPromote}
                  onClick={() =>
                    canPromote &&
                    handleQuickAction(ROLE_ORDER[currentIndex - 1])
                  }
                >
                  <ArrowUp className="size-3.5 text-success" />
                  Promover
                  {canPromote && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {ROLE_LABELS[ROLE_ORDER[currentIndex - 1]]}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canDemote}
                  onClick={() =>
                    canDemote && handleQuickAction(ROLE_ORDER[currentIndex + 1])
                  }
                >
                  <ArrowDown className="size-3.5 text-error" />
                  Rebaixar
                  {canDemote && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {ROLE_LABELS[ROLE_ORDER[currentIndex + 1]]}
                    </span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {isPastor && pendingRole && (
        <Dialog
          open={dialogOpen}
          onOpenChange={(open: boolean) => {
            if (!isPending) setDialogOpen(open);
          }}
        >
          <DialogContent showCloseButton={!isPending}>
            <DialogHeader>
              <DialogTitle>Confirmar alteração de papel</DialogTitle>
              <DialogDescription>
                Alterar o papel de{" "}
                <span className="font-medium text-foreground">
                  {member.name}
                </span>{" "}
                de{" "}
                <span className="font-medium text-foreground">
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>{" "}
                para{" "}
                <span className="font-medium text-foreground">
                  {ROLE_LABELS[pendingRole] ?? pendingRole}
                </span>
                ?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={isPending}>
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
