import { PrismaClient, UserRole } from "@prisma/client";
import { writeBookMetadata } from "../src/lib/books/metadata";
import { BookStatus } from "../src/lib/constants/book-status";
import { existsSync, mkdirSync, renameSync } from "fs";
import path from "path";
import { bookPdfKey } from "../src/lib/storage/keys";

const prisma = new PrismaClient();

const TEST_BOOK_ID = "the-poppy-war";
const PDF_KEY = bookPdfKey(TEST_BOOK_ID);

async function main() {
  const storageDir = path.join(process.cwd(), "storage", "books", TEST_BOOK_ID);
  const storagePdf = path.join(storageDir, "original.pdf");
  const rootPdf = path.join(process.cwd(), "The Poppy War.pdf");

  if (!existsSync(storagePdf) && existsSync(rootPdf)) {
    mkdirSync(storageDir, { recursive: true });
    renameSync(rootPdf, storagePdf);
    console.log("Moved PDF to storage:", storagePdf);
  } else if (!existsSync(storagePdf)) {
    throw new Error(
      `PDF not found. Expected "${rootPdf}" or "${storagePdf}" to exist.`,
    );
  }

  await writeBookMetadata(TEST_BOOK_ID, {
    title: "The Poppy War",
    author: "R.F. Kuang",
    description:
      "A gripping epic fantasy inspired by twentieth-century Chinese history, following war orphan Fang Runin as she rises from nothing to attend the empire's most elite military school — and discovers how far she'll go for revenge.",
    genres: ["Fantasy", "Fiction", "Historical Fiction"],
    publishedAt: "2018-05-01",
    seriesTitle: "The Poppy War",
    seriesIndex: 1,
    status: BookStatus.PUBLISHED,
  });

  const admin = await prisma.user.upsert({
    where: { email: "dev@bookkit.local" },
    create: {
      email: "dev@bookkit.local",
      username: "devuser",
      name: "Dev User",
      role: UserRole.ADMIN,
    },
    update: { role: UserRole.ADMIN },
  });

  const book = await prisma.book.upsert({
    where: { id: TEST_BOOK_ID },
    create: {
      id: TEST_BOOK_ID,
      title: "The Poppy War",
      author: "R.F. Kuang",
      description:
        "A gripping epic fantasy inspired by twentieth-century Chinese history, following war orphan Fang Runin as she rises from nothing to attend the empire's most elite military school — and discovers how far she'll go for revenge.",
      genres: ["Fantasy", "Fiction", "Historical Fiction"],
      publishedAt: new Date("2018-05-01"),
      seriesTitle: "The Poppy War",
      seriesIndex: 1,
      status: BookStatus.PUBLISHED,
      pdfKey: PDF_KEY,
      coverKey: null,
      uploadedById: admin.id,
    },
    update: {
      title: "The Poppy War",
      author: "R.F. Kuang",
      description:
        "A gripping epic fantasy inspired by twentieth-century Chinese history, following war orphan Fang Runin as she rises from nothing to attend the empire's most elite military school — and discovers how far she'll go for revenge.",
      genres: ["Fantasy", "Fiction", "Historical Fiction"],
      publishedAt: new Date("2018-05-01"),
      seriesTitle: "The Poppy War",
      seriesIndex: 1,
      status: BookStatus.PUBLISHED,
      pdfKey: PDF_KEY,
      uploadedById: admin.id,
    },
  });

  console.log(`Seeded test book: ${book.title} (${book.id})`);
  console.log("View at: http://localhost:3000/catalog/the-poppy-war");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
