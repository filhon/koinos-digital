"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquare,
  Trash2,
  ChevronDown,
  ChevronUp,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { deletePost } from "@/actions/posts";
import type { PostRow } from "@/actions/posts";
import { CommentsSection } from "./comments-section";
import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  admin: {
    label: "Admin",
    className: "bg-primary/10 text-primary-700 dark:text-primary-300",
  },
  pastor: {
    label: "Pastor",
    className:
      "bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-300",
  },
  presbítero: {
    label: "Presbítero",
    className:
      "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
  },
  diácono: {
    label: "Diácono",
    className:
      "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400",
  },
  tesoureiro: {
    label: "Tesoureiro",
    className:
      "bg-success-light text-success-dark dark:bg-success-dark/20 dark:text-success",
  },
  líder: { label: "Líder", className: "bg-muted text-foreground/70" },
  membro: { label: "Membro", className: "bg-muted text-muted-foreground" },
  visitante: {
    label: "Visitante",
    className: "bg-muted/60 text-muted-foreground/70",
  },
};

interface PostCardProps {
  post: PostRow;
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string;
  currentUserAvatar: string | null;
  onDeleted: (postId: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserAvatar,
  onDeleted,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentCount] = useState(post.comment_count);
  const [isPending, startTransition] = useTransition();

  const canDelete =
    post.author_id === currentUserId ||
    ["admin", "pastor"].includes(currentUserRole);

  const author = post.author;
  const initials = (author?.name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  const roleConfig =
    ROLE_CONFIG[author?.role ?? ""] ?? ROLE_CONFIG["visitante"];

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePost(post.id);
      if (!result || "code" in result || !result.data) {
        toast.error("Erro ao excluir post.");
        return;
      }
      toast.success("Post excluído.");
      onDeleted(post.id);
    });
  }

  function handleToggleComments() {
    setShowComments((prev) => !prev);
  }

  // Update comment count when a comment is added (CommentsSection calls this via parent)
  // We track via the CommentsSection component directly — when it mounts, the real list is fetched.
  // For optimistic count on create: increment via callback passed below.

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, scale: 0.98 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
    >
      <div className="p-4">
        {/* Header: avatar + author + meta */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="shrink-0">
            {author?.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={author.name}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
                unoptimized
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-semibold ring-2 ring-border">
                {initials}
              </div>
            )}
          </div>

          {/* Author info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-sm font-semibold text-foreground truncate">
                {author?.name ?? "Membro"}
              </span>
              {/* Role badge */}
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide",
                  roleConfig.className
                )}
              >
                {roleConfig.label}
              </span>
              {/* Streak placeholder */}
              <span className="inline-flex items-center gap-0.5 text-[10px] text-accent-600 dark:text-accent-400 font-medium">
                <Flame className="w-3 h-3" />
                <span>— dias</span>
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>

          {/* Delete action */}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="shrink-0 text-muted-foreground hover:text-error transition-colors disabled:pointer-events-none disabled:opacity-40"
              title="Excluir post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
          {post.content}
        </p>
      </div>

      {/* Footer: actions */}
      <div className="px-4 pb-3 flex items-center gap-1 border-t border-border/50 pt-2.5">
        <button
          onClick={handleToggleComments}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
            "text-muted-foreground hover:text-foreground hover:bg-muted/80",
            "transition-colors duration-150",
            showComments &&
              "text-primary-600 bg-primary-50 dark:bg-primary-900/20"
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {commentCount > 0 ? commentCount : "Comentar"}
          {showComments ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="px-4 pb-4 pt-3">
              <CommentsSection
                postId={post.id}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                currentUserName={currentUserName}
                currentUserAvatar={currentUserAvatar}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
