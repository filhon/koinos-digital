"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { removeFamilyLink, addFamilyLink } from "@/actions/members";
import type { MemberWithLinks } from "@/actions/members";

const RELATIONSHIP_LABELS: Record<string, string> = {
  cônjuge: "Cônjuge",
  pai: "Pai",
  mãe: "Mãe",
  filho: "Filho",
  filha: "Filha",
  irmão: "Irmão",
  irmã: "Irmã",
};

const RELATIONSHIP_OPTIONS = [
  { value: "cônjuge", label: "Cônjuge" },
  { value: "pai", label: "Pai" },
  { value: "mãe", label: "Mãe" },
  { value: "filho", label: "Filho" },
  { value: "filha", label: "Filha" },
  { value: "irmão", label: "Irmão" },
  { value: "irmã", label: "Irmã" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

interface RemoveLinkButtonProps {
  memberId: string;
  relatedMemberId: string;
}

function RemoveLinkButton({
  memberId,
  relatedMemberId,
}: RemoveLinkButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeFamilyLink(memberId, relatedMemberId);
      if (!result || "error" in result) {
        toast.error(
          (result as { error: string })?.error ?? "Erro ao remover vínculo"
        );
        return;
      }
      toast.success("Vínculo removido");
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="p-1.5 rounded-md text-muted-foreground hover:text-error hover:bg-error-light transition-colors disabled:opacity-50"
      title="Remover vínculo"
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Trash2 className="size-3.5" />
      )}
    </button>
  );
}

interface AddLinkFormProps {
  memberId: string;
  onSuccess: () => void;
}

function AddLinkForm({ memberId, onSuccess }: AddLinkFormProps) {
  const router = useRouter();
  const [relatedId, setRelatedId] = useState("");
  const [relationship, setRelationship] = useState("cônjuge");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!relatedId.trim()) {
      toast.error("Informe o ID do membro relacionado");
      return;
    }

    startTransition(async () => {
      const result = await addFamilyLink({
        memberId,
        relatedMemberId: relatedId.trim(),
        relationship: relationship as "cônjuge",
      });

      if (!result || "error" in result) {
        toast.error(
          (result as { error: string })?.error ?? "Erro ao adicionar vínculo"
        );
        return;
      }

      toast.success("Vínculo adicionado");
      setRelatedId("");
      onSuccess();
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 p-4 rounded-lg bg-muted/40 border border-border/60"
    >
      <p className="text-xs font-medium text-muted-foreground">
        Adicionar vínculo familiar
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            Relacionamento
          </label>
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full h-8 px-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            {RELATIONSHIP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">ID do membro</label>
          <input
            type="text"
            value={relatedId}
            onChange={(e) => setRelatedId(e.target.value)}
            placeholder="UUID do membro..."
            className="w-full h-8 px-2 text-sm bg-background border border-input rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !relatedId.trim()}
        >
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          Adicionar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onSuccess}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Cole o UUID do membro relacionado. Você pode encontrá-lo na URL da
        página do membro.
      </p>
    </form>
  );
}

interface FamilyLinksSectionProps {
  member: MemberWithLinks;
  isLeadership: boolean;
}

export function FamilyLinksSection({
  member,
  isLeadership,
}: FamilyLinksSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold">Vínculos familiares</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {member.family_links?.length
              ? `${member.family_links.length} vínculo${member.family_links.length !== 1 ? "s" : ""}`
              : "Nenhum vínculo cadastrado"}
          </p>
        </div>

        {isLeadership && !showAddForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="size-3.5" />
            Adicionar
          </Button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {showAddForm && (
          <AddLinkForm
            memberId={member.id}
            onSuccess={() => setShowAddForm(false)}
          />
        )}

        {!member.family_links?.length && !showAddForm && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum vínculo familiar cadastrado.
          </p>
        )}

        {member.family_links?.map((link) => (
          <div
            key={link.id}
            className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0"
          >
            <Link
              href={`/membros/${link.related_member_id}`}
              className="flex items-center gap-3 flex-1 group"
            >
              <Avatar size="sm">
                {link.related_member.avatar_url && (
                  <AvatarImage
                    src={link.related_member.avatar_url}
                    alt={link.related_member.name}
                  />
                )}
                <AvatarFallback className="text-[10px] font-medium bg-primary-50 text-primary-700">
                  {getInitials(link.related_member.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                  {link.related_member.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {RELATIONSHIP_LABELS[link.relationship] ?? link.relationship}
                </p>
              </div>
            </Link>

            {isLeadership && (
              <RemoveLinkButton
                memberId={member.id}
                relatedMemberId={link.related_member_id}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
