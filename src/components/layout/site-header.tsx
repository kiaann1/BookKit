import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { DevAuthBanner } from "@/components/layout/dev-auth-banner";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { isAdmin } from "@/lib/auth/admin";
import { isAuthDisabled } from "@/lib/dev-auth";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/catalog", label: "Catalog" },
  { href: "/shelf", label: "Shelf" },
  { href: "/feed", label: "Feed" },
  { href: "/recommendations", label: "Discover" },
  { href: "/requests", label: "Requests" },
];

export async function SiteHeader() {
  const session = await getSession();
  const authDisabled = isAuthDisabled();
  const admin = await isAdmin();

  return (
    <header
      id="site-header"
      className="safe-top sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl"
    >
      <DevAuthBanner />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-6 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo href={session ? "/dashboard" : "/"} />

            {session && (
              <MainNav
                items={
                  admin
                    ? [...navItems, { href: "/admin/books", label: "Admin" }]
                    : navItems
                }
              />
            )}
        </div>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              {admin && (
                <Link href="/admin/books" className="hidden sm:inline">
                  <Button variant="outline" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
              <Link
                href="/profile"
                className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/8 hover:text-foreground sm:inline"
              >
                @{session.user.username}
              </Link>
              <Link href="/settings" className="hidden sm:inline">
                <Button variant="ghost" size="sm">
                  Settings
                </Button>
              </Link>
              {!authDisabled && (
                <SignOutButton className="hidden sm:inline-flex" />
              )}
              <MobileNav
                items={
                  admin
                    ? [...navItems, { href: "/admin/books", label: "Admin" }]
                    : navItems
                }
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
