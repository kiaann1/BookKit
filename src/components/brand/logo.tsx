import Link from "next/link";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  className?: string;
};

export function Logo({ href = "/", className }: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient shadow-md shadow-primary/20">
        <BookOpen className="h-4 w-4 text-white" strokeWidth={2.25} />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">
        <span className="text-brand-gradient">Book</span>
        <span className="text-foreground">Kit</span>
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
