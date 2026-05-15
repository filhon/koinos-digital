"use client";

import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion } from "framer-motion";
import { Loader2, Rss } from "lucide-react";
import { listPosts } from "@/actions/posts";
import type { PostRow } from "@/actions/posts";
import { PostForm } from "./post-form";
import { PostCard } from "./post-card";

interface MuralFeedProps {
  initialPosts: PostRow[];
  initialHasMore: boolean;
  currentMemberId: string;
  currentUserRole: string;
  currentUserName: string;
  currentUserAvatar: string | null;
}

const LIMIT = 10;

export function MuralFeed({
  initialPosts,
  initialHasMore,
  currentMemberId,
  currentUserRole,
  currentUserName,
  currentUserAvatar,
}: MuralFeedProps) {
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [offset, setOffset] = useState(initialPosts.length);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isFetching, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  const loadMore = useCallback(() => {
    if (!hasMore || isFetching) return;

    startTransition(async () => {
      const result = await listPosts({ offset, limit: LIMIT });

      if (!result || "code" in result || !result.data) return;

      const newPosts = result.data.posts;
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...newPosts.filter((p) => !existingIds.has(p.id))];
      });
      setOffset((prev) => prev + newPosts.length);
      setHasMore(result.data.hasMore);
    });
  }, [hasMore, isFetching, offset]);

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

  const handlePostCreated = useCallback((post: PostRow) => {
    setPosts((prev) => [post, ...prev]);
    setOffset((prev) => prev + 1);
  }, []);

  const handlePostDeleted = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setOffset((prev) => Math.max(0, prev - 1));
  }, []);

  const handlePinChanged = useCallback(
    (postId: string, pinnedUntil: string | null) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, pinned_until: pinnedUntil } : p
        )
      );
    },
    []
  );

  const canCreate = [
    "admin",
    "pastor",
    "presbítero",
    "diácono",
    "líder",
  ].includes(currentUserRole);

  // eslint-disable-next-line
  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 280,
    overscan: 3,
    gap: 12,
  });

  // Trigger loadMore when last virtual item is near
  const virtualItems = virtualizer.getVirtualItems();
  const lastItem = virtualItems[virtualItems.length - 1];

  useEffect(() => {
    if (!lastItem) return;
    if (lastItem.index >= posts.length - 3 && hasMore && !isFetching) {
      loadMore();
    }
  }, [lastItem, posts.length, hasMore, isFetching, loadMore]);

  return (
    <div className="flex flex-col gap-4">
      {/* Compose form — restrito à liderança */}
      {canCreate && (
        <PostForm
          authorName={currentUserName}
          authorAvatar={currentUserAvatar}
          onCreated={handlePostCreated}
        />
      )}

      {/* Feed */}
      {posts.length === 0 && !isFetching ? (
        <motion.div
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
        <div
          ref={scrollRef}
          className="overflow-auto"
          style={{ maxHeight: "calc(100vh - 220px)" }}
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              position: "relative",
              width: "100%",
            }}
          >
            {virtualItems.map((virtualRow) => {
              const post = posts[virtualRow.index];
              return (
                <div
                  key={post.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <PostCard
                    post={post}
                    currentMemberId={currentMemberId}
                    currentUserRole={currentUserRole}
                    currentUserName={currentUserName}
                    currentUserAvatar={currentUserAvatar}
                    onDeleted={handlePostDeleted}
                    onPinChanged={handlePinChanged}
                  />
                </div>
              );
            })}
          </div>

          {/* Loading more indicator */}
          {isFetching && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/50" />
            </div>
          )}

          {/* End of feed */}
          {!hasMore && posts.length > 0 && (
            <p className="text-center text-xs text-muted-foreground/40 py-4">
              Você chegou ao fim da Comunicação.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
