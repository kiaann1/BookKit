import Link from "next/link";
import { ChatAvatar } from "@/components/messages/chat-avatar";
import type { ConversationListItem } from "@/lib/messages";
import { formatConversationTime } from "@/lib/messages/format";
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
      <div className="px-4 py-12 text-center">
        <p className="font-medium">No conversations yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Tap Message on someone&apos;s profile to start chatting.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/50">
      {conversations.map((conversation) => {
        const isActive = activeId === conversation.id;
        const preview = conversation.lastMessage?.body ?? "No messages yet";
        const timeSource =
          conversation.lastMessage?.createdAt ?? conversation.updatedAt;

        return (
          <li key={conversation.id}>
            <Link
              href={`/messages/${conversation.id}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition hover:bg-muted/40",
                isActive && "bg-primary/8",
              )}
            >
              <ChatAvatar
                src={conversation.otherUser.avatarUrl}
                name={conversation.otherUser.displayName ?? conversation.otherUser.username}
                size="md"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "truncate text-sm",
                      conversation.unreadCount > 0
                        ? "font-semibold"
                        : "font-medium",
                    )}
                  >
                    {conversation.otherUser.displayName}
                  </p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatConversationTime(timeSource)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "truncate text-sm",
                      conversation.unreadCount > 0
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {preview}
                  </p>
                  {conversation.unreadCount > 0 ? (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                      {conversation.unreadCount > 9
                        ? "9+"
                        : conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
