import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { RecommendationSection } from "@/components/recommendations/recommendation-section";
import { Button } from "@/components/ui/button";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getRecommendationFeed } from "@/lib/recommendations";

export const metadata: Metadata = {
  title: "Discover",
};

export default async function RecommendationsPage() {
  await requireCompletedOnboarding();
  const user = await getAuthenticatedUser();
  const feed = user
    ? await getRecommendationFeed(user.userId)
    : {
        forYou: [],
        newInYourGenres: [],
        hasGenrePreferences: false,
      };

  return (
    <FadeIn className="mx-auto max-w-6xl space-y-10 px-4 py-5 sm:px-6 sm:py-10">
      <PageHeader
        title="Discover"
        description="Books picked for you based on your genres and reading history."
      />

      {!feed.hasGenrePreferences ? (
        <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-8 text-center">
          <p className="font-medium">Set your genre preferences</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us what you like to read and we&apos;ll tailor these picks.
          </p>
          <Link href="/settings" className="mt-4 inline-block">
            <Button>Open settings</Button>
          </Link>
        </div>
      ) : null}

      <RecommendationSection
        title="Recommended for you"
        description="Unread books matched to your favorite genres."
        books={feed.forYou}
        emptyMessage="You've caught up on everything we can suggest right now. Browse the catalog for more."
        settingsHref="/settings"
      />

      <RecommendationSection
        title="New in your genres"
        description="Recently added titles that match what you like to read."
        books={feed.newInYourGenres}
        emptyMessage="No new releases in your genres yet — check back after the next upload."
      />
    </FadeIn>
  );
}
