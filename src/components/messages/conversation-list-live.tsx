"use client";

import type { ConversationListItem } from "@/lib/messages";
import { ConversationList } from "@/components/messages/conversation-list";
import { useConversationListSync } from "@/hooks/use-conversation-list-sync";

type ConversationListLiveProps = {
  initialConversations: ConversationListItem[];
  activeId?: string;
  enabled?: boolean;
};

export function ConversationListLive({
  initialConversations,
  activeId,
  enabled = true,
}: ConversationListLiveProps) {
  const conversations = useConversationListSync(initialConversations, enabled);

  return <ConversationList conversations={conversations} activeId={activeId} />;
}
