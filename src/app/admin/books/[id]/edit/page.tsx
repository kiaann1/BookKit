import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookForm } from "@/components/admin/book-form";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { Card, CardContent } from "@/components/ui/card";
import { getBookForAdmin } from "@/lib/books";

type EditBookPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: EditBookPageProps): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookForAdmin(id);
  return { title: book ? `Edit ${book.title}` : "Edit book" };
}

export default async function EditBookPage({ params }: EditBookPageProps) {
  const { id } = await params;
  const book = await getBookForAdmin(id);

  if (!book) {
    notFound();
  }

  return (
    <FadeIn className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title={`Edit ${book.title}`}
        description="Update metadata or replace the PDF and cover."
      />
      <Card>
        <CardContent className="pt-6">
          <BookForm
            mode="edit"
            bookId={book.id}
            initialValues={{
              title: book.title,
              author: book.author,
              description: book.description ?? "",
              genres: book.genres,
              publishedAt: book.publishedAt
                ? book.publishedAt.toISOString().slice(0, 10)
                : "",
              seriesTitle: book.seriesTitle ?? "",
              seriesIndex: book.seriesIndex?.toString() ?? "",
              status: book.status,
            }}
          />
        </CardContent>
      </Card>
    </FadeIn>
  );
}
