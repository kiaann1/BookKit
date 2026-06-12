import Image from "next/image";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatAvatarProps = {
  src: string | null;
  name: string;
  size?: "sm" | "md";
  className?: string;
};

const sizeClasses = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
};

const iconClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
};

export function ChatAvatar({
  src,
  name,
  size = "md",
  className,
}: ChatAvatarProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-border/60 bg-gradient-to-br from-primary/15 to-brand-coral/15",
        sizeClasses[size],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes={size === "sm" ? "36px" : "40px"}
          unoptimized
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <UserRound className={cn(iconClasses[size], "text-primary/60")} />
          <span className="sr-only">{name}</span>
        </div>
      )}
    </div>
  );
}
