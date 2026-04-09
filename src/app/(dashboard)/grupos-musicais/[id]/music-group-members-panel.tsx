"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus, UserMinus, Search, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  addMusicGroupMember,
  removeMusicGroupMember,
} from "@/actions/music-groups";
import type {
  MusicGroupMemberRow,
  MemberSummary,
} from "@/actions/music-groups";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

interface MusicGroupMembersPanelProps {
  groupId: string;
  members: MusicGroupMemberRow[];
  allMembers: MemberSummary[];
  canManage: boolean;
}

export function MusicGroupMembersPanel({
  groupId,
  members,
  allMembers,
  canManage,
}: MusicGroupMembersPanelProps) {
  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [localMembers, setLocalMembers] =
    useState<MusicGroupMemberRow[]>(members);

  const memberIds = new Set(localMembers.map((m) => m.member.id));

  const filteredMembers = localMembers.filter((m) =>
    m.member.name.toLowerCase().includes(search.toLowerCase())
  );

  const availableToAdd = allMembers.filter(
    (m) =>
      !memberIds.has(m.id) &&
      m.name.toLowerCase().includes(addSearch.toLowerCase())
  );

  const handleAdd = (memberId: string) => {
    startTransition(async () => {
      const result = await addMusicGroupMember({
        musicGroupId: groupId,
        memberId,
      });

      if (!result || "code" in result) {
        toast.error("code" in result ? result.error : "Erro inesperado");
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }

      const added = allMembers.find((m) => m.id === memberId);
      if (added) {
        setLocalMembers((prev) => [
          ...prev,
          { id: result.data!.id, member: added },
        ]);
      }
      setAddSearch("");
      toast.success("Membro adicionado ao grupo");
    });
  };

  const handleRemove = (memberId: string) => {
    startTransition(async () => {
      const result = await removeMusicGroupMember({
        musicGroupId: groupId,
        memberId,
      });

      if (!result || "code" in result) {
        toast.error("code" in result ? result.error : "Erro inesperado");
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setLocalMembers((prev) => prev.filter((m) => m.member.id !== memberId));
      toast.success("Membro removido do grupo");
    });
  };

  return (
    <div className="space-y-6">
      {/* Search membros existentes */}
      {localMembers.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Filtrar componentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm pl-9 pr-3 h-9 text-sm bg-background border border-input rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
          />
        </div>
      )}

      {/* Lista de membros */}
      {filteredMembers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {localMembers.length === 0
            ? "Nenhum componente adicionado ainda"
            : "Nenhum resultado para a busca"}
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {filteredMembers.map((row) => (
            <li
              key={row.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <Avatar size="sm">
                {row.member.avatar_url && (
                  <AvatarImage
                    src={row.member.avatar_url}
                    alt={row.member.name}
                  />
                )}
                <AvatarFallback className="text-[10px] bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  {getInitials(row.member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {row.member.name}
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {row.member.role}
                </p>
              </div>
              {canManage && (
                <button
                  onClick={() => handleRemove(row.member.id)}
                  disabled={isPending}
                  className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  title="Remover do grupo"
                >
                  <UserMinus className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Adicionar membros */}
      {canManage && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus className="size-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">
              Adicionar componente
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Buscar membro..."
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-9 text-sm bg-background border border-input rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
            />
          </div>

          {addSearch.trim() && (
            <ul className="divide-y divide-border/50 rounded-lg border border-border bg-background overflow-hidden">
              {availableToAdd.length === 0 ? (
                <li className="px-3 py-3 text-xs text-muted-foreground text-center">
                  Nenhum membro disponível
                </li>
              ) : (
                availableToAdd.slice(0, 8).map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => handleAdd(m.id)}
                      disabled={isPending}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <Avatar size="sm">
                        {m.avatar_url && (
                          <AvatarImage src={m.avatar_url} alt={m.name} />
                        )}
                        <AvatarFallback className="text-[10px] bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                          {getInitials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {m.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground capitalize">
                          {m.role}
                        </p>
                      </div>
                      {isPending ? (
                        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                      ) : (
                        <UserPlus className="size-3.5 text-primary" />
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
