import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { FollowButton } from "@/components/social/follow-button";
import { getSuggestedUsers } from "@/lib/social/suggested-users";

type SuggestedReadersProps = {
  viewerId: string;
};

export async function SuggestedReaders({ viewerId }: SuggestedReadersProps) {
  const users = await getSuggestedUsers(viewerId);

  if (users.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Suggested for you
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Readers who share your genre tastes.
        </p>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3"
          >
            <Link
              href={`/u/${user.username}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border/80 bg-gradient-to-br from-primary/15 to-brand-coral/15">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="44px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <UserRound className="h-5 w-5 text-primary/60" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate font-medium">{user.displayName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  @{user.username}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {user.followerCount === 1
                    ? "1 follower"
                    : `${user.followerCount} followers`}
                </p>
              </div>
            </Link>

            <FollowButton
              username={user.username}
              initialFollowing={user.isFollowing}
              isSelf={false}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
