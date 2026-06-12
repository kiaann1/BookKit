import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { ShelfContent } from "@/components/shelf/shelf-content";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth/session-user";
import { ShelfStatus } from "@/lib/constants/shelf-status";

export const metadata: Metadata = {
  title: "My Shelf",
};

type ShelfPageProps = {
  searchParams: Promise<{ status?: string }>;
};

const VALID_STATUSES = new Set<string>(Object.values(ShelfStatus));

function ShelfContentFallback() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default async function ShelfPage({ searchParams }: ShelfPageProps) {
  const { userId } = await requireUser();
  const { status: statusParam } = await searchParams;
  const status =
    statusParam && VALID_STATUSES.has(statusParam)
      ? (statusParam as (typeof ShelfStatus)[keyof typeof ShelfStatus])
      : undefined;

  return (
    <PageShell>
      <PageHeader
        title="My bookshelf"
        description="Want to read, reading, read, and DNF."
      />

      <Suspense key={status ?? "all"} fallback={<ShelfContentFallback />}>
        <ShelfContent userId={userId} status={status} />
      </Suspense>
    </PageShell>
  );
}
