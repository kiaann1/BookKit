"use client";

import { PenLine } from "lucide-react";
import { useCompose } from "@/components/social/compose-context";

export function FeedComposerPrompt() {
  const { openCompose } = useCompose();

  return (
    <button
      type="button"
      onClick={() => openCompose()}
      className="flex w-full items-center gap-3 border-b border-border/80 px-4 py-4 text-left transition-colors hover:bg-muted/30 touch-manipulation"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-brand-coral/15">
        <PenLine className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm text-muted-foreground">
        Share a thought about what you&apos;re reading…
      </span>
    </button>
  );
}
