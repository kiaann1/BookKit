import type { BookRequestStatus as PrismaBookRequestStatus } from "@prisma/client";
import {
  BookRequestStatus,
  type BookRequestStatus as BookRequestStatusValue,
} from "@/lib/constants/book-request-status";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import type { CreateBookRequestInput } from "@/lib/validations/book-request";
import { sanitizeOptionalPlainText } from "@/lib/security/sanitize";

export type BookRequestListItem = {
  id: string;
  title: string;
  author: string;
  notes: string | null;
  isbn: string | null;
  status: BookRequestStatusValue;
  adminNote: string | null;
  linkedBookId: string | null;
  linkedBookTitle: string | null;
  voteCount: number;
  viewerHasVoted: boolean;
  createdAt: string;
  updatedAt: string;
  requester?: {
    id: string;
    username: string;
    displayName: string | null;
  };
};

function normalizeMatch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function mapRequest(
  row: {
    id: string;
    title: string;
    author: string;
    notes: string | null;
    isbn: string | null;
    status: PrismaBookRequestStatus;
    adminNote: string | null;
    linkedBookId: string | null;
    createdAt: Date;
    updatedAt: Date;
    linkedBook?: { id: string; title: string } | null;
    user?: {
      id: string;
      username: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
    };
    _count?: { votes: number };
    votes?: { userId: string }[];
  },
  viewerId: string,
): BookRequestListItem {
  const displayName =
    row.user?.name ??
    ([row.user?.firstName, row.user?.lastName].filter(Boolean).join(" ").trim() ||
      null);

  return {
    id: row.id,
    title: row.title,
    author: row.author,
    notes: row.notes,
    isbn: row.isbn,
    status: row.status as BookRequestStatusValue,
    adminNote: row.adminNote,
    linkedBookId: row.linkedBookId,
    linkedBookTitle: row.linkedBook?.title ?? null,
    voteCount: row._count?.votes ?? row.votes?.length ?? 0,
    viewerHasVoted: row.votes?.some((vote) => vote.userId === viewerId) ?? false,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    requester: row.user
      ? {
          id: row.user.id,
          username: row.user.username,
          displayName,
        }
      : undefined,
  };
}

const listInclude = (viewerId: string) => ({
  linkedBook: { select: { id: true, title: true } },
  user: {
    select: {
      id: true,
      username: true,
      name: true,
      firstName: true,
      lastName: true,
    },
  },
  _count: { select: { votes: true } },
  votes: {
    where: { userId: viewerId },
    select: { userId: true },
  },
});

export async function createBookRequest(
  userId: string,
  input: CreateBookRequestInput,
) {
  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  const request = await prisma.bookRequest.create({
    data: {
      userId,
      title: input.title,
      author: input.author,
      notes: input.notes,
      isbn: input.isbn,
    },
    select: { id: true },
  });

  return { requestId: request.id };
}

export async function getUserBookRequests(userId: string) {
  if (!(await isDatabaseAvailable())) {
    return [];
  }

  const rows = await prisma.bookRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: listInclude(userId),
  });

  return rows.map((row) => mapRequest(row, userId));
}

export async function getPopularBookRequests(
  viewerId: string,
  options: { limit?: number } = {},
) {
  if (!(await isDatabaseAvailable())) {
    return [];
  }

  const limit = options.limit ?? 20;

  const rows = await prisma.bookRequest.findMany({
    where: {
      status: {
        in: [BookRequestStatus.PENDING, BookRequestStatus.SOURCED],
      },
    },
    orderBy: [{ votes: { _count: "desc" } }, { createdAt: "desc" }],
    take: limit,
    include: listInclude(viewerId),
  });

  return rows.map((row) => mapRequest(row, viewerId));
}

export async function getAdminBookRequests(options: {
  status?: BookRequestStatusValue;
  limit?: number;
}) {
  if (!(await isDatabaseAvailable())) {
    return [];
  }

  const rows = await prisma.bookRequest.findMany({
    where: options.status ? { status: options.status } : undefined,
    orderBy: [{ votes: { _count: "desc" } }, { createdAt: "desc" }],
    take: options.limit ?? 50,
    include: {
      linkedBook: { select: { id: true, title: true } },
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: { select: { votes: true } },
    },
  });

  return rows.map((row) => mapRequest(row, ""));
}

export async function getBookRequestForAdmin(id: string) {
  if (!(await isDatabaseAvailable())) {
    return null;
  }

  const row = await prisma.bookRequest.findUnique({
    where: { id },
    include: {
      linkedBook: { select: { id: true, title: true } },
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: { select: { votes: true } },
    },
  });

  if (!row) {
    return null;
  }

  return mapRequest(row, "");
}

export async function updateBookRequestAdmin(
  id: string,
  input: {
    status?: BookRequestStatusValue;
    adminNote?: string | null;
    linkedBookId?: string | null;
  },
) {
  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  const existing = await prisma.bookRequest.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return { error: "Request not found" as const };
  }

  if (input.linkedBookId) {
    const book = await prisma.book.findUnique({
      where: { id: input.linkedBookId },
      select: { id: true },
    });
    if (!book) {
      return { error: "Linked book not found" as const };
    }
  }

  const status = input.status;
  if (status === BookRequestStatus.ADDED && !input.linkedBookId) {
    return {
      error: "Link a catalog book when marking a request as added" as const,
    };
  }

  const updated = await prisma.bookRequest.update({
    where: { id },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(input.adminNote !== undefined
        ? {
            adminNote: sanitizeOptionalPlainText(input.adminNote, {
              maxLength: 1000,
            }),
          }
        : {}),
      ...(input.linkedBookId !== undefined
        ? { linkedBookId: input.linkedBookId }
        : {}),
    },
    include: listInclude(""),
  });

  return { request: mapRequest(updated, "") };
}

export async function toggleBookRequestVote(requestId: string, userId: string) {
  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  const request = await prisma.bookRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true },
  });

  if (!request) {
    return { error: "Request not found" as const };
  }

  if (
    request.status !== BookRequestStatus.PENDING &&
    request.status !== BookRequestStatus.SOURCED
  ) {
    return { error: "This request is no longer open for upvotes" as const };
  }

  const existing = await prisma.bookRequestVote.findUnique({
    where: { requestId_userId: { requestId, userId } },
  });

  if (existing) {
    await prisma.bookRequestVote.delete({
      where: { requestId_userId: { requestId, userId } },
    });
    return { voted: false as const };
  }

  await prisma.bookRequestVote.create({
    data: { requestId, userId },
  });

  return { voted: true as const };
}

export async function fulfillBookRequest(requestId: string, bookId: string) {
  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  const [request, book] = await Promise.all([
    prisma.bookRequest.findUnique({
      where: { id: requestId },
      select: { id: true },
    }),
    prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true },
    }),
  ]);

  if (!request) {
    return { error: "Request not found" as const };
  }
  if (!book) {
    return { error: "Book not found" as const };
  }

  await prisma.bookRequest.update({
    where: { id: requestId },
    data: {
      status: BookRequestStatus.ADDED,
      linkedBookId: bookId,
    },
  });

  return { success: true as const };
}

export async function fulfillMatchingBookRequests(book: {
  id: string;
  title: string;
  author: string;
}) {
  if (!(await isDatabaseAvailable())) {
    return 0;
  }

  const title = normalizeMatch(book.title);
  const author = normalizeMatch(book.author);

  const candidates = await prisma.bookRequest.findMany({
    where: {
      status: { in: [BookRequestStatus.PENDING, BookRequestStatus.SOURCED] },
    },
    select: { id: true, title: true, author: true },
  });

  const matchingIds = candidates
    .filter(
      (request) =>
        normalizeMatch(request.title) === title &&
        normalizeMatch(request.author) === author,
    )
    .map((request) => request.id);

  if (matchingIds.length === 0) {
    return 0;
  }

  await prisma.bookRequest.updateMany({
    where: { id: { in: matchingIds } },
    data: {
      status: BookRequestStatus.ADDED,
      linkedBookId: book.id,
    },
  });

  return matchingIds.length;
}
