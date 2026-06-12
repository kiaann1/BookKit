import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2 border-b border-border pb-4 sm:pb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-28" />
      </div>

      <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Skeleton className="mx-auto h-24 w-24 shrink-0 rounded-full sm:mx-0" />
          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-2 text-center sm:text-left">
              <Skeleton className="mx-auto h-8 w-44 sm:mx-0" />
              <Skeleton className="mx-auto h-4 w-28 sm:mx-0" />
            </div>
            <div className="flex justify-center gap-2 sm:justify-end">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
            <Skeleton className="mx-auto h-12 w-full max-w-md sm:mx-0" />
            <div className="flex justify-center gap-4 sm:justify-start">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton className="h-6 w-28" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton className="h-6 w-20" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
