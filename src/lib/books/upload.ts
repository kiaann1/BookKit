import { ensureBookMetadata } from "@/lib/books/ensure-metadata";
import {
  bookSlugWithAuthor,
  titleToSlug,
  writeBookMetadata,
} from "@/lib/books/metadata";
import { hasStoragePdf } from "@/lib/books/storage-books";
import { BookStatus } from "@/lib/constants/book-status";
import { ensureBookCover } from "@/lib/covers/ensure-cover";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import {
  bookCoverKey,
  bookPdfKey,
  coverExtensionFromMime,
} from "@/lib/storage/keys";
import { deleteFile, fileExists, readFile, uploadFile } from "@/lib/storage";
import {
  ALLOWED_COVER_TYPES,
  ALLOWED_PDF_TYPES,
  bookMetadataSchema,
  MAX_COVER_BYTES,
  MAX_PDF_BYTES,
} from "@/lib/validations/book";

function parseGenres(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string");
    }
  } catch {
    return value
      .split(",")
      .map((genre) => genre.trim())
      .filter(Boolean);
  }
  return [];
}

function validatePdf(file: File | null) {
  if (!file || file.size === 0) {
    return "A PDF file is required";
  }
  if (!ALLOWED_PDF_TYPES.includes(file.type as (typeof ALLOWED_PDF_TYPES)[number])) {
    return "PDF must be a valid PDF file";
  }
  if (file.size > MAX_PDF_BYTES) {
    return "PDF must be under 100 MB";
  }
  return null;
}

function validateCover(file: File | null) {
  if (!file || file.size === 0) {
    return null;
  }
  if (
    !ALLOWED_COVER_TYPES.includes(file.type as (typeof ALLOWED_COVER_TYPES)[number])
  ) {
    return "Cover must be JPEG, PNG, or WebP";
  }
  if (file.size > MAX_COVER_BYTES) {
    return "Cover must be under 5 MB";
  }
  return null;
}

function isValidPdfBuffer(buffer: Buffer) {
  return buffer.byteLength >= 5 && buffer.subarray(0, 5).toString("utf8") === "%PDF-";
}

async function uniqueStorageBookId(title: string, author?: string) {
  const base = author ? bookSlugWithAuthor(title, author) : titleToSlug(title);
  let candidate = base;
  let index = 2;

  while (hasStoragePdf(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

async function uniqueDatabaseBookId(title: string, author: string) {
  const base = bookSlugWithAuthor(title, author);
  let candidate = base;
  let index = 2;

  while (true) {
    const existing = await prisma.book.findUnique({
      where: { id: candidate },
      select: { id: true },
    });
    if (!existing && !(await fileExists(bookPdfKey(candidate)))) {
      return candidate;
    }
    candidate = `${base}-${index}`;
    index += 1;
  }
}

async function persistUploadedBookFiles(options: {
  bookId: string;
  metadata: {
    title: string;
    author: string;
    description?: string;
    genres: string[];
    publishedAt?: string;
    seriesTitle?: string;
    seriesIndex?: number;
    status: BookStatus;
  };
  pdfFile: File;
  coverFile: File | null;
  /** When true, metadata lives in Postgres only (skip local/Blob sidecar JSON). */
  skipSidecarMetadata?: boolean;
}) {
  const pdfBuffer = Buffer.from(await options.pdfFile.arrayBuffer());
  const pdfKey = bookPdfKey(options.bookId);
  await uploadFile({
    key: pdfKey,
    body: pdfBuffer,
    contentType: "application/pdf",
    access: "private",
  });

  const storedPdf = await readFile(pdfKey);
  if (!storedPdf || !isValidPdfBuffer(storedPdf)) {
    throw new Error(
      "PDF did not save correctly to storage. If the file is large, use npm run db:upload-files from your computer instead of the browser upload.",
    );
  }

  let coverKey: string | null = null;
  if (options.coverFile && options.coverFile.size > 0) {
    const extension = coverExtensionFromMime(options.coverFile.type);
    if (!extension) {
      throw new Error("Invalid cover type");
    }
    coverKey = bookCoverKey(options.bookId, extension);
    const coverBuffer = Buffer.from(await options.coverFile.arrayBuffer());
    await uploadFile({
      key: coverKey,
      body: coverBuffer,
      contentType: options.coverFile.type,
      access: "public",
    });
  }

  if (!options.skipSidecarMetadata) {
    await writeBookMetadata(options.bookId, {
      title: options.metadata.title,
      author: options.metadata.author,
      description: options.metadata.description,
      genres: options.metadata.genres,
      publishedAt: options.metadata.publishedAt,
      seriesTitle: options.metadata.seriesTitle,
      seriesIndex: options.metadata.seriesIndex,
      status: options.metadata.status,
    });

    const enriched = await ensureBookMetadata(options.bookId);
    const lookupTitle = enriched.title ?? options.metadata.title;
    const lookupAuthor = enriched.author ?? options.metadata.author;

    if (!coverKey) {
      coverKey = await ensureBookCover(
        options.bookId,
        lookupTitle,
        lookupAuthor ?? "",
      );
    }
  } else if (!coverKey) {
    coverKey = await ensureBookCover(
      options.bookId,
      options.metadata.title,
      options.metadata.author ?? "",
    );
  }

  return { pdfKey, coverKey };
}

async function createStorageBookFromForm(formData: FormData) {
  const metadata = bookMetadataSchema.safeParse({
    title: formData.get("title"),
    author: formData.get("author"),
    description: formData.get("description") || undefined,
    genres: parseGenres(formData.get("genres")),
    publishedAt: formData.get("publishedAt") || undefined,
    seriesTitle: formData.get("seriesTitle") || undefined,
    seriesIndex: formData.get("seriesIndex") || undefined,
    status: formData.get("status") || BookStatus.PUBLISHED,
  });

  if (!metadata.success) {
    return { error: metadata.error.flatten().fieldErrors };
  }

  const pdfFile = formData.get("pdf") as File | null;
  const coverFile = formData.get("cover") as File | null;

  const pdfError = validatePdf(pdfFile);
  if (pdfError) {
    return { error: { pdf: [pdfError] } };
  }

  const coverError = validateCover(coverFile);
  if (coverError) {
    return { error: { cover: [coverError] } };
  }

  const bookId = await uniqueStorageBookId(
    metadata.data.title,
    metadata.data.author,
  );

  try {
    await persistUploadedBookFiles({
      bookId,
      metadata: metadata.data,
      pdfFile: pdfFile!,
      coverFile,
    });

    return { book: { id: bookId } };
  } catch (error) {
    await deleteFile(bookPdfKey(bookId));
    await deleteFile(bookCoverKey(bookId, "jpg"));
    await deleteFile(bookCoverKey(bookId, "png"));
    await deleteFile(bookCoverKey(bookId, "webp"));
    throw error;
  }
}

export async function createBookFromForm(
  formData: FormData,
  uploadedById: string,
) {
  if (!(await isDatabaseAvailable())) {
    return createStorageBookFromForm(formData);
  }
  const metadata = bookMetadataSchema.safeParse({
    title: formData.get("title"),
    author: formData.get("author"),
    description: formData.get("description") || undefined,
    genres: parseGenres(formData.get("genres")),
    publishedAt: formData.get("publishedAt") || undefined,
    seriesTitle: formData.get("seriesTitle") || undefined,
    seriesIndex: formData.get("seriesIndex") || undefined,
    status: formData.get("status") || BookStatus.PUBLISHED,
  });

  if (!metadata.success) {
    return { error: metadata.error.flatten().fieldErrors };
  }

  const pdfFile = formData.get("pdf") as File | null;
  const coverFile = formData.get("cover") as File | null;

  const pdfError = validatePdf(pdfFile);
  if (pdfError) {
    return { error: { pdf: [pdfError] } };
  }

  const coverError = validateCover(coverFile);
  if (coverError) {
    return { error: { cover: [coverError] } };
  }

  const bookId = await uniqueDatabaseBookId(
    metadata.data.title,
    metadata.data.author,
  );

  const book = await prisma.book.create({
    data: {
      id: bookId,
      title: metadata.data.title,
      author: metadata.data.author,
      description: metadata.data.description?.trim() || null,
      genres: metadata.data.genres,
      publishedAt: metadata.data.publishedAt
        ? new Date(metadata.data.publishedAt)
        : null,
      seriesTitle: metadata.data.seriesTitle?.trim() || null,
      seriesIndex: metadata.data.seriesIndex ?? null,
      status: metadata.data.status,
      pdfKey: "pending",
      uploadedById,
    },
  });

  try {
    const { pdfKey, coverKey } = await persistUploadedBookFiles({
      bookId: book.id,
      metadata: metadata.data,
      pdfFile: pdfFile!,
      coverFile,
      skipSidecarMetadata: true,
    });

    const updated = await prisma.book.update({
      where: { id: book.id },
      data: { pdfKey, coverKey },
    });

    return { book: updated };
  } catch (error) {
    await deleteFile(bookPdfKey(book.id));
    await deleteFile(bookCoverKey(book.id, "jpg"));
    await deleteFile(bookCoverKey(book.id, "png"));
    await deleteFile(bookCoverKey(book.id, "webp"));
    await prisma.book.delete({ where: { id: book.id } });
    throw error;
  }
}

export async function updateBookFromForm(bookId: string, formData: FormData) {
  const existing = await prisma.book.findUnique({ where: { id: bookId } });
  if (!existing) {
    return { error: "Book not found" };
  }

  const metadata = bookMetadataSchema.safeParse({
    title: formData.get("title"),
    author: formData.get("author"),
    description: formData.get("description") || undefined,
    genres: parseGenres(formData.get("genres")),
    publishedAt: formData.get("publishedAt") || undefined,
    seriesTitle: formData.get("seriesTitle") || undefined,
    seriesIndex: formData.get("seriesIndex") || undefined,
    status: formData.get("status") || existing.status,
  });

  if (!metadata.success) {
    return { error: metadata.error.flatten().fieldErrors };
  }

  const pdfFile = formData.get("pdf") as File | null;
  const coverFile = formData.get("cover") as File | null;

  if (pdfFile && pdfFile.size > 0) {
    const pdfError = validatePdf(pdfFile);
    if (pdfError) {
      return { error: { pdf: [pdfError] } };
    }
  }

  const coverError = validateCover(coverFile);
  if (coverError) {
    return { error: { cover: [coverError] } };
  }

  let pdfKey = existing.pdfKey;
  let coverKey = existing.coverKey;

  if (pdfFile && pdfFile.size > 0) {
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    pdfKey = bookPdfKey(bookId);
    await uploadFile({
      key: pdfKey,
      body: pdfBuffer,
      contentType: "application/pdf",
      access: "private",
    });
    const storedPdf = await readFile(pdfKey);
    if (!storedPdf || !isValidPdfBuffer(storedPdf)) {
      throw new Error(
        "PDF did not save correctly to storage. If the file is large, use npm run db:upload-files from your computer instead of the browser upload.",
      );
    }
  }

  if (coverFile && coverFile.size > 0) {
    const extension = coverExtensionFromMime(coverFile.type);
    if (!extension) {
      return { error: { cover: ["Invalid cover type"] } };
    }
    if (existing.coverKey) {
      await deleteFile(existing.coverKey);
    }
    coverKey = bookCoverKey(bookId, extension);
    const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
    await uploadFile({
      key: coverKey,
      body: coverBuffer,
      contentType: coverFile.type,
      access: "public",
    });
  } else if (!coverKey) {
    coverKey = await ensureBookCover(
      bookId,
      metadata.data.title,
      metadata.data.author,
    );
  }

  const book = await prisma.book.update({
    where: { id: bookId },
    data: {
      title: metadata.data.title,
      author: metadata.data.author,
      description: metadata.data.description?.trim() || null,
      genres: metadata.data.genres,
      publishedAt: metadata.data.publishedAt
        ? new Date(metadata.data.publishedAt)
        : null,
      seriesTitle: metadata.data.seriesTitle?.trim() || null,
      seriesIndex: metadata.data.seriesIndex ?? null,
      status: metadata.data.status,
      pdfKey,
      coverKey,
    },
  });

  await writeBookMetadata(bookId, {
    title: metadata.data.title,
    author: metadata.data.author,
    description: metadata.data.description,
    genres: metadata.data.genres,
    publishedAt: metadata.data.publishedAt,
    seriesTitle: metadata.data.seriesTitle,
    seriesIndex: metadata.data.seriesIndex ?? undefined,
    status: metadata.data.status,
  });

  return { book };
}

export async function deleteBookAndFiles(bookId: string) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) {
    return false;
  }

  await deleteFile(book.pdfKey);
  if (book.coverKey) {
    await deleteFile(book.coverKey);
  }
  await prisma.book.delete({ where: { id: bookId } });
  return true;
}
