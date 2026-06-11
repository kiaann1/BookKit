import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { resolveAvatarUrl } from "@/lib/storage/avatar";

export async function exportUserData(userId: string) {
  if (!(await isDatabaseAvailable())) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      name: true,
      phone: true,
      bio: true,
      genrePreferences: true,
      booksPerWeek: true,
      isPrivate: true,
      followersListVisibility: true,
      createdAt: true,
      updatedAt: true,
      avatarUrl: true,
      shelf: {
        select: {
          status: true,
          rating: true,
          review: true,
          startedAt: true,
          finishedAt: true,
          currentPage: true,
          totalPages: true,
          progressPercent: true,
          createdAt: true,
          book: { select: { id: true, title: true, author: true } },
        },
      },
      posts: {
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          createdAt: true,
          book: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        select: {
          id: true,
          body: true,
          createdAt: true,
          postId: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.name,
      phone: user.phone,
      bio: user.bio,
      genrePreferences: user.genrePreferences,
      booksPerWeek: user.booksPerWeek,
      isPrivate: user.isPrivate,
      followersListVisibility: user.followersListVisibility,
      avatarUrl: resolveAvatarUrl(user.id, user.avatarUrl),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    shelf: user.shelf.map((entry) => ({
      bookId: entry.book.id,
      title: entry.book.title,
      author: entry.book.author,
      status: entry.status,
      rating: entry.rating,
      review: entry.review,
      startedAt: entry.startedAt,
      finishedAt: entry.finishedAt,
      currentPage: entry.currentPage,
      totalPages: entry.totalPages,
      progressPercent: entry.progressPercent,
      addedAt: entry.createdAt,
    })),
    posts: user.posts,
    comments: user.comments,
  };
}
