-- Fix The Ascended book id: `&` in URLs is parsed as a query separator.
-- Run in Neon SQL Editor after deploying the code fix.
-- Blob paths are unchanged (still contain `&` in the storage key).

BEGIN;

UPDATE "UserBook"
SET "bookId" = 'the-ascended--grenwich-and-lennox'
WHERE "bookId" = 'the-ascended--grenwich-&-lennox';

INSERT INTO "Book" (
  "id", "title", "author", "description", "coverKey", "pdfKey", "genres",
  "publishedAt", "seriesTitle", "seriesIndex", "status", "uploadedById",
  "createdAt", "updatedAt"
)
SELECT
  'the-ascended--grenwich-and-lennox',
  "title", "author", "description", "coverKey", "pdfKey", "genres",
  "publishedAt", "seriesTitle", "seriesIndex", "status", "uploadedById",
  "createdAt", NOW()
FROM "Book"
WHERE "id" = 'the-ascended--grenwich-&-lennox'
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "author" = EXCLUDED."author",
  "coverKey" = EXCLUDED."coverKey",
  "pdfKey" = EXCLUDED."pdfKey",
  "updatedAt" = NOW();

DELETE FROM "Book" WHERE "id" = 'the-ascended--grenwich-&-lennox';

COMMIT;
