-- CreateEnum
CREATE TYPE "FollowListVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'ONLY_SELF');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "followersListVisibility" "FollowListVisibility" NOT NULL DEFAULT 'PUBLIC';
