import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { UserSearch } from "@/components/social/user-search";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Find readers",
};

export default async function PeoplePage() {
  await requireCompletedOnboarding();

  return (
    <FadeIn className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Find readers"
        description="Search by username or name, visit profiles, and follow people whose taste you trust."
      />

      <UserSearch variant="full" />

      <p className="text-sm text-muted-foreground">
        Direct messaging is coming in a later update. For now, follow readers
        and catch their posts in your{" "}
        <Link href="/feed" className="text-primary underline-offset-4 hover:underline">
          feed
        </Link>
        .
      </p>
    </FadeIn>
  );
}
