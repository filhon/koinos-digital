"use client";

import { useState, useTransition } from "react";
import { BookOpen, Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createLiturgy } from "@/actions/liturgy";
import { Button } from "@/components/ui/button";
import { LiturgyEditor } from "./liturgy-editor";
import { LiturgyViewer } from "./liturgy-viewer";
import type { LiturgyRow } from "@/lib/validators/liturgy";

interface LiturgyTabProps {
  initialLiturgy: LiturgyRow | null;
  eventId: string;
  canEdit: boolean;
  isResponsible?: boolean;
  currentMemberId?: string;
}

export function LiturgyTab({
  initialLiturgy,
  eventId,
  canEdit,
  isResponsible = false,
  currentMemberId,
}: LiturgyTabProps) {
  const [liturgy, setLiturgy] = useState<LiturgyRow | null>(initialLiturgy);
  const [isCreating, startCreate] = useTransition();

  function handleCreateLiturgy() {
    startCreate(async () => {
      const result = await createLiturgy({ event_id: eventId });
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if (result && "data" in result && result.data) {
        setLiturgy(result.data);
        toast.success("Liturgia criada com 11 itens padrão.");
      }
    });
  }

  // No liturgy yet
  if (!liturgy) {
    if (!canEdit) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <BookOpen className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Sem liturgia</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              O responsável pelo evento ainda não criou a liturgia.
            </p>
          </div>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-border bg-card/50 py-14 text-center"
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <BookOpen className="size-7 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Criar liturgia
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
            Gera um esqueleto com 11 itens padrão de um culto evangélico. Você
            pode editar, reordenar e adicionar itens.
          </p>
        </div>
        <Button onClick={handleCreateLiturgy} disabled={isCreating} size="sm">
          {isCreating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Adicionar liturgia
        </Button>
      </motion.div>
    );
  }

  // Liturgy exists
  return (
    <div className="space-y-4">
      {canEdit ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Arraste para reordenar · Clique no título para editar
            </p>
          </div>
          <LiturgyEditor
            liturgy={liturgy}
            eventId={eventId}
            isResponsible={isResponsible}
            currentMemberId={currentMemberId}
          />
        </>
      ) : (
        <LiturgyViewer liturgy={liturgy} />
      )}
    </div>
  );
}
