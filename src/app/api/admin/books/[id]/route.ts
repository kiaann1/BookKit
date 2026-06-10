import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import {
  deleteBookAndFiles,
  updateBookFromForm,
} from "@/lib/books/upload";
import { getSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const formData = await request.formData();
    const result = await updateBookFromForm(id, formData);

    if (typeof result.error === "string") {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ book: { id: result.book!.id } });
  } catch {
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const deleted = await deleteBookAndFiles(id);

  if (!deleted) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
