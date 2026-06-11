import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { createBookFromForm } from "@/lib/books/upload";
import { resolveUploaderId } from "@/lib/dev-auth";

export const runtime = "nodejs";
export const maxDuration = 120;

function uploadErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Failed to upload book";
  }

  const message = error.message;
  if (message.includes("EROFS") || message.includes("read-only")) {
    return "Storage is not writable on this server. Check Blob is connected in Vercel.";
  }

  return message || "Failed to upload book";
}

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const formData = await request.formData();
    const uploadedById = await resolveUploaderId(auth.userId);
    const result = await createBookFromForm(formData, uploadedById);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    revalidatePath("/catalog");
    revalidatePath("/admin/books");
    revalidatePath("/admin/requests");
    revalidatePath("/requests");

    return NextResponse.json({ book: { id: result.book.id } }, { status: 201 });
  } catch (error) {
    console.error("[admin/books] upload failed:", error);
    return NextResponse.json(
      { error: uploadErrorMessage(error) },
      { status: 500 },
    );
  }
}
