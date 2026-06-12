import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChatAvatar } from "@/components/messages/chat-avatar";
import { Button } from "@/components/ui/button";

type ChatHeaderProps = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

export function ChatHeader({
  displayName,
  username,
  avatarUrl,
}: ChatHeaderProps) {
  return (
    <header className="safe-top flex shrink-0 items-center gap-3 border-b border-border/60 bg-card/95 px-3 py-3 backdrop-blur sm:px-4">
      <Link href="/messages" className="md:hidden">
        <Button type="button" variant="ghost" size="icon" aria-label="Back to inbox">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>

      <Link
        href={`/u/${username}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl transition hover:bg-muted/40"
      >
        <ChatAvatar src={avatarUrl} name={displayName} size="md" />
        <div className="min-w-0 text-left">
          <p className="truncate font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">@{username}</p>
        </div>
      </Link>
    </header>
  );
}
