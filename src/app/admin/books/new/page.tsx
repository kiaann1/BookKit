import type { Metadata } from "next";
import { BookForm } from "@/components/admin/book-form";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Upload Book",
};

export default function NewBookPage() {
  return (
    <FadeIn className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Upload a book"
        description="Add a PDF and metadata to the catalog. Cover art is fetched automatically from Open Library when you don't upload one."
      />
      <Card>
        <CardContent className="pt-6">
          <BookForm mode="create" />
        </CardContent>
      </Card>
    </FadeIn>
  );
}
