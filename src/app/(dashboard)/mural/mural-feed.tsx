"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  return (
    <div className="flex flex-col gap-4">
      {/* Compose form */}
      <PostForm
        authorName={currentUserName}
        authorAvatar={currentUserAvatar}
        onCreated={handlePostCreated}
      />

      {/* Feed */}
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {posts.length === 0 && !isFetching ? (
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
              />
            ))
          )}
        </AnimatePresence>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />

        {/* Loading more indicator */}
        <AnimatePresence>
          {isFetching && (
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
        {!hasMore && posts.length > 0 && (
          <p className="text-center text-xs text-muted-foreground/40 py-4">
            Você chegou ao fim do mural.
          </p>
        )}
      </div>
    </div>
  );
}
