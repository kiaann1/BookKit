-- Speed up book discussion queries (posts by book, reviews by book)
CREATE INDEX "Post_bookId_createdAt_idx" ON "Post"("bookId", "createdAt" DESC);

CREATE INDEX "UserBook_bookId_updatedAt_idx" ON "UserBook"("bookId", "updatedAt" DESC);
