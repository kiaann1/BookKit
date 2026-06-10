import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { resolveUploaderId } from "@/lib/dev-auth";
import { createBookFromForm } from "@/lib/books/upload";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const uploadedById = await resolveUploaderId(session.user.id);
    const result = await createBookFromForm(formData, uploadedById);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ book: { id: result.book.id } }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload book" },
      { status: 500 },
    );
  }
}
