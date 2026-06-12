import type { Metadata } from "next";
import { ConversationList } from "@/components/messages/conversation-list";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
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
    <FadeIn className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Messages"
        description="Private conversations with readers who follow you back."
      />

      <ConversationList conversations={conversations} />
    </FadeIn>
  );
}
