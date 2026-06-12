import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { catalogBookPath } from "@/lib/books/paths";
import type { FriendReadingItem } from "@/lib/social/types";

type FriendsReadingRowProps = {
  items: FriendReadingItem[];
};

export function FriendsReadingRow({ items }: FriendsReadingRowProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-hide">
      {items.map((item) => (
        <Link
          key={`${item.reader.id}-${item.book.id}`}
          href={catalogBookPath(item.book.id)}
          className="flex w-[9.5rem] shrink-0 flex-col rounded-xl border border-border/80 bg-card/50 p-3 transition hover:border-primary/30 hover:bg-card sm:w-[10.5rem]"
        >
          <div className="relative mx-auto h-28 w-[4.5rem] overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-brand-coral/10">
            {item.book.coverUrl ? (
              <Image
                src={item.book.coverUrl}
                alt=""
                fill
                className="object-cover"
                sizes="72px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary/50" />
              </div>
            )}
          </div>

          <p className="mt-3 line-clamp-2 text-sm font-medium leading-snug">
            {item.book.title}
          </p>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {item.book.author}
          </p>
          <p className="mt-2 line-clamp-1 text-xs text-primary">
            {item.reader.displayName} is reading
          </p>
          {item.progressPercent && item.progressPercent > 0 ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {Math.round(item.progressPercent)}% through
            </p>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
