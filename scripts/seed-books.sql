-- BookKit: seed books from local storage metadata
-- Run in Neon SQL Editor.
-- PDFs/covers are NOT uploaded by this script — use:
--   npx tsx scripts/sync-storage-to-db.ts --upload-files

BEGIN;

-- System uploader (used when no registered user exists yet)
INSERT INTO "User" (
  "id", "email", "username", "name", "role", "createdAt", "updatedAt"
) VALUES (
  'bookkit-system-uploader',
  'system@bookkit.internal',
  'bookkit_system',
  'BookKit System',
  'ADMIN'::"UserRole",
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "updatedAt" = NOW();

-- Hekate
INSERT INTO "Book" (
  "id", "title", "author", "description", "coverKey", "pdfKey", "genres",
  "publishedAt", "seriesTitle", "seriesIndex", "status", "uploadedById",
  "createdAt", "updatedAt"
) VALUES (
  'hekate--nikita-gill',
  'Hekate',
  'Nikita Gill',
  NULL,
  NULL,
  'books/hekate--nikita-gill/original.pdf',
  ARRAY[]::text[],
  '2025-01-01T00:00:00.000Z',
  NULL,
  NULL,
  'PUBLISHED'::"BookStatus",
  COALESCE(
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1),
    (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1),
    'bookkit-system-uploader'
  ),
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "author" = EXCLUDED."author",
  "description" = EXCLUDED."description",
  "coverKey" = EXCLUDED."coverKey",
  "pdfKey" = EXCLUDED."pdfKey",
  "genres" = EXCLUDED."genres",
  "publishedAt" = EXCLUDED."publishedAt",
  "seriesTitle" = EXCLUDED."seriesTitle",
  "seriesIndex" = EXCLUDED."seriesIndex",
  "status" = EXCLUDED."status",
  "updatedAt" = NOW();

-- Medusa
INSERT INTO "Book" (
  "id", "title", "author", "description", "coverKey", "pdfKey", "genres",
  "publishedAt", "seriesTitle", "seriesIndex", "status", "uploadedById",
  "createdAt", "updatedAt"
) VALUES (
  'medusa--rosie-hewlett',
  'Medusa',
  'Rosie Hewlett',
  NULL,
  'books/medusa--rosie-hewlett/cover.jpg',
  'books/medusa--rosie-hewlett/original.pdf',
  ARRAY[]::text[],
  '2021-01-01T00:00:00.000Z',
  NULL,
  NULL,
  'PUBLISHED'::"BookStatus",
  COALESCE(
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1),
    (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1),
    'bookkit-system-uploader'
  ),
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "author" = EXCLUDED."author",
  "description" = EXCLUDED."description",
  "coverKey" = EXCLUDED."coverKey",
  "pdfKey" = EXCLUDED."pdfKey",
  "genres" = EXCLUDED."genres",
  "publishedAt" = EXCLUDED."publishedAt",
  "seriesTitle" = EXCLUDED."seriesTitle",
  "seriesIndex" = EXCLUDED."seriesIndex",
  "status" = EXCLUDED."status",
  "updatedAt" = NOW();

-- Project Hail Mary
INSERT INTO "Book" (
  "id", "title", "author", "description", "coverKey", "pdfKey", "genres",
  "publishedAt", "seriesTitle", "seriesIndex", "status", "uploadedById",
  "createdAt", "updatedAt"
) VALUES (
  'project-hail-mary--andy-weir',
  'Project Hail Mary',
  'Andy Weir',
  '“What’s two plus two?”',
  'books/project-hail-mary--andy-weir/cover.jpg',
  'books/project-hail-mary--andy-weir/original.pdf',
  ARRAY['Sci-Fi', 'Fiction', 'Thriller']::text[],
  '2021-01-01T00:00:00.000Z',
  NULL,
  NULL,
  'PUBLISHED'::"BookStatus",
  COALESCE(
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1),
    (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1),
    'bookkit-system-uploader'
  ),
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "author" = EXCLUDED."author",
  "description" = EXCLUDED."description",
  "coverKey" = EXCLUDED."coverKey",
  "pdfKey" = EXCLUDED."pdfKey",
  "genres" = EXCLUDED."genres",
  "publishedAt" = EXCLUDED."publishedAt",
  "seriesTitle" = EXCLUDED."seriesTitle",
  "seriesIndex" = EXCLUDED."seriesIndex",
  "status" = EXCLUDED."status",
  "updatedAt" = NOW();

-- Psychotic Obsession
INSERT INTO "Book" (
  "id", "title", "author", "description", "coverKey", "pdfKey", "genres",
  "publishedAt", "seriesTitle", "seriesIndex", "status", "uploadedById",
  "createdAt", "updatedAt"
) VALUES (
  'psychotic-obsession--leigh-rivers',
  'Psychotic Obsession',
  'Leigh Rivers',
  NULL,
  'books/psychotic-obsession--leigh-rivers/cover.jpg',
  'books/psychotic-obsession--leigh-rivers/original.pdf',
  ARRAY['Romance', 'Thriller']::text[],
  '2025-01-01T00:00:00.000Z',
  NULL,
  NULL,
  'PUBLISHED'::"BookStatus",
  COALESCE(
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1),
    (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1),
    'bookkit-system-uploader'
  ),
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "author" = EXCLUDED."author",
  "description" = EXCLUDED."description",
  "coverKey" = EXCLUDED."coverKey",
  "pdfKey" = EXCLUDED."pdfKey",
  "genres" = EXCLUDED."genres",
  "publishedAt" = EXCLUDED."publishedAt",
  "seriesTitle" = EXCLUDED."seriesTitle",
  "seriesIndex" = EXCLUDED."seriesIndex",
  "status" = EXCLUDED."status",
  "updatedAt" = NOW();

-- The Ascended
INSERT INTO "Book" (
  "id", "title", "author", "description", "coverKey", "pdfKey", "genres",
  "publishedAt", "seriesTitle", "seriesIndex", "status", "uploadedById",
  "createdAt", "updatedAt"
) VALUES (
  'the-ascended--grenwich-&-lennox',
  'The Ascended',
  'Grenwich & Lennox',
  NULL,
  'books/the-ascended--grenwich-&-lennox/cover.jpg',
  'books/the-ascended--grenwich-&-lennox/original.pdf',
  ARRAY[]::text[],
  '1988-01-01T00:00:00.000Z',
  NULL,
  NULL,
  'PUBLISHED'::"BookStatus",
  COALESCE(
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1),
    (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1),
    'bookkit-system-uploader'
  ),
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "author" = EXCLUDED."author",
  "description" = EXCLUDED."description",
  "coverKey" = EXCLUDED."coverKey",
  "pdfKey" = EXCLUDED."pdfKey",
  "genres" = EXCLUDED."genres",
  "publishedAt" = EXCLUDED."publishedAt",
  "seriesTitle" = EXCLUDED."seriesTitle",
  "seriesIndex" = EXCLUDED."seriesIndex",
  "status" = EXCLUDED."status",
  "updatedAt" = NOW();

-- The Courage to Be Disliked
INSERT INTO "Book" (
  "id", "title", "author", "description", "coverKey", "pdfKey", "genres",
  "publishedAt", "seriesTitle", "seriesIndex", "status", "uploadedById",
  "createdAt", "updatedAt"
) VALUES (
  'the-courage-to-be-disliked--ichiro-kishimi',
  'The Courage to Be Disliked',
  'Ichiro Kishimi',
  NULL,
  'books/the-courage-to-be-disliked--ichiro-kishimi/cover.jpg',
  'books/the-courage-to-be-disliked--ichiro-kishimi/original.pdf',
  ARRAY['Non-Fiction', 'Self-Help', 'Philosophy']::text[],
  NULL,
  NULL,
  NULL,
  'PUBLISHED'::"BookStatus",
  COALESCE(
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1),
    (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1),
    'bookkit-system-uploader'
  ),
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "author" = EXCLUDED."author",
  "description" = EXCLUDED."description",
  "coverKey" = EXCLUDED."coverKey",
  "pdfKey" = EXCLUDED."pdfKey",
  "genres" = EXCLUDED."genres",
  "publishedAt" = EXCLUDED."publishedAt",
  "seriesTitle" = EXCLUDED."seriesTitle",
  "seriesIndex" = EXCLUDED."seriesIndex",
  "status" = EXCLUDED."status",
  "updatedAt" = NOW();

-- The Poppy War
INSERT INTO "Book" (
  "id", "title", "author", "description", "coverKey", "pdfKey", "genres",
  "publishedAt", "seriesTitle", "seriesIndex", "status", "uploadedById",
  "createdAt", "updatedAt"
) VALUES (
  'the-poppy-war--r-f-kuang',
  'The Poppy War',
  'R F Kuang',
  'A gripping epic fantasy inspired by twentieth-century Chinese history, following war orphan Fang Runin as she rises from nothing to attend the empire''s most elite military school — and discovers how far she''ll go for revenge.',
  'books/the-poppy-war--r-f-kuang/cover.jpg',
  'books/the-poppy-war--r-f-kuang/original.pdf',
  ARRAY['Fantasy', 'Fiction', 'Historical Fiction']::text[],
  '2018-05-01T00:00:00.000Z',
  'The Poppy War',
  1,
  'PUBLISHED'::"BookStatus",
  COALESCE(
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1),
    (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1),
    'bookkit-system-uploader'
  ),
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "author" = EXCLUDED."author",
  "description" = EXCLUDED."description",
  "coverKey" = EXCLUDED."coverKey",
  "pdfKey" = EXCLUDED."pdfKey",
  "genres" = EXCLUDED."genres",
  "publishedAt" = EXCLUDED."publishedAt",
  "seriesTitle" = EXCLUDED."seriesTitle",
  "seriesIndex" = EXCLUDED."seriesIndex",
  "status" = EXCLUDED."status",
  "updatedAt" = NOW();

-- The Subtle Art of Not Giving a F*ck
INSERT INTO "Book" (
  "id", "title", "author", "description", "coverKey", "pdfKey", "genres",
  "publishedAt", "seriesTitle", "seriesIndex", "status", "uploadedById",
  "createdAt", "updatedAt"
) VALUES (
  'the-subtle-art-of-not-giving-a-fuck--mark-manson',
  'The Subtle Art of Not Giving a F*ck',
  'Mark Manson',
  NULL,
  'books/the-subtle-art-of-not-giving-a-fuck--mark-manson/cover.jpg',
  'books/the-subtle-art-of-not-giving-a-fuck--mark-manson/original.pdf',
  ARRAY['Nonfiction', 'Self-Help']::text[],
  NULL,
  NULL,
  NULL,
  'PUBLISHED'::"BookStatus",
  COALESCE(
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1),
    (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1),
    'bookkit-system-uploader'
  ),
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "author" = EXCLUDED."author",
  "description" = EXCLUDED."description",
  "coverKey" = EXCLUDED."coverKey",
  "pdfKey" = EXCLUDED."pdfKey",
  "genres" = EXCLUDED."genres",
  "publishedAt" = EXCLUDED."publishedAt",
  "seriesTitle" = EXCLUDED."seriesTitle",
  "seriesIndex" = EXCLUDED."seriesIndex",
  "status" = EXCLUDED."status",
  "updatedAt" = NOW();

COMMIT;
