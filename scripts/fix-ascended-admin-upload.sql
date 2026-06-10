-- The Ascended: admin upload may have created a cuid book + blob folder while the
-- catalog still uses the seeded slug id. Run in Neon SQL editor.

-- 1) See what you have
SELECT id, title, "pdfKey", "coverKey", status
FROM "Book"
WHERE title ILIKE '%ascended%'
ORDER BY "createdAt";

-- 2a) Keep the seeded slug id, point at the legacy blob path (recommended if you
--     already ran npm run db:upload-files — PDF is at books/the-ascended--grenwich-&-lennox/)
UPDATE "Book"
SET
  "pdfKey" = 'books/the-ascended--grenwich-&-lennox/original.pdf',
  "coverKey" = COALESCE("coverKey", 'books/the-ascended--grenwich-&-lennox/cover.jpg')
WHERE id = 'the-ascended--grenwich-and-lennox';

-- 2b) OR keep the admin upload blob (replace cuid with your folder name from Vercel Blob)
-- UPDATE "Book"
-- SET
--   "pdfKey" = 'books/cmq87oli50001jr04077hlc95/original.pdf',
--   "coverKey" = 'books/cmq87oli50001jr04077hlc95/cover.jpg'
-- WHERE id = 'the-ascended--grenwich-and-lennox';

-- 3) Remove duplicate admin row (only after step 2 points at a valid pdfKey)
DELETE FROM "UserBook" WHERE "bookId" = 'cmq87oli50001jr04077hlc95';
DELETE FROM "Book" WHERE id = 'cmq87oli50001jr04077hlc95';
