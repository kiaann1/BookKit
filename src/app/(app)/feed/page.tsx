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
      <header className="sticky top-14 z-20 -mx-4 border-b border-border/70 bg-background/95 px-4 py-3.5 backdrop-blur-xl safe-top sm:mx-0 sm:rounded-t-2xl">
        <h1 className="font-display text-xl font-semibold tracking-tight">
          Feed
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Posts from readers you follow
        </p>
      </header>

      <div className="pt-4">
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
