"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { UserRound } from "lucide-react";
import type { SocialAuthor } from "@/lib/social/types";
import { cn } from "@/lib/utils";

type PostLikesListProps = {
  postId: string;
  likeCount: number;
  className?: string;
};

export function PostLikesList({
  postId,
  likeCount,
  className,
}: PostLikesListProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<SocialAuthor[]>([]);
  const [loading, setLoading] = useState(false);

  if (likeCount === 0) {
    return null;
  }

  async function loadLikes() {
    if (users.length > 0) {
      setOpen((value) => !value);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/likes`);
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { users: SocialAuthor[] };
      setUsers(data.users);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => void loadLikes()}
        className="text-xs text-muted-foreground transition hover:text-foreground"
      >
        {loading ? "Loading…" : `Liked by ${likeCount}`}
      </button>

      {open && users.length > 0 ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-border/80 bg-card p-2 shadow-lg">
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Likes
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {users.map((user) => (
              <li key={user.id}>
                <Link
                  href={`/u/${user.username}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-muted/50"
                  onClick={() => setOpen(false)}
                >
                  <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary/15 to-brand-coral/15">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="28px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <UserRound className="h-3.5 w-3.5 text-primary/60" />
                      </div>
                    )}
                  </div>
                  <span className="truncate font-medium">{user.displayName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
