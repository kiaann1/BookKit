import Link from "next/link";
import type { ConversationListItem } from "@/lib/messages";
import { cn } from "@/lib/utils";

type ConversationListProps = {
  conversations: ConversationListItem[];
  activeId?: string;
};

export function ConversationList({
  conversations,
  activeId,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 px-5 py-12 text-center">
        <p className="font-medium">No conversations yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Message readers you follow who follow you back from their profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          href={`/messages/${conversation.id}`}
          className={cn(
            "block rounded-2xl border border-border/80 bg-card p-4 transition hover:border-primary/30",
            activeId === conversation.id && "border-primary bg-primary/5",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">
                {conversation.otherUser.displayName}
              </p>
              <p className="text-sm text-muted-foreground">
                @{conversation.otherUser.username}
              </p>
              {conversation.lastMessage ? (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {conversation.lastMessage.body}
                </p>
              ) : null}
            </div>
            {conversation.unreadCount > 0 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {conversation.unreadCount}
              </span>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
