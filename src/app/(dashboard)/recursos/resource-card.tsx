"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Package,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { deleteResource } from "@/actions/resources";
import type { ResourceWithResponsible } from "@/actions/resources";

interface ResourceCardProps {
  resource: ResourceWithResponsible;
  canManage: boolean;
}

export function ResourceCard({ resource, canManage }: ResourceCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isAvailable = resource.status === "disponível";

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteResource(resource.id);
      if (!result || result.error || "code" in result) {
        toast.error(
          "code" in (result ?? {})
            ? (result as { error: string }).error
            : (result?.error ?? "Erro ao excluir recurso")
        );
        return;
      }
      toast.success("Recurso excluído");
      setConfirmDelete(false);
      router.refresh();
    });
  };

  return (
    <>
      <div className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-card/80">
        {/* Icon */}
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors",
            isAvailable
              ? "bg-success-light dark:bg-success-dark/20"
              : "bg-destructive/10"
          )}
        >
          <Package
            className={cn(
              "size-5",
              isAvailable
                ? "text-success-dark dark:text-success-light"
                : "text-destructive"
            )}
          />
        </div>

        {/* Info */}
        <Link
          href={`/recursos/${resource.id}`}
          className="flex-1 min-w-0 group/link"
        >
          <p className="text-sm font-medium text-foreground group-hover/link:text-primary transition-colors truncate">
            {resource.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {resource.responsible ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                <User className="size-3 shrink-0" />
                {resource.responsible.name}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/50 italic">
                Sem responsável
              </span>
            )}
            {resource.value !== null && (
              <>
                <span className="text-muted-foreground/30 text-xs">·</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(resource.value)}
                </span>
              </>
            )}
          </div>
        </Link>

        {/* Status badge */}
        <Badge
          variant={isAvailable ? "outline" : "secondary"}
          className={cn(
            "shrink-0 text-[11px] font-medium border",
            isAvailable
              ? "border-success-dark/30 text-success-dark bg-success-light/50 dark:border-success-light/30 dark:text-success-light dark:bg-success-dark/20"
              : "border-destructive/30 text-destructive bg-destructive/10"
          )}
        >
          {isAvailable ? "Disponível" : "Indisponível"}
        </Badge>

        {/* Actions */}
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                render={<Link href={`/recursos/${resource.id}/editar`} />}
                className="flex items-center gap-2"
              >
                <Pencil className="size-3.5" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmDelete(true)}
                className="text-destructive focus:text-destructive flex items-center gap-2"
              >
                <Trash2 className="size-3.5" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Confirm delete dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir recurso</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-medium text-foreground">
                {resource.name}
              </span>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
