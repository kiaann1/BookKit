import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import {
  deleteBookAndFiles,
  updateBookFromForm,
} from "@/lib/books/upload";

export const runtime = "nodejs";
export const maxDuration = 120;

type RouteContext = {
  params: Promise<{ id: string }>;
};

function uploadErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Failed to update book";
  }
  return error.message || "Failed to update book";
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if ("error" in auth) {
    return auth.error;
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

    revalidatePath("/catalog");
    revalidatePath("/admin/books");
    revalidatePath(`/catalog/${id}`);

    return NextResponse.json({ book: { id: result.book!.id } });
  } catch (error) {
    console.error("[admin/books] update failed:", error);
    return NextResponse.json(
      { error: uploadErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const deleted = await deleteBookAndFiles(id);

  if (!deleted) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  revalidatePath("/catalog");
  revalidatePath("/admin/books");

  return NextResponse.json({ success: true });
}
