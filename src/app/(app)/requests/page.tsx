import type { Metadata } from "next";
import { BookRequestForm } from "@/components/book-requests/book-request-form";
import { BookRequestList } from "@/components/book-requests/book-request-list";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import {
  getPopularBookRequests,
  getUserBookRequests,
} from "@/lib/book-requests";
import { isAdmin } from "@/lib/auth/admin";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session-user";

export const metadata: Metadata = {
  title: "Request a Book",
};

export default async function RequestsPage() {
  await requireCompletedOnboarding();
  const auth = await getAuthenticatedUser();

  const [mine, popular, admin] = auth
    ? await Promise.all([
        getUserBookRequests(auth.userId),
        getPopularBookRequests(auth.userId),
        isAdmin(),
      ])
    : [[], [], false];

  return (
    <FadeIn className="mx-auto max-w-2xl space-y-10">
      <PageHeader
        title="Request a book"
        description="Can't find a title in the catalog? Ask for it here — admins review requests and add books when they can source them."
      />

      <BookRequestForm />

      <BookRequestList
        title="Your requests"
        description="Track status updates here when admins review your submissions."
        requests={mine}
        deleteMode="owner"
        emptyMessage="You haven't requested any books yet."
      />

      <BookRequestList
        title="Popular requests"
        description="Upvote titles you'd also like to see — admins prioritize high-demand requests."
        requests={popular}
        showRequester
        showVoteButton
        deleteMode={admin ? "admin" : undefined}
        emptyMessage="No open requests right now. Be the first to ask for a title."
      />
    </FadeIn>
  );
}
