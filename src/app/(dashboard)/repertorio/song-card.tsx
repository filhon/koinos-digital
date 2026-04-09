"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Music,
  Video,
  Guitar,
  MessageSquareQuote,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { deleteSong } from "@/actions/songs";
import type { SongWithGroup } from "@/actions/songs";

interface SongCardProps {
  song: SongWithGroup;
  canManage: boolean;
}

export function SongCard({ song, canManage }: SongCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSong(song.id);

      if (!result || "code" in result) {
        toast.error("code" in result ? result.error : "Erro inesperado");
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Música removida do repertório");
      setIsDeleted(true);
    });
  };

  if (isDeleted) return null;

  const hasLinks = song.chord_url || song.youtube_url;
  const hasContent = song.lyrics || song.central_message || hasLinks;

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden transition-shadow duration-150",
        expanded && "shadow-sm"
      )}
    >
      {/* Header sempre visível */}
      <div className="flex items-start gap-3 px-5 py-4">
        {/* Ícone musical */}
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 mt-0.5">
          <Music className="size-4 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug truncate">
            {song.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {song.artist}
          </p>
          {song.music_group && (
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              {song.music_group.name}
            </p>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 shrink-0">
          {canManage && !showDeleteConfirm && (
            <>
              <Link
                href={`/repertorio/${song.id}/editar`}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Editar música"
              >
                <Pencil className="size-3.5" />
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Remover música"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          )}

          {canManage && showDeleteConfirm && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-2 py-1 text-[10px] font-medium text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  "Confirmar"
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="px-2 py-1 text-[10px] font-medium text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          )}

          {hasContent && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={expanded ? "Recolher" : "Expandir"}
            >
              {expanded ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo expandido */}
      <AnimatePresence initial={false}>
        {expanded && hasContent && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border/60 pt-4">
              {/* Mensagem central */}
              {song.central_message && (
                <div className="flex gap-2.5">
                  <MessageSquareQuote className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
                      Mensagem central
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {song.central_message}
                    </p>
                  </div>
                </div>
              )}

              {/* Links */}
              {hasLinks && (
                <div className="flex flex-wrap gap-2">
                  {song.youtube_url && (
                    <a
                      href={song.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <Video className="size-3.5" />
                      YouTube
                    </a>
                  )}
                  {song.chord_url && (
                    <a
                      href={song.chord_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                      <Guitar className="size-3.5" />
                      Cifra
                    </a>
                  )}
                </div>
              )}

              {/* Letra */}
              {song.lyrics && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Letra
                  </p>
                  <pre className="text-xs text-foreground/80 leading-relaxed font-sans whitespace-pre-wrap bg-muted/40 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {song.lyrics}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
