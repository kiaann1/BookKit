import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div className="page-stack mx-auto flex max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-10">
      <PageHeader
        title="Catalog"
        description="Browse every book in the library — search and filter by genre."
      />
      <div className="flex gap-2">
        <Skeleton className="h-11 min-w-0 flex-1 rounded-xl" />
        <Skeleton className="h-11 w-28 shrink-0 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[2/3] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
