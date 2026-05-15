"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Rss, LayoutList, Clock } from "lucide-react";
import { listFeedPosts } from "@/actions/posts";
import type { PostRow } from "@/actions/posts";
import { PostCard } from "@/app/(dashboard)/comunicacao/post-card";
import { FeedPostForm } from "./feed-post-form";
import { cn } from "@/lib/utils";

type SortBy = "relevance" | "recent";

interface HomeFeedProps {
  initialPosts: PostRow[];
  initialHasMore: boolean;
  initialNextCursor: { created_at: string; id: string } | null;
  currentMemberId: string;
  currentUserRole: string;
  currentUserName: string;
  currentUserAvatar: string | null;
}

const LIMIT = 10;

export function HomeFeed({
  initialPosts,
  initialHasMore,
  initialNextCursor,
  currentMemberId,
  currentUserRole,
  currentUserName,
  currentUserAvatar,
}: HomeFeedProps) {
  const [sortBy, setSortBy] = useState<SortBy>("relevance");
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  // cursor for 'recent'
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  // offset for 'relevance'
  const [offset, setOffset] = useState(initialPosts.length);

  const [isFetching, startTransition] = useTransition();
  const [isChangingSort, setIsChangingSort] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ─── Infinite scroll ──────────────────────────────────────────────────────

  const loadMore = useCallback(() => {
    if (!hasMore || isFetching || isChangingSort) return;

    startTransition(async () => {
      const input =
        sortBy === "recent"
          ? {
              sort_by: "recent" as const,
              cursor_created_at: nextCursor?.created_at,
              cursor_id: nextCursor?.id,
              limit: LIMIT,
            }
          : {
              sort_by: "relevance" as const,
              offset,
              limit: LIMIT,
            };

      const result = await listFeedPosts(input);
      if (!result || "code" in result || !result.data) return;

      const {
        posts: newPosts,
        hasMore: more,
        nextCursor: cursor,
      } = result.data;

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...newPosts.filter((p) => !existingIds.has(p.id))];
      });
      setHasMore(more);
      if (sortBy === "recent") {
        setNextCursor(cursor);
      } else {
        setOffset((prev) => prev + newPosts.length);
      }
    });
  }, [hasMore, isFetching, isChangingSort, sortBy, nextCursor, offset]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // ─── Sort change ──────────────────────────────────────────────────────────

  async function handleSortChange(newSort: SortBy) {
    if (newSort === sortBy || isChangingSort) return;

    setIsChangingSort(true);
    setSortBy(newSort);
    setPosts([]);
    setHasMore(false);
    setNextCursor(null);
    setOffset(0);

    startTransition(async () => {
      const input =
        newSort === "recent"
          ? { sort_by: "recent" as const, limit: LIMIT }
          : { sort_by: "relevance" as const, offset: 0, limit: LIMIT };

      const result = await listFeedPosts(input);
      setIsChangingSort(false);

      if (!result || "code" in result || !result.data) return;

      const {
        posts: newPosts,
        hasMore: more,
        nextCursor: cursor,
      } = result.data;
      setPosts(newPosts);
      setHasMore(more);
      if (newSort === "recent") {
        setNextCursor(cursor);
        setOffset(newPosts.length);
      } else {
        setNextCursor(null);
        setOffset(newPosts.length);
      }
    });
  }

  // ─── Post mutations ───────────────────────────────────────────────────────

  function handlePostCreated(post: PostRow) {
    setPosts((prev) => [post, ...prev]);
    setOffset((prev) => prev + 1);
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setOffset((prev) => Math.max(0, prev - 1));
  }

  function handlePinChanged(postId: string, pinnedUntil: string | null) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, pinned_until: pinnedUntil } : p
      )
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Sort toggle + compose */}
      <div className="flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-0.5 rounded-full bg-secondary p-0.5"
          role="group"
          aria-label="Ordenação do feed"
        >
          <SortButton
            active={sortBy === "relevance"}
            icon={<LayoutList className="w-3.5 h-3.5" />}
            label="Relevantes"
            onClick={() => handleSortChange("relevance")}
          />
          <SortButton
            active={sortBy === "recent"}
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Recentes"
            onClick={() => handleSortChange("recent")}
          />
        </div>
      </div>

      {/* Compose form — todos os membros */}
      <FeedPostForm
        authorName={currentUserName}
        authorAvatar={currentUserAvatar}
        userRole={currentUserRole}
        onCreated={handlePostCreated}
      />

      {/* Feed */}
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {isChangingSort ? (
            <FeedSkeleton key="skeleton" />
          ) : posts.length === 0 && !isFetching ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center"
            >
              <Rss className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum post ainda. Seja o primeiro!
              </p>
            </motion.div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentMemberId={currentMemberId}
                currentUserRole={currentUserRole}
                currentUserName={currentUserName}
                currentUserAvatar={currentUserAvatar}
                onDeleted={handlePostDeleted}
                onPinChanged={handlePinChanged}
                showChurchBadge={post.is_public === true}
              />
            ))
          )}
        </AnimatePresence>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />

        {/* Loading more */}
        <AnimatePresence>
          {isFetching && !isChangingSort && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-4"
            >
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/50" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* End of feed */}
        {!hasMore && posts.length > 0 && !isChangingSort && (
          <p className="text-center text-xs text-muted-foreground/40 py-4">
            Você está em dia com sua comunidade 🕊️
          </p>
        )}
      </div>
    </div>
  );
}

// ─── SortButton ───────────────────────────────────────────────────────────────

function SortButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── FeedSkeleton ─────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <motion.div
      key="feed-skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-3"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-muted animate-pulse" />
              <div className="h-2.5 w-20 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-4/5 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </motion.div>
  );
}
