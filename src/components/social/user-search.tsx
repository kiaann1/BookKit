"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { FollowButton } from "@/components/social/follow-button";
import { Input } from "@/components/ui/input";
import type { UserSearchResult } from "@/lib/social/types";
import { cn } from "@/lib/utils";

type UserSearchProps = {
  variant?: "compact" | "full";
  className?: string;
};

function formatFollowerCount(count: number) {
  if (count === 1) {
    return "1 follower";
  }

  return `${count} followers`;
}

function UserResultRow({ user }: { user: UserSearchResult }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
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
            {formatFollowerCount(user.followerCount)}
          </p>
        </div>
      </Link>

      <FollowButton
        username={user.username}
        initialFollowing={user.isFollowing}
        isSelf={false}
      />
    </div>
  );
}

export function UserSearch({ variant = "full", className }: UserSearchProps) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(trimmed)}`,
        );

        if (!response.ok) {
          setResults([]);
          setSearched(true);
          return;
        }

        const data = (await response.json()) as { users: UserSearchResult[] };
        setResults(data.users);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const showDropdown = variant === "compact" && query.trim().length >= 2;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search readers by username or name"
          className="pl-9"
          autoComplete="off"
          aria-label="Search readers"
        />

        {variant === "compact" && showDropdown ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border/80 bg-background p-2 shadow-lg">
            {loading ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Searching…
              </p>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((user) => (
                  <UserResultRow key={user.id} user={user} />
                ))}
              </div>
            ) : searched ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No readers found for &ldquo;{query.trim()}&rdquo;.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {variant === "full" ? (
        <div className="space-y-3">
          {query.trim().length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Type at least 2 characters to find readers by username or display
              name.
            </p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Searching…</p>
          ) : results.length > 0 ? (
            results.map((user) => <UserResultRow key={user.id} user={user} />)
          ) : searched ? (
            <p className="text-sm text-muted-foreground">
              No readers found for &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
