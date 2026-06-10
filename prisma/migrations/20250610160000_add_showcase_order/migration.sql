-- AlterTable
ALTER TABLE "UserBook" ADD COLUMN "showcaseOrder" INTEGER;

-- CreateIndex
CREATE INDEX "UserBook_userId_showcaseOrder_idx" ON "UserBook"("userId", "showcaseOrder");
