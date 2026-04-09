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
  initialNextCursor: string | null;
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string;
  currentUserAvatar: string | null;
}

const LIMIT = 10;

export function MuralFeed({
  initialPosts,
  initialNextCursor,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserAvatar,
}: MuralFeedProps) {
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialNextCursor
  );
  const [isFetching, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = nextCursor !== null;

  // Infinite scroll via IntersectionObserver
  const loadMore = useCallback(() => {
    if (!hasMore || isFetching) return;

    startTransition(async () => {
      const result = await listPosts({
        cursor: nextCursor ?? undefined,
        limit: LIMIT,
      });

      if (!result || "code" in result || !result.data) return;

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newPosts = result.data!.posts.filter(
          (p) => !existingIds.has(p.id)
        );
        return [...prev, ...newPosts];
      });
      setNextCursor(result.data.nextCursor);
    });
  }, [hasMore, isFetching, nextCursor]);

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
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Compose form */}
      <PostForm
        authorName={currentUserName}
        authorAvatar={currentUserAvatar}
        onCreated={handlePostCreated}
      />

      {/* Feed */}
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
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              currentUserName={currentUserName}
              currentUserAvatar={currentUserAvatar}
              onDeleted={handlePostDeleted}
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
  );
}
