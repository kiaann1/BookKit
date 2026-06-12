"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MessagesNavLink() {
  const pathname = usePathname();
  const isActive =
    pathname === "/messages" || pathname.startsWith("/messages/");

  return (
    <Link href="/messages" className="hidden sm:inline-flex">
      <Button
        variant="ghost"
        size="sm"
        className={cn("relative px-2.5", isActive && "text-foreground")}
        aria-label="Messages"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    </Link>
  );
}
