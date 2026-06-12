import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { UserSearch } from "@/components/social/user-search";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Find readers",
};

export default async function PeoplePage() {
  await requireCompletedOnboarding();

  return (
    <PageShell width="medium">
      <PageHeader
        title="Find readers"
        description="Search by username or name and follow people whose taste you trust."
      />

      <UserSearch variant="full" />

      <p className="text-sm text-muted-foreground">
        Visit a profile and tap Message, or open your{" "}
        <Link href="/messages" className="text-primary underline-offset-4 hover:underline">
          inbox
        </Link>
        .
      </p>
    </PageShell>
  );
}
