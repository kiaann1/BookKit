import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { FeedView } from "@/components/social/feed-view";
import { FollowButton } from "@/components/social/follow-button";
import { ShowcaseGrid } from "@/components/profile/showcase-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { catalogBookPath } from "@/lib/books/paths";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { SHELF_STATUS_LABELS } from "@/lib/constants/shelf-status";
import { getPublicProfile } from "@/lib/social/public-profile";
import { getUserPosts } from "@/lib/social/posts";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  await requireCompletedOnboarding();
  const viewer = await getAuthenticatedUser();
  if (!viewer) {
    notFound();
  }

  const { username } = await params;
  const data = await getPublicProfile(username, viewer.userId);

  if (!data) {
    notFound();
  }

  const { profile, showcase, shelf } = data;
  const userPosts = await getUserPosts(username, viewer.userId, { limit: 10 });

  return (
    <FadeIn className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title={profile.displayName}
        description={`@${profile.username}`}
      />

      <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border/80 bg-gradient-to-br from-primary/15 to-brand-coral/15 sm:mx-0">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <UserRound className="h-10 w-10 text-primary/60" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {profile.displayName}
                </h2>
                <p className="mt-1 text-muted-foreground">@{profile.username}</p>
              </div>
              <div className="flex justify-center gap-2 sm:justify-end">
                {profile.isSelf ? (
                  <Link href="/profile">
                    <Button variant="outline" size="sm">
                      Edit profile
                    </Button>
                  </Link>
                ) : (
                  <FollowButton
                    username={profile.username}
                    initialFollowing={profile.isFollowing}
                    isSelf={profile.isSelf}
                  />
                )}
              </div>
            </div>

            {profile.bio ? (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {profile.bio}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm sm:justify-start">
              <span>
                <strong>{profile.followCounts.followers}</strong> followers
              </span>
              <span>
                <strong>{profile.followCounts.following}</strong> following
              </span>
            </div>

            {profile.genrePreferences.length > 0 ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {profile.genrePreferences.map((genre) => (
                  <Badge key={genre} variant="default">
                    {genre}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {showcase.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Showcase</h3>
          </div>
          <ShowcaseGrid books={showcase} />
        </section>
      ) : null}

      {shelf.length > 0 ? (
        <section className="space-y-4">
          <h3 className="font-display text-lg font-semibold">Bookshelf</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {shelf.slice(0, 8).map((book) => (
              <Link
                key={book.id}
                href={catalogBookPath(book.id)}
                className="rounded-xl border border-border/80 bg-card p-3 transition hover:border-primary/30"
              >
                <div className="flex gap-3">
                  <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-primary/10 to-brand-coral/10">
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="44px"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium">{book.title}</p>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                    <Badge variant="outline" className="mt-2">
                      {SHELF_STATUS_LABELS[book.shelfStatus]}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h3 className="font-display text-lg font-semibold">Posts</h3>
        <FeedView
          initialPosts={userPosts.posts}
          initialCursor={userPosts.nextCursor}
          endpoint={`/api/users/${encodeURIComponent(username)}/posts`}
        />
      </section>
    </FadeIn>
  );
}
