import { AppPageSkeleton } from "@/components/layout/app-page-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-8">
      <AppPageSkeleton />
    </div>
  );
}
