import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { ShowcaseGrid } from "@/components/profile/showcase-grid";
import { ShowcaseManager } from "@/components/profile/showcase-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [profile, shelfBooks] = await Promise.all([
    getUserProfile(userId),
    getUserShelf(userId),
  ]);

  if (!profile) {
    redirect("/login");
  }

  const displayName = profile.name ?? session.user.name ?? profile.username;

  return (
    <PageShell width="wide">
      <PageHeader
        title="Profile"
        description="Your public face on BookKit."
      />

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/80">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative mx-auto h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border/80 bg-gradient-to-br from-primary/15 to-brand-coral/15 sm:mx-0">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <UserRound className="h-8 w-8 text-primary/60" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {displayName}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                @{profile.username}
              </p>
              {profile.bio ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Add a bio in settings to introduce yourself.
                </p>
              )}

              {profile.genrePreferences.length > 0 ? (
                <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                  {profile.genrePreferences.map((genre) => (
                    <Badge key={genre} variant="default">
                      {genre}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                <Badge variant="muted">{profile.shelfStats.total} on shelf</Badge>
                {Object.entries(profile.shelfStats.counts).map(([status, count]) => (
                  <Badge key={status} variant="outline">
                    {count}{" "}
                    {SHELF_STATUS_LABELS[status as keyof typeof SHELF_STATUS_LABELS]}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Link href={`/u/${profile.username}`}>
                  <Button variant="outline" size="sm">
                    <UserRound className="h-4 w-4" />
                    Public profile
                  </Button>
                </Link>
                <Link href="/shelf">
                  <Button variant="outline" size="sm">
                    <Library className="h-4 w-4" />
                    Bookshelf
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" size="sm">
                    Settings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold">Showcase</h3>
        </div>
        <ShowcaseGrid books={profile.showcase} editable />
        <div className="rounded-2xl border border-border/70 bg-card/50 p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">
            Pin up to 6 favorites from your shelf. Drag to reorder.
          </p>
          <div className="mt-4">
            <ShowcaseManager
              initialShowcase={profile.showcase}
              shelfBooks={shelfBooks}
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
