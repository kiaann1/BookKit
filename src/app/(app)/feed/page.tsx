import type { Metadata } from "next";
import Link from "next/link";
import { FeedComposerPrompt } from "@/components/social/feed-composer-prompt";
import { FeedView } from "@/components/social/feed-view";
import { FadeIn } from "@/components/motion/fade-in";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getFeedPosts } from "@/lib/social/posts";

export const metadata: Metadata = {
  title: "Feed",
};

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  await requireCompletedOnboarding();
  const user = await getAuthenticatedUser();
  const feed = user
    ? await getFeedPosts(user.userId, { limit: 20 })
    : { posts: [], nextCursor: null };

  return (
    <FadeIn className="mx-auto min-h-full max-w-xl">
      <header className="sticky top-14 z-20 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur-xl safe-top">
        <h1 className="font-display text-lg font-semibold tracking-tight">
          Feed
        </h1>
        <p className="text-xs text-muted-foreground">
          Public posts from the community
        </p>
      </header>

      <FeedComposerPrompt />

      <FeedView
        key={feed.posts.map((post) => post.id).join(",") || "empty"}
        initialPosts={feed.posts}
        initialCursor={feed.nextCursor}
        variant="timeline"
      />
    </FadeIn>
  );
}
