import { prisma } from "@/lib/db";

let typingColumnsAvailable: boolean | null = null;

/** Typing columns were added in 20250610240000_conversation_typing — may be missing on older DBs. */
export async function isTypingSupported() {
  if (typingColumnsAvailable !== null) {
    return typingColumnsAvailable;
  }

  try {
    await prisma.conversation.findFirst({
      select: { typingUserId: true, typingExpiresAt: true },
    });
    typingColumnsAvailable = true;
  } catch {
    typingColumnsAvailable = false;
  }

  return typingColumnsAvailable;
}

export async function clearTypingFields(conversationId: string) {
  if (!(await isTypingSupported())) {
    return;
  }

  try {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        typingUserId: null,
        typingExpiresAt: null,
      },
    });
  } catch {
    typingColumnsAvailable = false;
  }
}
