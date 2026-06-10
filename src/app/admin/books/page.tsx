import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookStatus } from "@/lib/constants/book-status";
import { DeleteBookButton } from "@/components/admin/delete-book-button";
import { SeedCatalogButton } from "@/components/admin/seed-catalog-button";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllBooksForAdmin } from "@/lib/books";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Books",
};

function statusVariant(status: BookStatus) {
  switch (status) {
    case BookStatus.PUBLISHED:
      return "success" as const;
    case BookStatus.DRAFT:
      return "warning" as const;
    default:
      return "muted" as const;
  }
}

export default async function AdminBooksPage() {
  const books = await getAllBooksForAdmin();

  return (
    <FadeIn className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Manage books"
          description="Upload PDFs, edit metadata, and control what's in the catalog."
        />
        <Link href="/admin/books/new">
          <Button>
            <Plus className="h-4 w-4" />
            Upload book
          </Button>
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-16 text-center">
          <p className="font-medium">No books yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Seed the default library into Postgres, or upload a PDF manually.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3">
            <SeedCatalogButton />
            <Link href="/admin/books/new">
              <Button variant="outline">Upload book</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {books.map((book) => (
            <div
              key={book.id}
              className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-4 card-glow sm:flex-row sm:items-center"
            >
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/15 to-brand-coral/15">
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{book.title}</h2>
                  <Badge variant={statusVariant(book.status)}>
                    {book.status.toLowerCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{book.author}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Uploaded by @{book.uploadedBy}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {book.status === BookStatus.PUBLISHED && (
                  <Link href={`/catalog/${book.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                )}
                <Link href={`/admin/books/${book.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
                <DeleteBookButton bookId={book.id} title={book.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </FadeIn>
  );
}
