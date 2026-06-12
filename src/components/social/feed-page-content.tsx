import { FeedTabs } from "@/components/social/feed-tabs";
import { getFeedPosts, getFollowingFeedPosts } from "@/lib/social/posts";

type FeedPageContentProps = {
  userId: string;
};

export async function FeedPageContent({ userId }: FeedPageContentProps) {
  const [followingInitial, forYouInitial] = await Promise.all([
    getFollowingFeedPosts(userId, { limit: 20 }),
    getFeedPosts(userId, { limit: 20 }),
  ]);

  return (
    <FeedTabs
      followingInitial={followingInitial}
      forYouInitial={forYouInitial}
    />
  );
}
