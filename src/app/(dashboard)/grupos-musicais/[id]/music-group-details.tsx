"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlignLeft,
  Users,
  Crown,
  Pencil,
  Trash2,
  Loader2,
  Music2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { deleteMusicGroup } from "@/actions/music-groups";
import { cn } from "@/lib/utils";
import type { MusicGroupFull, MemberSummary } from "@/actions/music-groups";
import { MusicGroupMembersPanel } from "./music-group-members-panel";

const TABS = [
  { id: "info", label: "Informações", icon: AlignLeft },
  { id: "members", label: "Componentes", icon: Users },
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

interface MusicGroupDetailsProps {
  group: MusicGroupFull;
  allMembers: MemberSummary[];
  canManage: boolean;
  canEdit: boolean;
}

export function MusicGroupDetails({
  group,
  allMembers,
  canManage,
  canEdit,
}: MusicGroupDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteMusicGroup(group.id);

      if (!result || "code" in result) {
        toast.error("code" in result ? result.error : "Erro inesperado");
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Grupo musical removido");
      router.push("/grupos-musicais");
    });
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 shrink-0">
              <Music2 className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">
                {group.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {group.member_count} componente
                {group.member_count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/grupos-musicais/${group.id}/editar`} />}
                nativeButton={false}
              >
                <Pencil className="size-3.5" />
                Editar
              </Button>
              {!showDeleteConfirm ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      "Confirmar exclusão"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Líder */}
        {group.leader && (
          <div className="mt-4 flex items-center gap-2 pt-4 border-t border-border/60">
            <Crown className="size-3.5 text-amber-500 shrink-0" />
            <Avatar size="sm">
              {group.leader.avatar_url && (
                <AvatarImage
                  src={group.leader.avatar_url}
                  alt={group.leader.name}
                />
              )}
              <AvatarFallback className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {getInitials(group.leader.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-xs font-medium text-foreground">
                {group.leader.name}
              </span>
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                líder do grupo
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Informações */}
      {activeTab === "info" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Nome
            </p>
            <p className="text-sm text-foreground">{group.name}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Líder
            </p>
            {group.leader ? (
              <p className="text-sm text-foreground">{group.leader.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Sem líder definido
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Componentes
            </p>
            <p className="text-sm text-foreground">{group.member_count}</p>
          </div>

          <div className="pt-2">
            <Link
              href={`/repertorio?grupo=${group.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Music2 className="size-3.5" />
              Ver repertório deste grupo
            </Link>
          </div>
        </div>
      )}

      {/* Tab: Componentes */}
      {activeTab === "members" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <MusicGroupMembersPanel
            groupId={group.id}
            members={group.music_group_members}
            allMembers={allMembers}
            canManage={canManage}
          />
        </div>
      )}
    </div>
  );
}
