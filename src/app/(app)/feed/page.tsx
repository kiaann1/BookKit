import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedTimelineSkeleton } from "@/components/layout/app-page-skeletons";
import { FeedPageContent } from "@/components/social/feed-page-content";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session-user";

export const metadata: Metadata = {
  title: "Feed",
};

export default async function FeedPage() {
  await requireCompletedOnboarding();
  const user = await getAuthenticatedUser();

  return (
    <div className="page-enter mx-auto w-full max-w-xl">
      <header className="-mx-4 border-b border-border/70 px-4 py-3.5 sm:mx-0">
        <h1 className="font-display text-xl font-semibold tracking-tight">
          Feed
        </h1>
      </header>

      <div>
        {user ? (
          <Suspense fallback={<FeedTimelineSkeleton />}>
            <FeedPageContent userId={user.userId} />
          </Suspense>
        ) : (
          <p className="px-1 text-sm text-muted-foreground">
            Sign in to see your feed.
          </p>
        )}
      </div>
    </div>
  );
}
