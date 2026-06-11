import type { Metadata } from "next";
import { Suspense } from "react";
import { ContinueReadingCard } from "@/components/dashboard/continue-reading-card";
import { ContinueReadingSection } from "@/components/dashboard/continue-reading-section";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { FriendsActivityWidgets } from "@/components/dashboard/friends-activity-widgets";
import { RecommendationWidgets } from "@/components/dashboard/recommendation-widgets";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  await requireCompletedOnboarding();
  const user = await getAuthenticatedUser();

  return (
    <div className="page-stack flex flex-col">
      <FadeIn>
        <PageHeader
          title={
            user?.session.user.username
              ? `Hi, @${user.session.user.username}`
              : "Dashboard"
          }
          description="Pick up where you left off, see what friends are up to, or explore something new."
        />
      </FadeIn>

      {user ? (
        <Suspense fallback={<ContinueReadingSkeleton />}>
          <ContinueReadingSection userId={user.userId} />
        </Suspense>
      ) : (
        <ContinueReadingCard book={null} />
      )}

      {user ? (
        <Suspense fallback={<SectionSkeleton />}>
          <FriendsActivityWidgets userId={user.userId} />
        </Suspense>
      ) : null}

      {user ? (
        <Suspense fallback={<SectionSkeleton />}>
          <RecommendationWidgets userId={user.userId} />
        </Suspense>
      ) : null}

      <DashboardCards />
    </div>
  );
}

function ContinueReadingSkeleton() {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 sm:rounded-2xl sm:p-6">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-3 h-4 w-48" />
      <Skeleton className="mt-6 h-32 w-full rounded-xl" />
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}
