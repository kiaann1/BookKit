import type { PostBookTag, SocialAuthor } from "@/lib/social/types";
import { getCoverApiUrl } from "@/lib/storage";

export function mapSocialAuthor(user: {
  id: string;
  username: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}): SocialAuthor {
  const displayName =
    user.name?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username;

  return {
    id: user.id,
    username: user.username,
    displayName,
    avatarUrl: user.avatarUrl,
  };
}

export function mapPostBook(book: {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
}): PostBookTag {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl,
  };
}

export function coverUrlForBook(bookId: string) {
  return getCoverApiUrl(bookId);
}
