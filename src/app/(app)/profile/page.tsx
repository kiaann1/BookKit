import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { ShowcaseGrid } from "@/components/profile/showcase-grid";
import { ShowcaseManager } from "@/components/profile/showcase-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SHELF_STATUS_LABELS } from "@/lib/constants/shelf-status";
import { requireUser } from "@/lib/auth/session-user";
import { getUserShelf } from "@/lib/shelf";
import { getUserProfile } from "@/lib/user/profile";
import { BookOpen, Library, UserRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const { userId, session } = await requireUser();
  const profile = await getUserProfile(userId);
  const shelfBooks = await getUserShelf(userId);

  if (!profile) {
    redirect("/login");
  }

  const displayName = profile.name ?? session.user.name ?? profile.username;

  return (
    <FadeIn className="mx-auto max-w-3xl space-y-8 px-4 py-5 sm:px-6 sm:py-10">
      <PageHeader
        title="Profile"
        description="Your public face on BookKit — bio, reading stats, and showcase favorites."
      />

      <Card className="overflow-hidden">
        <CardContent className="p-6 sm:p-8">
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
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {displayName}
              </h2>
              <p className="mt-1 text-muted-foreground">@{profile.username}</p>
              {profile.bio ? (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No bio yet — you can add one during onboarding.
                </p>
              )}

              {profile.genrePreferences.length > 0 ? (
                <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {profile.genrePreferences.map((genre) => (
                    <Badge key={genre} variant="default">
                      {genre}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant="muted">{profile.shelfStats.total} on shelf</Badge>
                {Object.entries(profile.shelfStats.counts).map(([status, count]) => (
                  <Badge key={status} variant="outline">
                    {count} {SHELF_STATUS_LABELS[status as keyof typeof SHELF_STATUS_LABELS]}
                  </Badge>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Link href={`/u/${profile.username}`}>
                  <Button variant="outline" size="sm">
                    <UserRound className="h-4 w-4" />
                    Public profile
                  </Button>
                </Link>
                <Link href="/shelf">
                  <Button variant="outline" size="sm">
                    <Library className="h-4 w-4" />
                    View bookshelf
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" size="sm">
                    Edit settings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">Showcase</h3>
        </div>
        <ShowcaseGrid books={profile.showcase} editable />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Manage showcase</CardTitle>
          <CardDescription>
            Pin up to 6 favorites from your shelf. Order matters — first book is
            your top highlight.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShowcaseManager
            initialShowcase={profile.showcase}
            shelfBooks={shelfBooks}
          />
        </CardContent>
      </Card>
    </FadeIn>
  );
}
