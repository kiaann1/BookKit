import type { ConversationListItem } from "@/lib/messages";
import { ConversationList } from "@/components/messages/conversation-list";
import { cn } from "@/lib/utils";

type MessagesShellProps = {
  conversations: ConversationListItem[];
  activeConversationId?: string;
  children: React.ReactNode;
};

export function MessagesShell({
  conversations,
  activeConversationId,
  children,
}: MessagesShellProps) {
  const showSidebar = !activeConversationId;

  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm",
        "h-[calc(100dvh-7rem)] min-h-[32rem] max-h-[52rem]",
        "md:h-[calc(100dvh-9rem)]",
      )}
    >
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-border/60 bg-background/50 md:w-80 md:border-r",
          activeConversationId ? "hidden md:flex" : "flex",
        )}
      >
        <div className="border-b border-border/60 px-4 py-4">
          <h1 className="font-display text-xl font-semibold tracking-tight">
            Messages
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Private chats with other readers
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
          />
        </div>
      </aside>

      <main
        className={cn(
          "flex min-w-0 flex-1 flex-col bg-card",
          showSidebar ? "hidden md:flex" : "flex",
        )}
      >
        {children}
      </main>
    </div>
  );
}
