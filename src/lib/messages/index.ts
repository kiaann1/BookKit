import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { clearTypingFields } from "@/lib/messages/typing-support";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { getBlockStatus } from "@/lib/social/block";
import { resolveAvatarUrl } from "@/lib/storage/avatar";

export type ConversationListItem = {
  id: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  lastMessage: {
    body: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
};

export type MessageItem = {
  id: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  isOwn: boolean;
};

function orderedParticipants(userA: string, userB: string) {
  return userA < userB
    ? { participantLowId: userA, participantHighId: userB }
    : { participantLowId: userB, participantHighId: userA };
}

function displayName(user: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string;
}) {
  return (
    user.name ??
    ([user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.username)
  );
}

export async function canMessageUser(viewerId: string, targetUserId: string) {
  if (viewerId === targetUserId || !(await isDatabaseAvailable())) {
    return false;
  }

  const blockStatus = await getBlockStatus(viewerId, targetUserId);
  return !blockStatus.isBlockedByViewer && !blockStatus.hasBlockedViewer;
}

export async function getOrCreateConversation(
  userA: string,
  userB: string,
) {
  if (!(await isDatabaseAvailable())) {
    return null;
  }

  const pair = orderedParticipants(userA, userB);

  return prisma.conversation.upsert({
    where: {
      participantLowId_participantHighId: pair,
    },
    create: pair,
    update: {},
    select: { id: true },
  });
}

export async function getUnreadMessageCount(userId: string) {
  if (!(await isDatabaseAvailable())) {
    return 0;
  }

  return prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      conversation: {
        OR: [{ participantLowId: userId }, { participantHighId: userId }],
      },
    },
  });
}

export async function listConversations(userId: string) {
  if (!(await isDatabaseAvailable())) {
    return [];
  }

  const rows = await prisma.conversation.findMany({
    where: {
      OR: [{ participantLowId: userId }, { participantHighId: userId }],
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      participantLow: {
        select: {
          id: true,
          username: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      participantHigh: {
        select: {
          id: true,
          username: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          body: true,
          senderId: true,
          createdAt: true,
          readAt: true,
        },
      },
    },
  });

  const conversations: ConversationListItem[] = [];

  for (const row of rows) {
    const otherUser =
      row.participantLow.id === userId
        ? row.participantHigh
        : row.participantLow;

    const unreadCount = await prisma.message.count({
      where: {
        conversationId: row.id,
        senderId: { not: userId },
        readAt: null,
      },
    });

    const last = row.messages[0];

    conversations.push({
      id: row.id,
      otherUser: {
        id: otherUser.id,
        username: otherUser.username,
        displayName: displayName(otherUser),
        avatarUrl: resolveAvatarUrl(otherUser.id, otherUser.avatarUrl),
      },
      lastMessage: last
        ? {
            body: last.body,
            senderId: last.senderId,
            createdAt: last.createdAt.toISOString(),
          }
        : null,
      unreadCount,
      updatedAt: row.lastMessageAt.toISOString(),
    });
  }

  return conversations;
}

export async function getConversationForUser(
  conversationId: string,
  userId: string,
) {
  if (!(await isDatabaseAvailable())) {
    return null;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participantLow: {
        select: {
          id: true,
          username: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      participantHigh: {
        select: {
          id: true,
          username: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!conversation) {
    return null;
  }

  if (
    conversation.participantLowId !== userId &&
    conversation.participantHighId !== userId
  ) {
    return null;
  }

  const otherUser =
    conversation.participantLow.id === userId
      ? conversation.participantHigh
      : conversation.participantLow;

  return {
    id: conversation.id,
    otherUser: {
      id: otherUser.id,
      username: otherUser.username,
      displayName: displayName(otherUser),
      avatarUrl: resolveAvatarUrl(otherUser.id, otherUser.avatarUrl),
    },
  };
}

export async function getMessages(
  conversationId: string,
  userId: string,
  options: { limit?: number } = {},
) {
  if (!(await isDatabaseAvailable())) {
    return [];
  }

  const conversation = await getConversationForUser(conversationId, userId);
  if (!conversation) {
    return null;
  }

  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: options.limit ?? 100,
    select: {
      id: true,
      senderId: true,
      body: true,
      readAt: true,
      createdAt: true,
    },
  });

  return rows.map(
    (row): MessageItem => ({
      id: row.id,
      senderId: row.senderId,
      body: row.body,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      isOwn: row.senderId === userId,
    }),
  );
}

export async function sendMessage(
  senderId: string,
  input: {
    conversationId?: string;
    recipientUsername?: string;
    body?: string;
  },
) {
  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  const body = input.body
    ? sanitizePlainText(input.body, { maxLength: 2000 })
    : "";

  let conversationId = input.conversationId;

  if (!conversationId && input.recipientUsername) {
    const recipient = await prisma.user.findUnique({
      where: { username: input.recipientUsername.toLowerCase() },
      select: { id: true },
    });

    if (!recipient) {
      return { error: "User not found" as const };
    }

    const allowed = await canMessageUser(senderId, recipient.id);
    if (!allowed) {
      return { error: "You cannot message this user" as const };
    }

    const conversation = await getOrCreateConversation(senderId, recipient.id);
    conversationId = conversation?.id;
  }

  if (!conversationId) {
    return { error: "Conversation not found" as const };
  }

  const conversation = await getConversationForUser(conversationId, senderId);
  if (!conversation) {
    return { error: "Conversation not found" as const };
  }

  if (!body) {
    return { conversationId };
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      body,
    },
    select: { id: true, createdAt: true },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: message.createdAt,
    },
  });

  await clearTypingFields(conversationId);

  return {
    messageId: message.id,
    conversationId,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
) {
  if (!(await isDatabaseAvailable())) {
    return { updated: 0 };
  }

  const conversation = await getConversationForUser(conversationId, userId);
  if (!conversation) {
    return { error: "Conversation not found" as const };
  }

  const result = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return { updated: result.count };
}

export async function findConversationWithUser(
  viewerId: string,
  otherUserId: string,
) {
  if (!(await isDatabaseAvailable())) {
    return null;
  }

  const pair = orderedParticipants(viewerId, otherUserId);
  const conversation = await prisma.conversation.findUnique({
    where: { participantLowId_participantHighId: pair },
    select: { id: true },
  });

  return conversation?.id ?? null;
}
