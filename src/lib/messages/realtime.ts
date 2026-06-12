import { prisma } from "@/lib/db";
import { isDatabaseAvailable } from "@/lib/db/health";
import type { MessageItem } from "@/lib/messages";
import { getConversationForUser } from "@/lib/messages/index";
import {
  clearTypingFields,
  isTypingSupported,
} from "@/lib/messages/typing-support";

export const TYPING_TTL_MS = 5_000;

function mapMessageRow(
  row: {
    id: string;
    senderId: string;
    body: string;
    readAt: Date | null;
    createdAt: Date;
  },
  userId: string,
): MessageItem {
  return {
    id: row.id,
    senderId: row.senderId,
    body: row.body,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    isOwn: row.senderId === userId,
  };
}

export async function getMessagesAfter(
  conversationId: string,
  userId: string,
  afterMessageId: string,
) {
  if (!(await isDatabaseAvailable())) {
    return [];
  }

  const conversation = await getConversationForUser(conversationId, userId);
  if (!conversation) {
    return null;
  }

  const cursor = await prisma.message.findFirst({
    where: { id: afterMessageId, conversationId },
    select: { createdAt: true },
  });

  if (!cursor) {
    return [];
  }

  const rows = await prisma.message.findMany({
    where: {
      conversationId,
      createdAt: { gt: cursor.createdAt },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      senderId: true,
      body: true,
      readAt: true,
      createdAt: true,
    },
  });

  return rows.map((row) => mapMessageRow(row, userId));
}

export async function setConversationTyping(
  conversationId: string,
  userId: string,
) {
  if (!(await isDatabaseAvailable()) || !(await isTypingSupported())) {
    return { ok: true as const };
  }

  const conversation = await getConversationForUser(conversationId, userId);
  if (!conversation) {
    return { error: "Conversation not found" as const };
  }

  try {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        typingUserId: userId,
        typingExpiresAt: new Date(Date.now() + TYPING_TTL_MS),
      },
    });
  } catch {
    return { ok: true as const };
  }

  return { ok: true as const };
}

export async function clearConversationTyping(
  conversationId: string,
  userId: string,
) {
  if (!(await isDatabaseAvailable()) || !(await isTypingSupported())) {
    return { ok: true as const };
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { typingUserId: true },
    });

    if (!conversation || conversation.typingUserId !== userId) {
      return { ok: true as const };
    }

    await clearTypingFields(conversationId);
  } catch {
    // Typing is optional — never block messaging.
  }

  return { ok: true as const };
}

export async function getOtherUserTyping(
  conversationId: string,
  userId: string,
) {
  if (!(await isDatabaseAvailable()) || !(await isTypingSupported())) {
    return false;
  }

  const conversation = await getConversationForUser(conversationId, userId);
  if (!conversation) {
    return false;
  }

  try {
    const row = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        typingUserId: true,
        typingExpiresAt: true,
      },
    });

    if (!row?.typingUserId || row.typingUserId === userId) {
      return false;
    }

    if (!row.typingExpiresAt || row.typingExpiresAt.getTime() <= Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
