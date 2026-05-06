"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlignLeft,
  Users,
  CalendarDays,
  Shield,
  Crown,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { deleteMinistry } from "@/actions/ministries";
import { cn } from "@/lib/utils";
import type { MinistryFull } from "@/actions/ministries";
import { MembersPanel } from "./members-panel";
import { ScalesPanel } from "./scales-panel";

const TABS = [
  { id: "info", label: "Informações", icon: AlignLeft },
  { id: "members", label: "Componentes", icon: Users },
  { id: "scales", label: "Escalas", icon: CalendarDays },
] as const;

type TabId = (typeof TABS)[number]["id"];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

interface MinistryDetailsProps {
  ministry: MinistryFull;
  canManageMembers: boolean;
  canEditScale: boolean;
  canEditInfo: boolean;
}

export function MinistryDetails({
  ministry,
  canManageMembers,
  canEditScale,
  canEditInfo,
}: MinistryDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleDelete = () => {
    if (
      !confirm(
        `Tem certeza que deseja excluir o ministério "${ministry.name}"? Esta ação não pode ser desfeita.`
      )
    )
      return;

    startDeleteTransition(async () => {
      const result = await deleteMinistry(ministry.id);
      if (!result || "code" in result || result.error) {
        toast.error(
          "code" in (result ?? {})
            ? (result as { error: string }).error
            : (result?.error ?? "Erro ao excluir")
        );
        return;
      }
      toast.success("Ministério excluído");
      router.push("/ministerios");
    });
  };

  return (
    <div className="space-y-4 mt-6">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-xs font-medium shrink-0 border-b-2 transition-colors duration-150",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
              {tab.id === "members" && (
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {ministry.member_count}
                </span>
              )}
              {tab.id === "scales" && (
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {ministry.upcoming_event_scales.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Informações */}
      {activeTab === "info" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <h3 className="text-sm font-semibold">Dados do ministério</h3>
            {canEditInfo && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/ministerios/${ministry.id}/editar`} />}
                  nativeButton={false}
                >
                  <Pencil className="size-3.5" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                >
                  {isDeleting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Excluir
                </Button>
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            {/* Counselor */}
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Shield className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Conselheiro
                </p>
                {ministry.counselor ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar size="sm">
                      {ministry.counselor.avatar_url && (
                        <AvatarImage
                          src={ministry.counselor.avatar_url}
                          alt={ministry.counselor.name}
                        />
                      )}
                      <AvatarFallback className="text-[9px] bg-primary-50 text-primary-700">
                        {getInitials(ministry.counselor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/membros/${ministry.counselor.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {ministry.counselor.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {ministry.counselor.role}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Não definido
                  </p>
                )}
              </div>
            </div>

            {/* Leader */}
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Crown className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Líder
                </p>
                {ministry.leader ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar size="sm">
                      {ministry.leader.avatar_url && (
                        <AvatarImage
                          src={ministry.leader.avatar_url}
                          alt={ministry.leader.name}
                        />
                      )}
                      <AvatarFallback className="text-[9px] bg-amber-50 text-amber-700">
                        {getInitials(ministry.leader.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/membros/${ministry.leader.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {ministry.leader.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {ministry.leader.role}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Não definido
                  </p>
                )}
              </div>
            </div>

            {/* Criado em */}
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <CalendarDays className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Criado em
                </p>
                <p className="text-sm text-foreground mt-1">
                  {new Date(ministry.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Componentes */}
      {activeTab === "members" && (
        <MembersPanel
          ministryId={ministry.id}
          currentMembers={ministry.ministry_members}
          canManage={canManageMembers}
        />
      )}

      {/* Tab: Escalas */}
      {activeTab === "scales" && (
        <ScalesPanel
          ministryId={ministry.id}
          ministryMembers={ministry.ministry_members.map((m) => m.member)}
          eventScales={ministry.upcoming_event_scales}
          canEdit={canEditScale}
        />
      )}
    </div>
  );
}
