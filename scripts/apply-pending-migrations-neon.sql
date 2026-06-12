-- Run this in Neon → SQL Editor if `npx prisma migrate deploy` cannot reach the DB.
-- Safe to re-run: uses IF NOT EXISTS / duplicate handling.

-- ---------------------------------------------------------------------------
-- 1. Social core (skip if you already have Post / Follow tables)
-- ---------------------------------------------------------------------------
-- See: prisma/migrations/20250610170000_social_core/migration.sql
-- If profiles error with missing Follow/Post tables, run that file instead.

-- ---------------------------------------------------------------------------
-- 2. User privacy (20250610180000_user_privacy)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "FollowListVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'ONLY_SELF');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "followersListVisibility" "FollowListVisibility" NOT NULL DEFAULT 'PUBLIC';

-- ---------------------------------------------------------------------------
-- 3. Post media types (20250610190000_post_media) — fixes Post.type P2022
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "PostType" AS ENUM ('TEXT', 'IMAGE', 'ARTICLE', 'VIDEO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "type" "PostType" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "mediaKey" TEXT;

-- ---------------------------------------------------------------------------
-- 4. Discussion indexes (20250610200000_discussion_indexes)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "Post_bookId_createdAt_idx" ON "Post"("bookId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "UserBook_bookId_updatedAt_idx" ON "UserBook"("bookId", "updatedAt" DESC);

-- ---------------------------------------------------------------------------
-- 5. User block & report (20250610210000_user_block_report)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "UserBlock" (
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("blockerId","blockedId")
);

CREATE TABLE IF NOT EXISTS "UserReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");
CREATE INDEX IF NOT EXISTS "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserReport_reporterId_reportedUserId_key" ON "UserReport"("reporterId", "reportedUserId");
CREATE INDEX IF NOT EXISTS "UserReport_reportedUserId_idx" ON "UserReport"("reportedUserId");

DO $$ BEGIN
  ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 6. Book requests (20250610220000_book_requests)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "BookRequestStatus" AS ENUM ('PENDING', 'SOURCED', 'ADDED', 'DECLINED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "BookRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "notes" TEXT,
    "isbn" TEXT,
    "status" "BookRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "linkedBookId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BookRequestVote" (
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookRequestVote_pkey" PRIMARY KEY ("requestId","userId")
);

CREATE INDEX IF NOT EXISTS "BookRequest_status_createdAt_idx" ON "BookRequest"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "BookRequest_userId_createdAt_idx" ON "BookRequest"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "BookRequestVote_requestId_idx" ON "BookRequestVote"("requestId");

DO $$ BEGIN
  ALTER TABLE "BookRequest" ADD CONSTRAINT "BookRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "BookRequest" ADD CONSTRAINT "BookRequest_linkedBookId_fkey" FOREIGN KEY ("linkedBookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "BookRequestVote" ADD CONSTRAINT "BookRequestVote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BookRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "BookRequestVote" ADD CONSTRAINT "BookRequestVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 7. Notifications & messages (20250610230000_notifications_messages)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('NEW_BOOK_IN_GENRE', 'FOLLOW', 'POST_LIKE', 'POST_COMMENT', 'BOOK_REQUEST_UPDATED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL,
    "participantLowId" TEXT NOT NULL,
    "participantHighId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_participantLowId_participantHighId_key" ON "Conversation"("participantLowId", "participantHighId");
CREATE INDEX IF NOT EXISTS "Conversation_participantLowId_lastMessageAt_idx" ON "Conversation"("participantLowId", "lastMessageAt" DESC);
CREATE INDEX IF NOT EXISTS "Conversation_participantHighId_lastMessageAt_idx" ON "Conversation"("participantHighId", "lastMessageAt" DESC);
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participantLowId_fkey" FOREIGN KEY ("participantLowId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participantHighId_fkey" FOREIGN KEY ("participantHighId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Optional: mark migrations applied (so future `prisma migrate deploy` skips them)
-- Only run if these rows are not already in "_prisma_migrations".
-- ---------------------------------------------------------------------------
-- INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
-- VALUES
--   (gen_random_uuid()::text, '', NOW(), '20250610180000_user_privacy', NULL, NULL, NOW(), 1),
--   (gen_random_uuid()::text, '', NOW(), '20250610190000_post_media', NULL, NULL, NOW(), 1),
--   (gen_random_uuid()::text, '', NOW(), '20250610220000_book_requests', NULL, NULL, NOW(), 1),
--   (gen_random_uuid()::text, '', NOW(), '20250610230000_notifications_messages', NULL, NULL, NOW(), 1);
