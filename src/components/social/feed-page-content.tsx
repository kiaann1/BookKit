import { FeedComposerPrompt } from "@/components/social/feed-composer-prompt";
import { FeedView } from "@/components/social/feed-view";
import { getFeedPosts } from "@/lib/social/posts";

type FeedPageContentProps = {
  userId: string;
};

export async function FeedPageContent({ userId }: FeedPageContentProps) {
  const feed = await getFeedPosts(userId, { limit: 20 });

  return (
    <>
      <FeedComposerPrompt />
      <FeedView
        key={feed.posts.map((post) => post.id).join(",") || "empty"}
        initialPosts={feed.posts}
        initialCursor={feed.nextCursor}
        variant="timeline"
      />
    </>
  );
}
