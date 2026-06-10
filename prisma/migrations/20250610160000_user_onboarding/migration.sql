-- AlterTable
ALTER TABLE "User" ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "genrePreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "booksPerWeek" INTEGER,
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_firstName_lastName_idx" ON "User"("firstName", "lastName");
