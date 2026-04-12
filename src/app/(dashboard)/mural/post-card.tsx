"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquare,
  Trash2,
  ChevronDown,
  ChevronUp,
  Flame,
  Pin,
  PinOff,
  HandHeart,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { deletePost, reactToPost, pinPost, unpinPost } from "@/actions/posts";
import type { PostRow } from "@/actions/posts";
import { CommentsSection } from "./comments-section";
import { TribeBadge } from "@/app/(dashboard)/gamificacao/tribe-badge";
import { TagChip } from "@/app/(dashboard)/membros/[id]/tags-editor";
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
  currentMemberId: string;
  currentUserRole: string;
  currentUserName: string;
  currentUserAvatar: string | null;
  onDeleted: (postId: string) => void;
  onPinChanged: (postId: string, pinnedUntil: string | null) => void;
}

interface ReactionState {
  orar: number;
  gratidao: number;
  userOrar: boolean;
  userGratidao: boolean;
}

function isPinnedNow(pinned_until: string | null): boolean {
  if (!pinned_until) return false;
  return new Date(pinned_until) > new Date();
}

export function PostCard({
  post,
  currentMemberId,
  currentUserRole,
  currentUserName,
  currentUserAvatar,
  onDeleted,
  onPinChanged,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentCount] = useState(post.comment_count);
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isPinPending, startPinTransition] = useTransition();

  const [reactions, setReactions] = useState<ReactionState>({
    orar: post.reaction_orar,
    gratidao: post.reaction_gratidao,
    userOrar: post.user_orar,
    userGratidao: post.user_gratidao,
  });

  const pinned = isPinnedNow(post.pinned_until);

  const canDelete =
    post.author_id === currentMemberId ||
    ["admin", "pastor"].includes(currentUserRole);

  const canPin = ["admin", "pastor", "presbítero"].includes(currentUserRole);

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
    startDeleteTransition(async () => {
      const result = await deletePost(post.id);
      if (!result || "code" in result || !result.data) {
        toast.error("Erro ao excluir post.");
        return;
      }
      toast.success("Post excluído.");
      onDeleted(post.id);
    });
  }

  function handleReact(type: "orar" | "gratidão") {
    const isOrar = type === "orar";
    const currentlyActive = isOrar
      ? reactions.userOrar
      : reactions.userGratidao;

    // Optimistic update imediato
    setReactions((prev) => ({
      orar: isOrar ? prev.orar + (currentlyActive ? -1 : 1) : prev.orar,
      gratidao: !isOrar
        ? prev.gratidao + (currentlyActive ? -1 : 1)
        : prev.gratidao,
      userOrar: isOrar ? !currentlyActive : prev.userOrar,
      userGratidao: !isOrar ? !currentlyActive : prev.userGratidao,
    }));

    reactToPost({ post_id: post.id, type }).then((result) => {
      if (!result || "code" in result || result.error) {
        // Revert em caso de erro
        setReactions((prev) => ({
          orar: isOrar ? prev.orar + (currentlyActive ? 1 : -1) : prev.orar,
          gratidao: !isOrar
            ? prev.gratidao + (currentlyActive ? 1 : -1)
            : prev.gratidao,
          userOrar: isOrar ? currentlyActive : prev.userOrar,
          userGratidao: !isOrar ? currentlyActive : prev.userGratidao,
        }));
        toast.error("Erro ao registrar reação.");
      }
    });
  }

  function handlePin() {
    startPinTransition(async () => {
      const pinnedUntil = addDays(new Date(), 7).toISOString();
      const result = await pinPost({
        post_id: post.id,
        pinned_until: pinnedUntil,
      });
      if (!result || "code" in result || !result.data) {
        toast.error("Erro ao fixar post.");
        return;
      }
      toast.success("Post fixado por 7 dias.");
      onPinChanged(post.id, pinnedUntil);
    });
  }

  function handleUnpin() {
    startPinTransition(async () => {
      const result = await unpinPost(post.id);
      if (!result || "code" in result || !result.data) {
        toast.error("Erro ao desafixar post.");
        return;
      }
      toast.success("Post desafixado.");
      onPinChanged(post.id, null);
    });
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, scale: 0.98 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border bg-card shadow-sm overflow-hidden",
        pinned
          ? "border-accent-300 dark:border-accent-700 ring-1 ring-accent-200 dark:ring-accent-800"
          : "border-border"
      )}
    >
      {/* Pinned banner */}
      <AnimatePresence>
        {pinned && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-accent-50 dark:bg-accent-900/20 border-b border-accent-200 dark:border-accent-800"
          >
            <Pin className="w-3 h-3 text-accent-600 dark:text-accent-400" />
            <span className="text-[11px] font-medium text-accent-700 dark:text-accent-300">
              Post fixado
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4">
        {/* Header: avatar + author + meta + actions */}
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
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide",
                  roleConfig.className
                )}
              >
                {roleConfig.label}
              </span>
              {/* Tribo */}
              {author?.team_name && author.team_color && (
                <TribeBadge
                  teamName={author.team_name}
                  teamColor={author.team_color}
                />
              )}
              {/* Tags */}
              {(author?.tags ?? []).map((tag) => (
                <TagChip key={tag} tag={tag} size="sm" />
              ))}
              {/* Streak */}
              {(author?.streak ?? 0) >= 3 && (
                <motion.span
                  animate={{ y: [0, -1, 0] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={cn(
                    "inline-flex items-center gap-0.5 text-[10px] font-bold",
                    (author?.streak ?? 0) >= 30
                      ? "text-orange-600 dark:text-orange-400"
                      : (author?.streak ?? 0) >= 7
                        ? "text-orange-500 dark:text-orange-400"
                        : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  <Flame className="w-3 h-3" />
                  <span>{author?.streak}</span>
                </motion.span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>

          {/* Header actions: pin/unpin + delete */}
          <div className="shrink-0 flex items-center gap-1">
            {canPin && (
              <button
                onClick={pinned ? handleUnpin : handlePin}
                disabled={isPinPending}
                className={cn(
                  "p-1 rounded-md transition-colors disabled:pointer-events-none disabled:opacity-40",
                  pinned
                    ? "text-accent-600 hover:text-accent-700 hover:bg-accent-50 dark:hover:bg-accent-900/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
                title={pinned ? "Desafixar post" : "Fixar post por 7 dias"}
              >
                {pinned ? (
                  <PinOff className="w-3.5 h-3.5" />
                ) : (
                  <Pin className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeletePending}
                className="p-1 rounded-md text-muted-foreground hover:text-error hover:bg-error/5 transition-colors disabled:pointer-events-none disabled:opacity-40"
                title="Excluir post"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
          {post.content}
        </p>
      </div>

      {/* Footer: reactions + comments */}
      <div className="px-4 pb-3 flex items-center gap-1 border-t border-border/50 pt-2.5">
        {/* Orar button */}
        <ReactionButton
          icon={<HandHeart className="w-3.5 h-3.5" />}
          label="Orar"
          count={reactions.orar}
          active={reactions.userOrar}
          activeClassName="text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400"
          onClick={() => handleReact("orar")}
        />

        {/* Gratidão button */}
        <ReactionButton
          icon={<Sparkles className="w-3.5 h-3.5" />}
          label="Gratidão"
          count={reactions.gratidao}
          active={reactions.userGratidao}
          activeClassName="text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
          onClick={() => handleReact("gratidão")}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Comments toggle */}
        <button
          onClick={() => setShowComments((prev) => !prev)}
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
                currentMemberId={currentMemberId}
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

// ─── ReactionButton ───────────────────────────────────────────────────────────

interface ReactionButtonProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  activeClassName: string;
  onClick: () => void;
}

function ReactionButton({
  icon,
  label,
  count,
  active,
  activeClassName,
  onClick,
}: ReactionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
        "transition-colors duration-150 select-none",
        active
          ? activeClassName
          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
      )}
    >
      <motion.span
        animate={active ? { scale: [1, 1.35, 1] } : { scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {icon}
      </motion.span>
      <span>{label}</span>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="tabular-nums"
        >
          {count}
        </motion.span>
      )}
    </motion.button>
  );
}
