"use client";

import { useEffect, useState } from "react";
import { PostCard } from "@/components/social/post-card";
import { Button } from "@/components/ui/button";
import type { PostItem } from "@/lib/social/types";

type FeedViewProps = {
  initialPosts: PostItem[];
  initialCursor: string | null;
  endpoint?: string;
  variant?: "cards" | "timeline";
};

export function FeedView({
  initialPosts,
  initialCursor,
  endpoint = "/api/posts",
  variant = "cards",
}: FeedViewProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPosts(initialPosts);
    setCursor(initialCursor);
  }, [initialPosts, initialCursor]);

  async function loadMore() {
    if (!cursor || loading) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${endpoint}?cursor=${encodeURIComponent(cursor)}`,
      );
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        posts: PostItem[];
        nextCursor: string | null;
      };

      setPosts((current) => [...current, ...data.posts]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  if (posts.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-medium">Nothing here yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          When readers share posts, they&apos;ll show up here.
        </p>
      </div>
    );
  }

  if (variant === "timeline") {
    return (
      <div role="feed" aria-label="Posts">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} variant="timeline" />
        ))}

        {cursor ? (
          <div className="flex justify-center border-t border-border/80 py-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => void loadMore()}
            >
              {loading ? "Loading…" : "Show more"}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4" role="feed" aria-label="Posts">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {cursor ? (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void loadMore()}
          >
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
