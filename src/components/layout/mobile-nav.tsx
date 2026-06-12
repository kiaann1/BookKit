"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BookMarked,
  Compass,
  LayoutGrid,
  Menu,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { useCompose } from "@/components/social/compose-context";
import type { NavSection } from "@/lib/layout/nav-items";
import { cn } from "@/lib/utils";

const drawerIcons: Record<string, typeof Bell> = {
  "/shelf": BookMarked,
  "/feed": LayoutGrid,
  "/people": Users,
  "/recommendations": Sparkles,
  "/requests": Compass,
  "/notifications": Bell,
  "/settings": Settings,
  "/admin/books": Shield,
};

type MobileNavProps = {
  sections: NavSection[];
  username: string;
  authDisabled: boolean;
};

export function MobileNav({ sections, username, authDisabled }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [openedAtPath, setOpenedAtPath] = useState<string | null>(null);
  const pathname = usePathname();
  const { openCompose } = useCompose();
  const isMenuOpen = open && openedAtPath === pathname;
  const profileHref = `/u/${username}`;

  function closeMenu() {
    setOpen(false);
    setOpenedAtPath(null);
  }

  function toggleMenu() {
    if (!isMenuOpen) {
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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
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
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <AnimatePresence>
        {isMenuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMenu}
            />

            <motion.nav
              id="mobile-nav"
              className="fixed inset-y-0 right-0 z-50 flex w-[min(88vw,21rem)] flex-col border-l border-border/80 bg-background shadow-2xl"
              style={{
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
                paddingTop: "env(safe-area-inset-top, 0px)",
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-4">
                <div>
                  <p className="font-display text-lg font-semibold tracking-tight">
                    Menu
                  </p>
                  <Link
                    href={profileHref}
                    onClick={closeMenu}
                    className="text-sm text-muted-foreground transition hover:text-foreground"
                  >
                    @{username}
                  </Link>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Close menu"
                  onClick={closeMenu}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="px-4 py-3">
                <Button
                  type="button"
                  className="w-full touch-manipulation"
                  onClick={() => {
                    closeMenu();
                    openCompose();
                  }}
                >
                  <Plus className="h-4 w-4" />
                  New post
                </Button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
                {sections.map((section) => (
                  <div key={section.title} className="mb-4">
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.title}
                    </p>
                    <ul className="space-y-0.5">
                      {section.items.map((item) => {
                        const Icon = drawerIcons[item.href] ?? LayoutGrid;
                        const isActive =
                          pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);

                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={closeMenu}
                              className={cn(
                                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors touch-manipulation",
                                isActive
                                  ? "bg-primary/10 font-medium text-primary"
                                  : "text-foreground/85 active:bg-muted/60",
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-5 w-5 shrink-0",
                                  isActive
                                    ? "text-primary"
                                    : "text-muted-foreground",
                                )}
                                strokeWidth={isActive ? 2.25 : 2}
                              />
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              {!authDisabled ? (
                <div className="border-t border-border/60 px-4 py-4">
                  <SignOutButton />
                </div>
              ) : null}
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
