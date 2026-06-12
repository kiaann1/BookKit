import type { Metadata } from "next";
import { Suspense } from "react";
import { RecommendationsBodySkeleton } from "@/components/layout/app-page-skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { RecommendationsPageContent } from "@/components/recommendations/recommendations-page-content";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session-user";

export const metadata: Metadata = {
  title: "Discover",
};

export default async function RecommendationsPage() {
  await requireCompletedOnboarding();
  const user = await getAuthenticatedUser();

  return (
    <PageShell>
      <PageHeader
        title="Discover"
        description="Books picked for you based on your genres and reading history."
      />

      {user ? (
        <Suspense fallback={<RecommendationsBodySkeleton />}>
          <RecommendationsPageContent userId={user.userId} />
        </Suspense>
      ) : null}
    </PageShell>
  );
}
