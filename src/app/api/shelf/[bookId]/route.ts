import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { removeFromShelf, updateShelfEntry } from "@/lib/shelf";
import { updateShelfSchema } from "@/lib/validations/shelf";

type RouteContext = {
  params: Promise<{ bookId: string }>;
};

function parseOptionalDate(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return value;
  }
  return new Date(`${value}T12:00:00.000Z`);
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = user;
  const { bookId } = await context.params;

  try {
    const body = await request.json();
    const parsed = updateShelfSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await updateShelfEntry(userId, bookId, {
      status: parsed.data.status,
      rating: parsed.data.rating,
      review: parsed.data.review,
      startedAt: parseOptionalDate(parsed.data.startedAt),
      finishedAt: parseOptionalDate(parsed.data.finishedAt),
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ entry: result.entry });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = user;
  const { bookId } = await context.params;

  const result = await removeFromShelf(userId, bookId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
