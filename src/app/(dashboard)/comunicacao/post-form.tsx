"use client";

import { useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { createPostSchema, type CreatePostInput } from "@/lib/validators/posts";
import { createPost } from "@/actions/posts";
import type { PostRow } from "@/actions/posts";
import { cn } from "@/lib/utils";

interface PostFormProps {
  authorName: string;
  authorAvatar: string | null;
  onCreated: (post: PostRow) => void;
}

const MAX_CHARS = 2000;

export function PostForm({
  authorName,
  authorAvatar,
  onCreated,
}: PostFormProps) {
  const [focused, setFocused] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { content: "" },
  });

  const content = useWatch({ control, name: "content" }) ?? "";
  const remaining = MAX_CHARS - content.length;
  const isNearLimit = remaining <= 200;
  const isOverLimit = remaining < 0;

  // Auto-resize textarea
  const { ref: rhfRef, ...rest } = register("content");

  function handleRef(el: HTMLTextAreaElement | null) {
    rhfRef(el);
    textareaRef.current = el;
  }

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.style.minHeight || "80px"}`;
    el.style.height = `${Math.max(80, el.scrollHeight)}px`;
  }

  function onSubmit(data: CreatePostInput) {
    startTransition(async () => {
      try {
        const result = await createPost(data);

        if (!result || "code" in result) {
          toast.error(
            "code" in (result ?? {})
              ? "Sem permissão para publicar."
              : "Erro ao publicar."
          );
          return;
        }
        if (!result.data) {
          toast.error(result.error ?? "Erro ao publicar.");
          return;
        }

        toast.success("Post publicado!");
        onCreated(result.data.post);
        reset();
        if (textareaRef.current) {
          textareaRef.current.style.height = "80px";
        }
        setFocused(false);
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
              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-semibold ring-2 ring-border">
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
              <p className="text-xs text-error mt-1">
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
              <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-border/60">
                {/* Char counter */}
                <span
                  className={cn(
                    "text-xs tabular-nums transition-colors duration-200",
                    isOverLimit
                      ? "text-error font-semibold"
                      : isNearLimit
                        ? "text-warning"
                        : "text-muted-foreground/60"
                  )}
                >
                  {remaining.toLocaleString("pt-BR")}
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      reset();
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
                      "bg-primary-600 text-white hover:bg-primary-700",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all duration-200"
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Publicar
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
