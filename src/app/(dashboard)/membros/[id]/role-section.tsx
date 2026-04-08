"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RoleBadge } from "../role-badge";
import { updateMemberRole } from "@/actions/members";
import { MEMBER_ROLES } from "@/lib/validators/members";

const ROLE_LABELS: Record<string, string> = {
  pastor: "Pastor",
  presbítero: "Presbítero",
  diácono: "Diácono",
  tesoureiro: "Tesoureiro",
  líder: "Líder",
  membro: "Membro",
  visitante: "Visitante",
};

interface RoleSectionProps {
  memberId: string;
  memberName: string;
  currentRole: string;
}

export function RoleSection({
  memberId,
  memberName,
  currentRole,
}: RoleSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);

  const handleConfirm = () => {
    if (selectedRole === currentRole) {
      setDialogOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await updateMemberRole({
        memberId,
        newRole: selectedRole as (typeof MEMBER_ROLES)[number],
      });

      if (!result || result.error) {
        toast.error(result?.error ?? "Erro ao alterar papel");
        return;
      }

      toast.success(
        `Papel de ${memberName} alterado para ${ROLE_LABELS[selectedRole]}`
      );
      setDialogOpen(false);
      router.refresh();
    });
  };

  const handleOpenDialog = () => {
    setSelectedRole(currentRole);
    setDialogOpen(true);
  };

  return (
    <>
      <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/8 text-primary">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Papel na igreja
              </p>
              <div className="mt-0.5">
                <RoleBadge role={currentRole} />
              </div>
            </div>
          </div>

          <Button size="sm" variant="outline" onClick={handleOpenDialog}>
            Alterar papel
          </Button>
        </div>
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => {
          if (!isPending) setDialogOpen(open);
        }}
      >
        <DialogContent showCloseButton={!isPending}>
          <DialogHeader>
            <DialogTitle>Alterar papel</DialogTitle>
            <DialogDescription>
              Altere o papel de{" "}
              <span className="font-medium text-foreground">{memberName}</span>{" "}
              na igreja. Esta ação é registrada no audit log.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Papel atual</span>
              <RoleBadge role={currentRole} />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="role-select"
                className="text-xs font-medium text-muted-foreground"
              >
                Novo papel
              </label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isPending}
                className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-60"
              >
                {MEMBER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isPending || selectedRole === currentRole}
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
