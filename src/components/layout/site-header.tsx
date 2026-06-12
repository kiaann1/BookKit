import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { DevAuthBanner } from "@/components/layout/dev-auth-banner";
import { MainNav } from "@/components/layout/main-nav";
import { MessagesNavLink } from "@/components/layout/messages-nav-link";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MoreNav } from "@/components/layout/more-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { isAdmin } from "@/lib/auth/admin";
import { isAuthDisabled } from "@/lib/dev-auth";
import { navItemsForUser } from "@/lib/layout/nav-items";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await getSession();
  const authDisabled = isAuthDisabled();
  const admin = await isAdmin();
  const nav = navItemsForUser({ isAdmin: admin });

  return (
    <header
      id="site-header"
      className="safe-top sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl"
    >
      <DevAuthBanner />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4 lg:gap-6">
          <Logo href={session ? "/dashboard" : "/"} />

          {session ? (
            <div className="flex min-w-0 items-center">
              <MainNav items={nav.primary} />
              <MoreNav items={nav.more} />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {session ? (
            <>
              <NotificationBell />
              <MessagesNavLink />
              <UserMenu
                username={session.user.username}
                authDisabled={authDisabled}
                isAdmin={admin}
              />
              <MobileNav
                items={nav.mobile}
                username={session.user.username}
                authDisabled={authDisabled}
              />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="touch-manipulation">
                  <span className="sm:hidden">Join</span>
                  <span className="hidden sm:inline">Join free</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
