import Image from "next/image";
import Link from "next/link";
import { postPath } from "@/lib/social/paths";
import type { PostItem } from "@/lib/social/types";

type FriendPostPreviewProps = {
  post: PostItem;
};

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString();
}

function previewText(post: PostItem) {
  if (post.type === "ARTICLE" && post.title) {
    return post.title;
  }
  if (post.body.trim()) {
    return post.body.trim();
  }
  if (post.type === "IMAGE") {
    return "Shared a photo";
  }
  if (post.type === "VIDEO") {
    return "Shared a video";
  }
  return "Shared a post";
}

export function FriendPostPreview({ post }: FriendPostPreviewProps) {
  const text = previewText(post);

  return (
    <Link
      href={postPath(post.id)}
      className="flex gap-3 rounded-xl border border-border/80 bg-card/50 p-3 transition hover:border-primary/30 hover:bg-card"
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary/15 to-brand-coral/15">
        {post.author.avatarUrl ? (
          <Image
            src={post.author.avatarUrl}
            alt=""
            fill
            className="object-cover"
            sizes="40px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-medium text-primary">
            {post.author.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium">{post.author.displayName}</p>
          <time
            dateTime={new Date(post.createdAt).toISOString()}
            className="shrink-0 text-xs text-muted-foreground"
          >
            {formatRelativeTime(post.createdAt)}
          </time>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
          {text}
        </p>
        {post.mediaUrl && post.type === "IMAGE" ? (
          <div className="relative mt-2 aspect-[16/9] max-h-24 overflow-hidden rounded-lg bg-muted/30">
            <Image
              src={post.mediaUrl}
              alt=""
              fill
              className="object-cover"
              sizes="200px"
              unoptimized
            />
          </div>
        ) : null}
        {post.book ? (
          <p className="mt-1 truncate text-xs text-primary">
            {post.book.title}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
