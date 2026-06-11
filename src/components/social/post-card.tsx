"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Flag, Heart, MessageCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReportPostDialog } from "@/components/social/report-post-dialog";
import { catalogBookPath } from "@/lib/books/paths";
import type { PostReportReason } from "@/lib/constants/report-reasons";
import { postPath } from "@/lib/social/paths";
import type { CommentItem, PostItem } from "@/lib/social/types";
import { cn } from "@/lib/utils";

const FEED_COMMENT_PREVIEW_LIMIT = 3;

type PostCardProps = {
  post: PostItem;
  variant?: "card" | "timeline";
  mode?: "feed" | "detail";
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

export function PostCard({
  post: initialPost,
  variant = "card",
  mode = "feed",
}: PostCardProps) {
  const isDetail = mode === "detail";
  const reduceMotion = useReducedMotion();

  const [post, setPost] = useState(initialPost);
  const [commentsOpen, setCommentsOpen] = useState(isDetail);
  const [showComposer, setShowComposer] = useState(isDetail);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reported, setReported] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  useEffect(() => {
    if (isDetail) {
      void loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per post in detail view
  }, [isDetail, post.id]);

  async function toggleLike() {
    const wasLiked = post.likedByViewer;
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

    if (data.liked && !wasLiked && !reduceMotion) {
      setLikeAnimating(true);
    }
  }

  async function loadComments() {
    setLoadingComments(true);
    try {
      const url = isDetail
        ? `/api/posts/${post.id}/comments`
        : `/api/posts/${post.id}/comments?limit=${FEED_COMMENT_PREVIEW_LIMIT}`;
      const response = await fetch(url);
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { comments: CommentItem[] };
      setComments(data.comments);
    } finally {
      setLoadingComments(false);
    }
  }

  async function openComments() {
    if (isDetail) {
      return;
    }

    if (commentsOpen && !showComposer) {
      setShowComposer(true);
      return;
    }

    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);

    if (nextOpen) {
      setShowComposer(true);
      if (comments.length === 0) {
        await loadComments();
      }
    } else {
      setShowComposer(false);
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

      if (!isDetail) {
        setShowComposer(false);
        setCommentsOpen(true);
      }

      await loadComments();
    } finally {
      setSubmittingComment(false);
    }
  }

  async function submitReport(reason: PostReportReason, details?: string) {
    const response = await fetch(`/api/posts/${post.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details }),
    });

    if (response.ok) {
      setReported(true);
      return true;
    }

    return false;
  }

  const isTimeline = variant === "timeline";
  const showViewAllComments =
    !isDetail && post.commentCount > FEED_COMMENT_PREVIEW_LIMIT;

  return (
    <>
      <article
        className={cn(
          isTimeline
            ? "border-b border-border/80 px-4 py-4"
            : "rounded-2xl border border-border/80 bg-card p-4 sm:p-5",
        )}
      >
        <div className={cn("flex items-start gap-3", isTimeline && "gap-3")}>
          <Link href={`/u/${post.author.username}`} className="shrink-0">
            <div
              className={cn(
                "relative overflow-hidden rounded-full bg-gradient-to-br from-primary/15 to-brand-coral/15",
                isTimeline ? "h-11 w-11" : "h-10 w-10",
              )}
            >
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
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/u/${post.author.username}`}
                  className="block truncate font-medium hover:text-primary"
                >
                  {post.author.displayName}
                </Link>
                <p className="truncate text-sm text-muted-foreground">
                  @{post.author.username}
                </p>
              </div>
              <time
                dateTime={new Date(post.createdAt).toISOString()}
                className="shrink-0 text-xs text-muted-foreground"
              >
                {formatRelativeTime(post.createdAt)}
              </time>
            </div>

            {post.type === "ARTICLE" && post.title ? (
              <h4 className="mt-3 font-display text-base font-semibold leading-snug">
                {post.title}
              </h4>
            ) : null}

            {post.mediaUrl && post.type === "IMAGE" ? (
              <div
                className={cn(
                  "relative mt-3 aspect-[4/5] max-h-[28rem] w-full overflow-hidden bg-muted/30",
                  isTimeline ? "rounded-xl" : "rounded-2xl",
                )}
              >
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
                  "whitespace-pre-wrap leading-relaxed",
                  isTimeline ? "mt-2 text-[15px]" : "mt-3 text-sm",
                  post.type === "ARTICLE" && "mt-2",
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
                  <p className="line-clamp-2 text-sm font-medium">
                    {post.book.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {post.book.author}
                  </p>
                </div>
              </Link>
            ) : null}

            <div
              className={cn(
                "mt-3 flex items-center gap-1",
                isTimeline && "-ml-2",
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1.5 text-muted-foreground",
                  post.likedByViewer && "text-primary",
                )}
                onClick={() => void toggleLike()}
              >
                <motion.span
                  className="inline-flex"
                  animate={
                    likeAnimating
                      ? { scale: [1, 1.35, 1], rotate: [0, -12, 0] }
                      : { scale: 1, rotate: 0 }
                  }
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  onAnimationComplete={() => setLikeAnimating(false)}
                >
                  <Heart
                    className={cn(
                      "h-[18px] w-[18px]",
                      post.likedByViewer && "fill-current",
                    )}
                  />
                </motion.span>
                <span className="text-xs tabular-nums">{post.likeCount}</span>
              </Button>
              {isDetail ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 text-muted-foreground">
                  <MessageCircle className="h-[18px] w-[18px]" />
                  <span className="text-xs tabular-nums">
                    {post.commentCount}
                  </span>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1.5 text-muted-foreground",
                    commentsOpen && "text-foreground",
                  )}
                  onClick={() => void openComments()}
                >
                  <MessageCircle className="h-[18px] w-[18px]" />
                  <span className="text-xs tabular-nums">
                    {post.commentCount}
                  </span>
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8 text-muted-foreground"
                disabled={reported}
                onClick={() => setReportDialogOpen(true)}
                aria-label={reported ? "Reported" : "Report post"}
              >
                <Flag className={cn("h-4 w-4", reported && "text-primary")} />
              </Button>
            </div>

            {commentsOpen ? (
              <div className="mt-4 space-y-3 border-t border-border/80 pt-4">
                {loadingComments ? (
                  <p className="text-sm text-muted-foreground">
                    Loading comments…
                  </p>
                ) : comments.length === 0 && !showComposer ? (
                  <p className="text-sm text-muted-foreground">
                    No comments yet.
                  </p>
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

                {showViewAllComments ? (
                  <Link
                    href={postPath(post.id)}
                    className={buttonVariants({
                      variant: "link",
                      className: "h-auto p-0 text-sm text-muted-foreground",
                    })}
                  >
                    View all comments
                  </Link>
                ) : null}

                {showComposer ? (
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
                ) : null}

                {isDetail && !loadingComments && comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No comments yet. Be the first to reply.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </article>

      <ReportPostDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        onSubmit={submitReport}
      />
    </>
  );
}
