import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export function AppPageSkeleton() {
  return (
    <div className="page-stack flex flex-col">
      <div className="space-y-2 border-b border-border pb-4 sm:pb-6">
        <Skeleton className="h-8 w-40 sm:h-9 sm:w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-36 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="page-stack flex flex-col">
      <div className="space-y-2 border-b border-border pb-4 sm:pb-6">
        <Skeleton className="h-8 w-48 sm:h-9" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    </div>
  );
}

function FeedTimelineRows() {
  return (
    <>
      <Skeleton className="h-14 w-full rounded-xl" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-3 rounded-2xl border border-border/60 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[80%]" />
        </div>
      ))}
    </>
  );
}

export function FeedTimelineSkeleton() {
  return (
    <div className="page-stack flex flex-col">
      <FeedTimelineRows />
    </div>
  );
}

export function FeedPageSkeleton() {
  return (
    <div className="page-stack mx-auto w-full max-w-xl flex flex-col">
      <div className="space-y-1 border-b border-border/80 px-1 pb-3">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-40" />
      </div>
      <FeedTimelineRows />
    </div>
  );
}

function RecommendationRowsSkeleton() {
  return (
    <>
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-28 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-28 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    </>
  );
}

export function RecommendationsBodySkeleton() {
  return (
    <div className="page-stack flex flex-col">
      <RecommendationRowsSkeleton />
    </div>
  );
}

export function RecommendationsPageSkeleton() {
  return (
    <div className="page-stack flex flex-col">
      <PageHeader
        title="Discover"
        description="Books picked for you based on your genres and reading history."
      />
      <RecommendationRowsSkeleton />
    </div>
  );
}

export function MessagesPageSkeleton() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col rounded-2xl border border-border/80 bg-card/40">
      <div className="border-b border-border/80 px-4 py-3">
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="divide-y divide-border/60">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full max-w-xs" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
