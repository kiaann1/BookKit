import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readBookPath } from "@/lib/books/paths";
import { cn } from "@/lib/utils";

type ReadBookButtonProps = {
  bookId: string;
  label?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
  fullWidth?: boolean;
};

export function ReadBookButton({
  bookId,
  label = "Start reading",
  variant = "default",
  size = "default",
  className,
  fullWidth,
}: ReadBookButtonProps) {
  const widthClass = cn(fullWidth && "block w-full", className);

  return (
    <Link
      href={readBookPath(bookId)}
      className={widthClass || undefined}
    >
      <Button
        variant={variant}
        size={size}
        className={cn(fullWidth && "w-full", className)}
      >
        <BookOpen className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
}
