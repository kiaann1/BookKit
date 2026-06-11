import type { Metadata } from "next";
import Link from "next/link";
import { ComposePost } from "@/components/social/compose-post";
import { FeedView } from "@/components/social/feed-view";
import { UserSearch } from "@/components/social/user-search";
import { PageHeader } from "@/components/layout/page-header";
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
    <FadeIn className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Feed"
        description="Posts from people you follow — reviews, thoughts, and reading updates."
      />

      <section className="space-y-2 rounded-2xl border border-border/80 bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Find readers</h2>
          <Link
            href="/people"
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            Browse all
          </Link>
        </div>
        <UserSearch variant="compact" />
      </section>

      <ComposePost />
      <FeedView initialPosts={feed.posts} initialCursor={feed.nextCursor} />
    </FadeIn>
  );
}
