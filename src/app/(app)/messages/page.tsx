import type { Metadata } from "next";
import { ChatEmptyState } from "@/components/messages/chat-empty-state";
import { MessagesShell } from "@/components/messages/messages-shell";
import { listConversations } from "@/lib/messages";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session-user";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function MessagesPage() {
  await requireCompletedOnboarding();
  const auth = await getAuthenticatedUser();
  const conversations = auth ? await listConversations(auth.userId) : [];

  return (
    <div className="page-enter flex min-h-0 flex-1 flex-col">
      <MessagesShell conversations={conversations}>
        <ChatEmptyState />
      </MessagesShell>
    </div>
  );
}
