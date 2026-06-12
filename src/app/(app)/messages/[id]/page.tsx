import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageThread } from "@/components/messages/message-thread";
import { MessagesShell } from "@/components/messages/messages-shell";
import { FadeIn } from "@/components/motion/fade-in";
import {
  getConversationForUser,
  getMessages,
  listConversations,
} from "@/lib/messages";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session-user";

type MessageThreadPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: MessageThreadPageProps): Promise<Metadata> {
  const { id } = await params;
  const auth = await getAuthenticatedUser();
  const conversation = auth
    ? await getConversationForUser(id, auth.userId)
    : null;

  return {
    title: conversation
      ? `Chat with ${conversation.otherUser.displayName}`
      : "Messages",
  };
}

export default async function MessageThreadPage({
  params,
}: MessageThreadPageProps) {
  await requireCompletedOnboarding();
  const auth = await getAuthenticatedUser();
  if (!auth) {
    notFound();
  }

  const { id } = await params;
  const [conversation, messages, conversations] = await Promise.all([
    getConversationForUser(id, auth.userId),
    getMessages(id, auth.userId),
    listConversations(auth.userId),
  ]);

  if (!conversation || messages === null) {
    notFound();
  }

  return (
    <FadeIn>
      <MessagesShell conversations={conversations} activeConversationId={id}>
        <MessageThread
          conversationId={id}
          otherUser={{
            displayName:
              conversation.otherUser.displayName ??
              conversation.otherUser.username,
            username: conversation.otherUser.username,
            avatarUrl: conversation.otherUser.avatarUrl,
          }}
          initialMessages={messages}
        />
      </MessagesShell>
    </FadeIn>
  );
}
