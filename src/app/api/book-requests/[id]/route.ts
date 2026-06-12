import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { deleteBookRequestByUser } from "@/lib/book-requests";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await deleteBookRequestByUser(id, auth.userId);

  if ("error" in result) {
    const status =
      result.error === "Request not found"
        ? 404
        : result.error === "You can only delete your own requests"
          ? 403
          : 503;
    return NextResponse.json({ error: result.error }, { status });
  }

  revalidatePath("/requests");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/books");

  return NextResponse.json({ ok: true });
}
