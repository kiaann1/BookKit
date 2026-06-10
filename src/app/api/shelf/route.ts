import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { addToShelfSchema } from "@/lib/validations/shelf";
import { addToShelf, getUserShelf } from "@/lib/shelf";
import type { ShelfStatus } from "@/lib/constants/shelf-status";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = user;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ShelfStatus | null;

  const books = await getUserShelf(userId, status ?? undefined);
  return NextResponse.json({ books });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = user;

  try {
    const body = await request.json();
    const parsed = addToShelfSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await addToShelf(
      userId,
      parsed.data.bookId,
      parsed.data.status,
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({ entry: result.entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
