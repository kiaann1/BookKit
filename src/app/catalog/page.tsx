import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogResults } from "@/components/books/catalog-results";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalog",
};

type CatalogPageProps = {
  searchParams: Promise<{ q?: string; genre?: string }>;
};

function CatalogResultsFallback() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[2/3] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { q, genre } = await searchParams;

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="page-stack flex flex-col">
        <PageHeader
          title="Catalog"
          description="Browse every book in the library — search and filter by genre."
        />

        <Suspense
          key={`${q ?? ""}-${genre ?? ""}`}
          fallback={<CatalogResultsFallback />}
        >
          <CatalogResults q={q} genre={genre} />
        </Suspense>
      </div>
    </div>
  );
}
