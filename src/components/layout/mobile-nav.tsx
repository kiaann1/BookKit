"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

type MobileNavProps = {
  items: NavItem[];
  username: string;
  authDisabled: boolean;
};

export function MobileNav({ items, username, authDisabled }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [openedAtPath, setOpenedAtPath] = useState<string | null>(null);
  const [menuTop, setMenuTop] = useState(0);
  const pathname = usePathname();
  const isMenuOpen = open && openedAtPath === pathname;

  function updateMenuTop() {
    const header = document.getElementById("site-header");
    setMenuTop(header?.getBoundingClientRect().bottom ?? 64);
  }

  function closeMenu() {
    setOpen(false);
    setOpenedAtPath(null);
  }

  function toggleMenu() {
    if (!isMenuOpen) {
      updateMenuTop();
      setOpenedAtPath(pathname);
      setOpen(true);
      return;
    }
    closeMenu();
  }

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    function onResize() {
      updateMenuTop();
    }

    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-nav"
        onClick={toggleMenu}
      >
        {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {isMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-x-0 bottom-0 z-40 bg-foreground/10"
            style={{ top: menuTop }}
            onClick={closeMenu}
          />
          <nav
            id="mobile-nav"
            className="fixed inset-x-0 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border/80 bg-background/95 backdrop-blur-xl"
            style={{ top: menuTop }}
          >
            <div className="mx-auto max-w-6xl space-y-0 px-4 py-2">
              {items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={cn(
                      "block rounded-lg px-3 py-3.5 text-sm transition-colors touch-manipulation",
                      isActive
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="my-2 h-px bg-border" />

              <Link
                href={`/u/${username}`}
                onClick={closeMenu}
                className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground"
              >
                @{username}
              </Link>
              <Link
                href="/messages"
                onClick={closeMenu}
                className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground"
              >
                Messages
              </Link>
              <Link
                href="/notifications"
                onClick={closeMenu}
                className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground"
              >
                Notifications
              </Link>
              <Link
                href="/settings"
                onClick={closeMenu}
                className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground"
              >
                Settings
              </Link>

              {!authDisabled && (
                <div className="px-1 pt-3">
                  <SignOutButton />
                </div>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
