import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { FriendPostPreview } from "@/components/dashboard/friend-post-preview";
import { FriendsReadingRow } from "@/components/dashboard/friends-reading-row";
import { Button } from "@/components/ui/button";
import { getFriendsActivity } from "@/lib/social/friends-activity";
import { getFeedPosts } from "@/lib/social/posts";

type FriendsActivityWidgetsProps = {
  userId: string;
};

export async function FriendsActivityWidgets({
  userId,
}: FriendsActivityWidgetsProps) {
  const activity = await getFriendsActivity(userId);
  const hasFriendsContent =
    activity.recentPosts.length > 0 || activity.friendsReading.length > 0;

  if (activity.followingCount === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border/80 px-5 py-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient shadow-md shadow-primary/20">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              From your friends
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Follow readers to see their latest posts and what they&apos;re
              reading here.
            </p>
            <Link href="/people" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                Find readers
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!hasFriendsContent) {
    const communityFeed = await getFeedPosts(userId, { limit: 3 });
    if (communityFeed.posts.length === 0) {
      return (
        <section className="rounded-2xl border border-dashed border-border/80 px-5 py-6 text-sm text-muted-foreground">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            From your friends
          </h2>
          <p className="mt-1">
            People you follow haven&apos;t posted or started reading anything
            yet. Check back soon.
          </p>
          <Link href="/feed" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              Browse feed
            </Button>
          </Link>
        </section>
      );
    }

    return (
      <section className="space-y-4">
        <SectionHeader
          title="Recent in the community"
          description="Latest public posts while your friends get started."
          href="/feed"
          linkLabel="Open feed"
        />
        <div className="space-y-2">
          {communityFeed.posts.map((post) => (
            <FriendPostPreview key={post.id} post={post} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {activity.friendsReading.length > 0 ? (
        <section className="space-y-4">
          <SectionHeader
            title="Friends are reading"
            description="What people you follow have on their shelf right now."
            href="/people"
            linkLabel="Find more"
          />
          <FriendsReadingRow items={activity.friendsReading} />
        </section>
      ) : null}

      {activity.recentPosts.length > 0 ? (
        <section className="space-y-4">
          <SectionHeader
            title="Recent from friends"
            description="Latest posts from people you follow."
            href="/feed"
            linkLabel="See feed"
          />
          <div className="space-y-2">
            {activity.recentPosts.map((post) => (
              <FriendPostPreview key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SectionHeader({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description?: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Link href={href} className="shrink-0">
        <Button variant="ghost" size="sm" className="gap-1">
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
