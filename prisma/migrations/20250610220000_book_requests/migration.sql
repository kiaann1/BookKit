-- CreateEnum
CREATE TYPE "BookRequestStatus" AS ENUM ('PENDING', 'SOURCED', 'ADDED', 'DECLINED');

-- CreateTable
CREATE TABLE "BookRequest" (
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

-- CreateTable
CREATE TABLE "BookRequestVote" (
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookRequestVote_pkey" PRIMARY KEY ("requestId","userId")
);

-- CreateIndex
CREATE INDEX "BookRequest_status_createdAt_idx" ON "BookRequest"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BookRequest_userId_createdAt_idx" ON "BookRequest"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BookRequestVote_requestId_idx" ON "BookRequestVote"("requestId");

-- AddForeignKey
ALTER TABLE "BookRequest" ADD CONSTRAINT "BookRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookRequest" ADD CONSTRAINT "BookRequest_linkedBookId_fkey" FOREIGN KEY ("linkedBookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookRequestVote" ADD CONSTRAINT "BookRequestVote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BookRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookRequestVote" ADD CONSTRAINT "BookRequestVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
