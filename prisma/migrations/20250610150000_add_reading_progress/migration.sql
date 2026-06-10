-- AlterTable
ALTER TABLE "UserBook" ADD COLUMN "currentPage" INTEGER,
ADD COLUMN "totalPages" INTEGER,
ADD COLUMN "progressPercent" DOUBLE PRECISION,
ADD COLUMN "lastReadAt" TIMESTAMP(3);
