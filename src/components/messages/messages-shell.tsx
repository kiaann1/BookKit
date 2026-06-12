import type { ConversationListItem } from "@/lib/messages";
import { ConversationListLive } from "@/components/messages/conversation-list-live";
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
  const showInbox = !activeConversationId;
  const isMobileThread = Boolean(activeConversationId);

  return (
    <div
      className={cn(
        "flex overflow-hidden bg-card",
        isMobileThread
          ? "fixed inset-0 z-[60] flex-col md:static md:z-auto md:h-[calc(100dvh-9rem)] md:max-h-[52rem] md:rounded-2xl md:border md:border-border/80 md:shadow-sm"
          : [
              "fixed inset-x-0 z-30 flex-col",
              "top-14",
              "bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px))]",
              "md:static md:z-auto md:h-[calc(100dvh-9rem)] md:max-h-[52rem] md:rounded-2xl md:border md:border-border/80 md:shadow-sm",
            ],
        "md:flex-row",
      )}
    >
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-border/60 bg-background md:w-80 md:border-r",
          activeConversationId ? "hidden md:flex" : "flex min-h-0 flex-1 md:flex-none",
        )}
      >
        <div className="border-b border-border/60 px-4 py-4">
          <h1 className="font-display text-xl font-semibold tracking-tight">
            Messages
          </h1>
          <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
            Private chats with other readers
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ConversationListLive
            initialConversations={conversations}
            activeId={activeConversationId}
          />
        </div>
      </aside>

      <main
        className={cn(
          "flex min-w-0 flex-1 flex-col bg-card",
          showInbox ? "hidden md:flex" : "flex min-h-0",
        )}
      >
        {children}
      </main>
    </div>
  );
}
