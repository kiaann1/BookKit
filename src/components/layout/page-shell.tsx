import { cn } from "@/lib/utils";

type PageWidth = "narrow" | "medium" | "wide";

const widthClass: Record<PageWidth, string> = {
  narrow: "max-w-xl",
  medium: "max-w-2xl",
  wide: "max-w-3xl",
};

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  width?: PageWidth;
};

/** Content wrapper inside `(app)/layout` — avoids duplicate max-width/padding on pages. */
export function PageShell({
  children,
  className,
  width,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "page-enter page-stack flex w-full flex-col",
        width ? cn("mx-auto", widthClass[width]) : undefined,
        className,
      )}
    >
      {children}
    </div>
  );
}
