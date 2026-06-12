import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { FollowButton } from "@/components/social/follow-button";
import type { FollowListEntry } from "@/lib/social/follow-lists";
import { getAuthenticatedUser } from "@/lib/auth/session-user";

type FollowListProps = {
  users: FollowListEntry[];
  emptyMessage: string;
  viewerId: string;
};

export function FollowList({ users, emptyMessage, viewerId }: FollowListProps) {
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3"
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
            </div>
          </Link>

          <FollowButton
            username={user.username}
            initialFollowing={user.isFollowing}
            isSelf={user.id === viewerId}
          />
        </div>
      ))}
    </div>
  );
}

export async function FollowListForProfile({
  username,
  type,
}: {
  username: string;
  type: "followers" | "following";
}) {
  const viewer = await getAuthenticatedUser();
  if (!viewer) {
    return null;
  }

  const { getFollowersList, getFollowingList } = await import(
    "@/lib/social/follow-lists"
  );

  const result =
    type === "followers"
      ? await getFollowersList(username, viewer.userId)
      : await getFollowingList(username, viewer.userId);

  if ("error" in result) {
    if (result.error === "forbidden") {
      return (
        <p className="text-sm text-muted-foreground">
          This list is private.
        </p>
      );
    }

    return (
      <p className="text-sm text-muted-foreground">
        Could not load this list.
      </p>
    );
  }

  return (
    <FollowList
      users={result.users}
      viewerId={viewer.userId}
      emptyMessage={
        type === "followers"
          ? "No followers yet."
          : "Not following anyone yet."
      }
    />
  );
}
