export function userAvatarKey(userId: string, extension: string) {
  return `users/${userId}/avatar.${extension}`;
}

export function bookPdfKey(bookId: string) {
  return `books/${bookId}/original.pdf`;
}

export function bookCoverKey(bookId: string, extension: string) {
  return `books/${bookId}/cover.${extension}`;
}

export function postMediaKey(postId: string, extension: string) {
  return `posts/${postId}/media.${extension}`;
}

export function coverExtensionFromMime(mime: string) {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}
