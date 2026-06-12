import Link from "next/link";
import { RecommendationSection } from "@/components/recommendations/recommendation-section";
import { Button } from "@/components/ui/button";
import { getRecommendationFeed } from "@/lib/recommendations";

type RecommendationsPageContentProps = {
  userId: string;
};

export async function RecommendationsPageContent({
  userId,
}: RecommendationsPageContentProps) {
  const feed = await getRecommendationFeed(userId);

  return (
    <>
      {!feed.hasGenrePreferences ? (
        <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-5 py-6 text-center sm:px-6 sm:py-8">
          <p className="font-medium">Set your genre preferences</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tell us what you like to read and we&apos;ll tailor these picks.
          </p>
          <Link href="/settings" className="mt-4 inline-block">
            <Button size="sm">Open settings</Button>
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
    </>
  );
}
