export function bookPdfKey(bookId: string) {
  return `books/${bookId}/original.pdf`;
}

export function bookCoverKey(bookId: string, extension: string) {
  return `books/${bookId}/cover.${extension}`;
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
