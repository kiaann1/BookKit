import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { presentNotification } from "@/lib/notifications/present";
import { getNotifications } from "@/lib/notifications";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  await requireCompletedOnboarding();
  const auth = await getAuthenticatedUser();
  const notifications = auth ? await getNotifications(auth.userId, { limit: 50 }) : [];

  return (
    <PageShell width="medium">
      <PageHeader
        title="Notifications"
        description="Follows, likes, comments, and book updates."
      />

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 px-5 py-14 text-center">
          <p className="font-medium">You&apos;re all caught up</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            New activity will show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => {
            const presentation = presentNotification(notification);
            return (
              <li key={notification.id}>
                <Link
                  href={presentation.href}
                  className={cn(
                    "block rounded-2xl border border-border/70 bg-card/80 p-4 transition hover:border-primary/30",
                    !notification.readAt && "border-primary/25 bg-primary/5",
                  )}
                >
                  <p className="font-medium">{presentation.title}</p>
                  {presentation.body ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {presentation.body}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
