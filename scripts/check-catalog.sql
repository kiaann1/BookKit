-- Quick check: are books in the catalog database?
-- Run in Neon SQL Editor.

SELECT COUNT(*) AS published_count
FROM "Book"
WHERE status = 'PUBLISHED';

SELECT id, title, author, status
FROM "Book"
ORDER BY "createdAt" DESC;
