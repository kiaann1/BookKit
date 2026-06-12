-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "typingUserId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "typingExpiresAt" TIMESTAMP(3);
