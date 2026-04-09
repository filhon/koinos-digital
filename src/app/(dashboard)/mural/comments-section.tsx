"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  createCommentSchema,
  type CreateCommentInput,
} from "@/lib/validators/posts";
import { listComments, createComment, deleteComment } from "@/actions/posts";
import type { CommentRow } from "@/actions/posts";
import { cn } from "@/lib/utils";

interface CommentsSectionProps {
  postId: string;
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string;
  currentUserAvatar: string | null;
}

export function CommentsSection({
  postId,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserAvatar,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<{ post_id: string; content: string }>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { post_id: postId, content: "" },
  });

  const content = useWatch({ control, name: "content" }) ?? "";
  const MAX = 500;
  const remaining = MAX - content.length;

  useEffect(() => {
    if (!loaded) {
      listComments(postId).then((result) => {
        setIsLoading(false);
        setLoaded(true);
        if (result && "data" in result && result.data) {
          setComments(result.data.comments);
        }
      });
    }
  }, [loaded, postId]);

  function onSubmit(data: CreateCommentInput) {
    startTransition(async () => {
      const result = await createComment(data);
      if (!result || "code" in result) {
        toast.error("Sem permissão.");
        return;
      }
      if (!result.data) {
        toast.error(result.error ?? "Erro ao comentar.");
        return;
      }
      setComments((prev) => [...prev, result.data!.comment]);
      reset({ post_id: postId, content: "" });
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      const result = await deleteComment(commentId);
      if (!result || "code" in result || !result.data) {
        toast.error("Erro ao excluir comentário.");
        return;
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comentário excluído.");
    });
  }

  const isPastor = ["admin", "pastor"].includes(currentUserRole);

  const initials = currentUserName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mt-3 space-y-3">
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Comments list */}
      <AnimatePresence initial={false}>
        {comments.map((comment) => {
          const canDelete = comment.author_id === currentUserId || isPastor;
          const commentInitials = (comment.author?.name ?? "?")
            .split(" ")
            .slice(0, 2)
            .map((w: string) => w[0])
            .join("")
            .toUpperCase();

          return (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="flex gap-2.5 group"
            >
              {/* Avatar */}
              <div className="shrink-0 mt-0.5">
                {comment.author?.avatar_url ? (
                  <Image
                    src={comment.author.avatar_url}
                    alt={comment.author.name}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
                    unoptimized
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[9px] font-semibold ring-1 ring-border">
                    {commentInitials}
                  </div>
                )}
              </div>

              {/* Bubble */}
              <div className="flex-1 min-w-0">
                <div className="bg-muted/60 rounded-xl rounded-tl-sm px-3 py-2">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {comment.author?.name ?? "Membro"}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed break-words">
                    {comment.content}
                  </p>
                </div>
              </div>

              {/* Delete */}
              {canDelete && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={isPending}
                  className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-error disabled:pointer-events-none"
                  title="Excluir comentário"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty state */}
      {loaded && comments.length === 0 && (
        <p className="text-xs text-muted-foreground/60 text-center py-2">
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      )}

      {/* Comment input */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2.5 pt-1">
        {/* Avatar */}
        <div className="shrink-0">
          {currentUserAvatar ? (
            <Image
              src={currentUserAvatar}
              alt={currentUserName}
              width={28}
              height={28}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
              unoptimized
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-[9px] font-semibold ring-1 ring-border">
              {initials}
            </div>
          )}
        </div>

        {/* Input row */}
        <div className="flex-1 min-w-0">
          <div className="flex items-end gap-2 bg-muted/60 rounded-xl rounded-tl-sm px-3 py-2">
            <input type="hidden" {...register("post_id")} />
            <textarea
              {...register("content")}
              ref={(el) => {
                register("content").ref(el);
                inputRef.current = el;
              }}
              placeholder="Escreva um comentário…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none leading-relaxed min-h-[20px] max-h-[120px]"
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(onSubmit)();
                }
              }}
            />
            <button
              type="submit"
              disabled={isPending || !content.trim() || remaining < 0}
              className={cn(
                "shrink-0 text-primary-600 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed",
                "transition-colors duration-200"
              )}
              title="Enviar (Enter)"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.content && (
            <p className="text-[10px] text-error mt-1 pl-1">
              {errors.content.message}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/50 mt-0.5 pl-1 tabular-nums">
            Enter para enviar · Shift+Enter para nova linha · {remaining}{" "}
            restantes
          </p>
        </div>
      </form>
    </div>
  );
}
