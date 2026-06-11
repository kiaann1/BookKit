import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getPublishedBooks } from "@/lib/books";

const querySchema = z.object({
  q: z.string().trim().min(1).max(80),
  limit: z.coerce.number().int().min(1).max(12).optional().default(8),
});

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? "",
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const query = parsed.data.q.toLowerCase();
  const books = await getPublishedBooks({ q: parsed.data.q });
  const results = books
    .filter((book) => {
      const haystack = `${book.title} ${book.author}`.toLowerCase();
      return haystack.includes(query);
    })
    .slice(0, parsed.data.limit)
    .map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
    }));

  return NextResponse.json({ books: results });
}
