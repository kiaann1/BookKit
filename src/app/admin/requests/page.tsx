import type { Metadata } from "next";
import Link from "next/link";
import { AdminRequestQueue } from "@/components/admin/admin-request-queue";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { getAdminBookRequests } from "@/lib/book-requests";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book requests",
};

export default async function AdminRequestsPage() {
  const requests = await getAdminBookRequests({ limit: 100 });

  return (
    <FadeIn className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Book requests"
          description="Triage reader requests, update status, and link fulfilled titles to the catalog."
        />
        <Link href="/admin/books">
          <Button variant="outline">Manage books</Button>
        </Link>
      </div>

      <AdminRequestQueue initialRequests={requests} />
    </FadeIn>
  );
}
