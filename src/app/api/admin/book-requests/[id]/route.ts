import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import {
  deleteBookRequestByAdmin,
  getBookRequestForAdmin,
  updateBookRequestAdmin,
} from "@/lib/book-requests";
import { adminUpdateBookRequestSchema } from "@/lib/validations/book-request";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const request = await getBookRequestForAdmin(id);

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({ request });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = adminUpdateBookRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await updateBookRequestAdmin(id, parsed.data);
  if ("error" in result) {
    const status = result.error === "Request not found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  revalidatePath("/admin/requests");
  revalidatePath("/requests");
  revalidatePath("/admin/books");

  return NextResponse.json(result);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const result = await deleteBookRequestByAdmin(id);

  if ("error" in result) {
    const status = result.error === "Request not found" ? 404 : 503;
    return NextResponse.json({ error: result.error }, { status });
  }

  revalidatePath("/admin/requests");
  revalidatePath("/requests");
  revalidatePath("/admin/books");

  return NextResponse.json({ ok: true });
}
