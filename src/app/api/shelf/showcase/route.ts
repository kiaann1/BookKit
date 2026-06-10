import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getShowcaseBooks, setShowcaseBooks } from "@/lib/shelf";
import { setShowcaseSchema } from "@/lib/validations/shelf";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const books = await getShowcaseBooks(user.userId);
  return NextResponse.json({ books });
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = setShowcaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await setShowcaseBooks(user.userId, parsed.data.bookIds);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ books: result.books });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
