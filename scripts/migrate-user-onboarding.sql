-- Run in Neon SQL Editor if registration fails (missing firstName/lastName/phone columns).
-- Safe to re-run: uses IF NOT EXISTS patterns.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "genrePreferences" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "booksPerWeek" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_firstName_lastName_idx" ON "User"("firstName", "lastName");
