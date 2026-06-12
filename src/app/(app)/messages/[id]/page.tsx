import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageThread } from "@/components/messages/message-thread";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import {
  getConversationForUser,
  getMessages,
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
  const [conversation, messages] = await Promise.all([
    getConversationForUser(id, auth.userId),
    getMessages(id, auth.userId),
  ]);

  if (!conversation || messages === null) {
    notFound();
  }

  return (
    <FadeIn className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={conversation.otherUser.displayName}
        description={`@${conversation.otherUser.username}`}
      />

      <p className="text-sm text-muted-foreground">
        <Link href="/messages" className="text-primary underline-offset-4 hover:underline">
          Back to inbox
        </Link>
      </p>

      <MessageThread conversationId={id} initialMessages={messages} />
    </FadeIn>
  );
}
