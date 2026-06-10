import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PdfReader } from "@/components/reader/pdf-reader";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getPublishedBookById } from "@/lib/books";
import { getReadingProgress } from "@/lib/progress";

type ReadPageProps = {
  params: Promise<{ bookId: string }>;
};

export async function generateMetadata({
  params,
}: ReadPageProps): Promise<Metadata> {
  const { bookId } = await params;
  const book = await getPublishedBookById(bookId);
  if (!book) {
    return { title: "Book not found" };
  }
  return { title: `Reading ${book.title}` };
}

export default async function ReadPage({ params }: ReadPageProps) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const { bookId } = await params;
  const book = await getPublishedBookById(bookId);

  if (!book) {
    notFound();
  }

  const progress = await getReadingProgress(user.userId, bookId);
  const initialPage = progress?.currentPage ?? 1;

  return (
    <PdfReader
      bookId={book.id}
      title={book.title}
      author={book.author}
      initialPage={initialPage}
    />
  );
}
