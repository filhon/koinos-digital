"use client";

import { useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Building2, User } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { z } from "zod";
import { createFeedPost } from "@/actions/posts";
import type { PostRow } from "@/actions/posts";
import { cn } from "@/lib/utils";

// Schema apenas com content — is_public é gerenciado via state separado
const feedFormSchema = z.object({
  content: z
    .string()
    .min(1, "O post não pode estar vazio.")
    .max(2000, "O post deve ter no máximo 2000 caracteres."),
});
type FeedFormValues = z.infer<typeof feedFormSchema>;

interface FeedPostFormProps {
  authorName: string;
  authorAvatar: string | null;
  userRole: string;
  onCreated: (post: PostRow) => void;
}

const MAX_CHARS = 2000;

const CAN_PUBLISH_AS_CHURCH = ["admin", "pastor", "presbítero"];

export function FeedPostForm({
  authorName,
  authorAvatar,
  userRole,
  onCreated,
}: FeedPostFormProps) {
  const [focused, setFocused] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const canPublishAsChurch = CAN_PUBLISH_AS_CHURCH.includes(userRole);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FeedFormValues>({
    resolver: zodResolver(feedFormSchema),
    defaultValues: { content: "" },
  });

  const content = useWatch({ control, name: "content" }) ?? "";
  const remaining = MAX_CHARS - content.length;
  const isNearLimit = remaining <= 200;
  const isOverLimit = remaining < 0;

  const { ref: rhfRef, ...rest } = register("content");

  function handleRef(el: HTMLTextAreaElement | null) {
    rhfRef(el);
    textareaRef.current = el;
  }

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(80, el.scrollHeight)}px`;
  }

  function onSubmit(data: FeedFormValues) {
    startTransition(async () => {
      try {
        const result = await createFeedPost({ ...data, is_public: isPublic });

        if (!result || "code" in result) {
          toast.error("Sem permissão para publicar.");
          return;
        }
        if (!result.data) {
          toast.error(result.error ?? "Erro ao publicar.");
          return;
        }

        toast.success(isPublic ? "Publicado pela Igreja!" : "Post publicado!");
        onCreated(result.data.post);
        reset();
        setIsPublic(false);
        setFocused(false);
        if (textareaRef.current) textareaRef.current.style.height = "80px";
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erro inesperado ao publicar."
        );
      }
    });
  }

  const initials = authorName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <form onSubmit={(e) => handleSubmit(onSubmit)(e)}>
        <div className="flex gap-3 p-4">
          {/* Avatar */}
          <div className="shrink-0">
            {authorAvatar ? (
              <Image
                src={authorAvatar}
                alt={authorName}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-border"
                unoptimized
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold ring-2 ring-border">
                {initials}
              </div>
            )}
          </div>

          {/* Textarea */}
          <div className="flex-1 min-w-0">
            <textarea
              {...rest}
              ref={handleRef}
              placeholder="Compartilhe algo com a comunidade…"
              rows={3}
              onFocus={() => setFocused(true)}
              onInput={autoResize}
              className={cn(
                "w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60",
                "outline-none leading-relaxed min-h-20",
                "transition-colors duration-200"
              )}
            />
            {errors.content && (
              <p className="text-xs text-destructive mt-1">
                {errors.content.message}
              </p>
            )}
          </div>
        </div>

        {/* Actions bar */}
        <AnimatePresence>
          {focused && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-border/60 gap-3">
                {/* "Publicar como" toggle — apenas pastor/presbítero */}
                {canPublishAsChurch ? (
                  <div className="flex items-center gap-1 rounded-full bg-secondary p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsPublic(false)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200",
                        !isPublic
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <User className="w-3 h-3" />
                      Você
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublic(true)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200",
                        isPublic
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Building2 className="w-3 h-3" />
                      Igreja
                    </button>
                  </div>
                ) : (
                  /* Char counter when no toggle */
                  <span
                    className={cn(
                      "text-xs tabular-nums transition-colors duration-200",
                      isOverLimit
                        ? "text-destructive font-semibold"
                        : isNearLimit
                          ? "text-warning"
                          : "text-muted-foreground/60"
                    )}
                  >
                    {remaining.toLocaleString("pt-BR")}
                  </span>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  {/* Char counter when toggle is present */}
                  {canPublishAsChurch && (
                    <span
                      className={cn(
                        "text-xs tabular-nums transition-colors duration-200",
                        isOverLimit
                          ? "text-destructive font-semibold"
                          : isNearLimit
                            ? "text-warning"
                            : "text-muted-foreground/60"
                      )}
                    >
                      {remaining.toLocaleString("pt-BR")}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setIsPublic(false);
                      setFocused(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || isOverLimit || !content.trim()}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium",
                      isPublic
                        ? "bg-primary text-primary-foreground hover:brightness-90"
                        : "bg-primary/90 text-primary-foreground hover:bg-primary",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all duration-200"
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {isPublic ? "Publicar pela Igreja" : "Publicar"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
