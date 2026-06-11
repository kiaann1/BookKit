"use client";

import { useState } from "react";
import { PostCard } from "@/components/social/post-card";
import { Button } from "@/components/ui/button";
import type { PostItem } from "@/lib/social/types";

type FeedViewProps = {
  initialPosts: PostItem[];
  initialCursor: string | null;
  endpoint?: string;
};

export function FeedView({
  initialPosts,
  initialCursor,
  endpoint = "/api/posts",
}: FeedViewProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

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
      <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-12 text-center">
        <p className="font-medium">Your feed is quiet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Follow readers and post about a book to see activity here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
