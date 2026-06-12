import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SuggestedReaders } from "@/components/social/suggested-readers";
import { UserSearch } from "@/components/social/user-search";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session-user";

export const metadata: Metadata = {
  title: "Find readers",
};

export default async function PeoplePage() {
  await requireCompletedOnboarding();
  const user = await getAuthenticatedUser();

  return (
    <PageShell width="medium" className="space-y-8">
      <PageHeader
        title="Find readers"
        description="Follow people whose taste you trust, then see their posts in your feed."
      />

      {user ? (
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">
              Loading suggestions…
            </p>
          }
        >
          <SuggestedReaders viewerId={user.userId} />
        </Suspense>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-medium">Search</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Look up readers by username or display name.
          </p>
        </div>
        <UserSearch variant="full" />
      </section>

      <p className="text-sm text-muted-foreground">
        Visit a profile and tap Message, or open your{" "}
        <Link
          href="/messages"
          className="text-primary underline-offset-4 hover:underline"
        >
          inbox
        </Link>
        .
      </p>
    </PageShell>
  );
}
