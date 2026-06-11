import Link from "next/link";
import { RecommendationRow } from "@/components/recommendations/recommendation-section";
import { getRecommendationFeed } from "@/lib/recommendations";

type RecommendationWidgetsProps = {
  userId: string;
};

export async function RecommendationWidgets({
  userId,
}: RecommendationWidgetsProps) {
  const feed = await getRecommendationFeed(userId);

  return (
    <div className="space-y-8">
      <RecommendationRow
        title="Recommended for you"
        description={
          feed.hasGenrePreferences
            ? "Unread picks based on your genres."
            : "Recently added books from the library."
        }
        books={feed.forYou}
        href="/recommendations"
      />

      {feed.hasGenrePreferences ? (
        <RecommendationRow
          title="New in your genres"
          description="Fresh additions that match your taste."
          books={feed.newInYourGenres}
          href="/recommendations"
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-border/80 px-5 py-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Personalize your picks</p>
          <p className="mt-1">
            Add genre preferences in{" "}
            <Link
              href="/settings"
              className="text-primary underline-offset-4 hover:underline"
            >
              Settings
            </Link>{" "}
            to unlock tailored recommendations.
          </p>
        </div>
      )}
    </div>
  );
}
