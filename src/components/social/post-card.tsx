"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Flag, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { catalogBookPath } from "@/lib/books/paths";
import type { CommentItem, PostItem } from "@/lib/social/types";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: PostItem;
};

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export function PostCard({ post: initialPost }: PostCardProps) {
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reported, setReported] = useState(false);

  async function toggleLike() {
    const response = await fetch(`/api/posts/${post.id}/like`, {
      method: "POST",
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { liked: boolean };
    setPost((current) => ({
      ...current,
      likedByViewer: data.liked,
      likeCount: current.likeCount + (data.liked ? 1 : -1),
    }));
  }

  async function loadComments() {
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { comments: CommentItem[] };
      setComments(data.comments);
    } finally {
      setLoadingComments(false);
    }
  }

  async function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      await loadComments();
    }
  }

  async function submitComment() {
    if (!commentBody.trim()) {
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody.trim() }),
      });

      if (!response.ok) {
        return;
      }

      setCommentBody("");
      setPost((current) => ({
        ...current,
        commentCount: current.commentCount + 1,
      }));
      await loadComments();
      setShowComments(true);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function reportPost() {
    const response = await fetch(`/api/posts/${post.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Reported from feed" }),
    });

    if (response.ok) {
      setReported(true);
    }
  }

  return (
    <article className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Link href={`/u/${post.author.username}`} className="shrink-0">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-primary/15 to-brand-coral/15">
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
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/u/${post.author.username}`}
              className="font-medium hover:text-primary"
            >
              {post.author.displayName}
            </Link>
            <span className="text-sm text-muted-foreground">
              @{post.author.username}
            </span>
            <span className="text-xs text-muted-foreground">
              · {formatRelativeTime(post.createdAt)}
            </span>
          </div>

          {post.type === "ARTICLE" && post.title ? (
            <h4 className="mt-3 font-display text-base font-semibold leading-snug">
              {post.title}
            </h4>
          ) : null}

          {post.mediaUrl && post.type === "IMAGE" ? (
            <div className="relative mt-3 aspect-[4/5] max-h-[28rem] w-full overflow-hidden rounded-2xl bg-muted/30">
              <Image
                src={post.mediaUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 640px"
                unoptimized
              />
            </div>
          ) : null}

          {post.mediaUrl && post.type === "VIDEO" ? (
            <video
              src={post.mediaUrl}
              controls
              className="mt-3 max-h-[28rem] w-full rounded-2xl bg-black"
            />
          ) : null}

          {post.body ? (
            <p
              className={cn(
                "whitespace-pre-wrap text-sm leading-relaxed",
                post.type === "ARTICLE" ? "mt-2" : "mt-3",
              )}
            >
              {post.body}
            </p>
          ) : null}

          {post.book ? (
            <Link
              href={catalogBookPath(post.book.id)}
              className="mt-4 flex items-center gap-3 rounded-xl border border-border/80 bg-muted/30 p-3 transition hover:border-primary/30"
            >
              <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-primary/10 to-brand-coral/10">
                {post.book.coverUrl ? (
                  <Image
                    src={post.book.coverUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium">{post.book.title}</p>
                <p className="text-xs text-muted-foreground">{post.book.author}</p>
              </div>
            </Link>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(post.likedByViewer && "text-primary")}
              onClick={() => void toggleLike()}
            >
              <Heart
                className={cn("h-4 w-4", post.likedByViewer && "fill-current")}
              />
              {post.likeCount}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void toggleComments()}
            >
              <MessageCircle className="h-4 w-4" />
              {post.commentCount}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={reported}
              onClick={() => void reportPost()}
            >
              <Flag className="h-4 w-4" />
              {reported ? "Reported" : "Report"}
            </Button>
          </div>

          {showComments ? (
            <div className="mt-4 space-y-3 border-t border-border/80 pt-4">
              {loadingComments ? (
                <p className="text-sm text-muted-foreground">Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="text-sm">
                    <p className="font-medium">
                      <Link
                        href={`/u/${comment.author.username}`}
                        className="hover:text-primary"
                      >
                        {comment.author.displayName}
                      </Link>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                      {comment.body}
                    </p>
                  </div>
                ))
              )}

              <div className="space-y-2">
                <Textarea
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  rows={2}
                  placeholder="Write a comment…"
                  maxLength={1000}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={submittingComment || !commentBody.trim()}
                  onClick={() => void submitComment()}
                >
                  {submittingComment ? "Posting…" : "Comment"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
