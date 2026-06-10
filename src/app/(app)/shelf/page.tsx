import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
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
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
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
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-10">
      <FadeIn className="page-stack flex flex-col">
        <PageHeader
          title="My bookshelf"
          description="Your personal collection — want to read, reading, read, and DNF."
        />

        <Suspense key={status ?? "all"} fallback={<ShelfContentFallback />}>
          <ShelfContent userId={userId} status={status} />
        </Suspense>
      </FadeIn>
    </div>
  );
}
