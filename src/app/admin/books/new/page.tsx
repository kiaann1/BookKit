import type { Metadata } from "next";
import { BookForm } from "@/components/admin/book-form";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { Card, CardContent } from "@/components/ui/card";
import { getBookRequestForAdmin } from "@/lib/book-requests";

export const metadata: Metadata = {
  title: "Upload Book",
};

type NewBookPageProps = {
  searchParams: Promise<{ requestId?: string }>;
};

export default async function NewBookPage({ searchParams }: NewBookPageProps) {
  const { requestId } = await searchParams;
  const request = requestId ? await getBookRequestForAdmin(requestId) : null;

  return (
    <FadeIn className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Upload a book"
        description={
          request
            ? `Fulfilling request for “${request.title}” by ${request.author}.`
            : "Add a PDF and metadata to the catalog. Cover art is fetched automatically from Open Library when you don't upload one."
        }
      />
      <Card>
        <CardContent className="pt-6">
          <BookForm
            mode="create"
            bookRequestId={request?.id}
            initialValues={
              request
                ? {
                    title: request.title,
                    author: request.author,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </FadeIn>
  );
}
