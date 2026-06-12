"use client";

import { useState } from "react";
import { FeedComposerPrompt } from "@/components/social/feed-composer-prompt";
import { FeedView } from "@/components/social/feed-view";
import type { FeedPage } from "@/lib/social/types";
import { cn } from "@/lib/utils";

type FeedMode = "following" | "foryou";

type FeedTabsProps = {
  followingInitial: FeedPage;
  forYouInitial: FeedPage;
};

const tabs: Array<{ id: FeedMode; label: string; description: string }> = [
  {
    id: "following",
    label: "Following",
    description: "Posts from people you follow",
  },
  {
    id: "foryou",
    label: "For you",
    description: "Posts from the wider community",
  },
];

export function FeedTabs({ followingInitial, forYouInitial }: FeedTabsProps) {
  const [mode, setMode] = useState<FeedMode>("following");
  const activeFeed = mode === "following" ? followingInitial : forYouInitial;
  const activeTab = tabs.find((tab) => tab.id === mode)!;

  return (
    <>
      <div
        className="sticky top-14 z-20 -mx-4 border-b border-border/70 bg-background/95 backdrop-blur-xl sm:mx-0"
        role="tablist"
        aria-label="Feed filters"
      >
        <div className="flex">
          {tabs.map((tab) => {
            const isActive = tab.id === mode;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setMode(tab.id)}
                className={cn(
                  "relative flex-1 px-4 py-3 text-sm font-medium transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {tab.label}
                {isActive ? (
                  <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-brand-gradient" />
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="px-4 pb-3 text-xs text-muted-foreground">
          {activeTab.description}
        </p>
      </div>

      <FeedComposerPrompt />

      <FeedView
        key={mode}
        initialPosts={activeFeed.posts}
        initialCursor={activeFeed.nextCursor}
        endpoint={`/api/posts?mode=${mode}`}
        variant="timeline"
        emptyTitle={
          mode === "following"
            ? "Follow readers to fill this feed"
            : "Nothing here yet"
        }
        emptyDescription={
          mode === "following"
            ? "When you follow people, their posts show up here first."
            : "When readers share posts, they'll show up in the community feed."
        }
        emptyActionHref={mode === "following" ? "/people" : undefined}
        emptyActionLabel={mode === "following" ? "Find readers" : undefined}
      />
    </>
  );
}
