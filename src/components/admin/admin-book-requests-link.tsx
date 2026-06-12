import Link from "next/link";
import { Button } from "@/components/ui/button";
import { countPendingBookRequests } from "@/lib/book-requests";
import { cn } from "@/lib/utils";

type AdminBookRequestsLinkProps = {
  className?: string;
  buttonClassName?: string;
};

export async function AdminBookRequestsLink({
  className,
  buttonClassName,
}: AdminBookRequestsLinkProps) {
  const pendingCount = await countPendingBookRequests();

  return (
    <Link href="/admin/requests" className={cn("relative inline-flex", className)}>
      <Button variant="outline" className={buttonClassName}>
        Book requests
      </Button>
      {pendingCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-sm">
          {pendingCount > 9 ? "9+" : pendingCount}
        </span>
      ) : null}
    </Link>
  );
}
