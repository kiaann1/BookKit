import { BookStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { bookCoverKey, bookPdfKey } from "@/lib/storage/keys";

const SYSTEM_UPLOADER_ID = "bookkit-system-uploader";

type CatalogSeedBook = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverKey: string | null;
  genres: string[];
  publishedAt: Date | null;
  seriesTitle?: string | null;
  seriesIndex?: number | null;
};

const CATALOG_SEED_BOOKS: CatalogSeedBook[] = [
  {
    id: "hekate--nikita-gill",
    title: "Hekate",
    author: "Nikita Gill",
    description: null,
    coverKey: bookCoverKey("hekate--nikita-gill", "jpg"),
    genres: [] as string[],
    publishedAt: new Date("2025-01-01T00:00:00.000Z"),
  },
  {
    id: "medusa--rosie-hewlett",
    title: "Medusa",
    author: "Rosie Hewlett",
    description: null,
    coverKey: bookCoverKey("medusa--rosie-hewlett", "jpg"),
    genres: [],
    publishedAt: new Date("2021-01-01T00:00:00.000Z"),
  },
  {
    id: "project-hail-mary--andy-weir",
    title: "Project Hail Mary",
    author: "Andy Weir",
    description: "What's two plus two?",
    coverKey: bookCoverKey("project-hail-mary--andy-weir", "jpg"),
    genres: ["Sci-Fi", "Fiction", "Thriller"],
    publishedAt: new Date("2021-01-01T00:00:00.000Z"),
  },
  {
    id: "psychotic-obsession--leigh-rivers",
    title: "Psychotic Obsession",
    author: "Leigh Rivers",
    description: null,
    coverKey: bookCoverKey("psychotic-obsession--leigh-rivers", "jpg"),
    genres: ["Romance", "Thriller"],
    publishedAt: new Date("2025-01-01T00:00:00.000Z"),
  },
  {
    id: "the-ascended--grenwich-&-lennox",
    title: "The Ascended",
    author: "Grenwich & Lennox",
    description: null,
    coverKey: bookCoverKey("the-ascended--grenwich-&-lennox", "jpg"),
    genres: [],
    publishedAt: new Date("1988-01-01T00:00:00.000Z"),
  },
  {
    id: "the-courage-to-be-disliked--ichiro-kishimi",
    title: "The Courage to Be Disliked",
    author: "Ichiro Kishimi",
    description: null,
    coverKey: bookCoverKey("the-courage-to-be-disliked--ichiro-kishimi", "jpg"),
    genres: ["Non-Fiction", "Self-Help", "Philosophy"],
    publishedAt: null,
  },
  {
    id: "the-poppy-war--r-f-kuang",
    title: "The Poppy War",
    author: "R F Kuang",
    description:
      "A gripping epic fantasy inspired by twentieth-century Chinese history.",
    coverKey: bookCoverKey("the-poppy-war--r-f-kuang", "jpg"),
    genres: ["Fantasy", "Fiction", "Historical Fiction"],
    publishedAt: new Date("2018-05-01T00:00:00.000Z"),
    seriesTitle: "The Poppy War",
    seriesIndex: 1,
  },
  {
    id: "the-subtle-art-of-not-giving-a-fuck--mark-manson",
    title: "The Subtle Art of Not Giving a F*ck",
    author: "Mark Manson",
    description: null,
    coverKey: bookCoverKey("the-subtle-art-of-not-giving-a-fuck--mark-manson", "jpg"),
    genres: ["Nonfiction", "Self-Help"],
    publishedAt: null,
  },
];

async function ensureSystemUploader() {
  await prisma.user.upsert({
    where: { id: SYSTEM_UPLOADER_ID },
    create: {
      id: SYSTEM_UPLOADER_ID,
      email: "system@bookkit.internal",
      username: "bookkit_system",
      name: "BookKit System",
      role: UserRole.ADMIN,
    },
    update: {
      role: UserRole.ADMIN,
    },
  });
}

async function resolveUploaderId() {
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (admin) {
    return admin.id;
  }

  const anyUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (anyUser) {
    return anyUser.id;
  }

  await ensureSystemUploader();
  return SYSTEM_UPLOADER_ID;
}

export async function seedCatalogBooks() {
  await ensureSystemUploader();
  const uploadedById = await resolveUploaderId();

  let upserted = 0;

  for (const book of CATALOG_SEED_BOOKS) {
    await prisma.book.upsert({
      where: { id: book.id },
      create: {
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        coverKey: book.coverKey,
        pdfKey: bookPdfKey(book.id),
        genres: [...book.genres],
        publishedAt: book.publishedAt,
        seriesTitle: book.seriesTitle ?? null,
        seriesIndex: book.seriesIndex ?? null,
        status: BookStatus.PUBLISHED,
        uploadedById,
      },
      update: {
        title: book.title,
        author: book.author,
        description: book.description,
        coverKey: book.coverKey,
        pdfKey: bookPdfKey(book.id),
        genres: [...book.genres],
        publishedAt: book.publishedAt,
        seriesTitle: book.seriesTitle ?? null,
        seriesIndex: book.seriesIndex ?? null,
        status: BookStatus.PUBLISHED,
        uploadedById,
      },
    });
    upserted += 1;
  }

  return { upserted, total: CATALOG_SEED_BOOKS.length };
}

/** Number of books in the default seed catalog (used for Phase 1 health checks). */
export const CATALOG_SEED_BOOK_COUNT = CATALOG_SEED_BOOKS.length;
