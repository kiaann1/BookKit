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
-- Optional: mark migrations applied (so future `prisma migrate deploy` skips them)
-- Only run if these rows are not already in "_prisma_migrations".
-- ---------------------------------------------------------------------------
-- INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
-- VALUES
--   (gen_random_uuid()::text, '', NOW(), '20250610180000_user_privacy', NULL, NULL, NOW(), 1),
--   (gen_random_uuid()::text, '', NOW(), '20250610190000_post_media', NULL, NULL, NOW(), 1);
