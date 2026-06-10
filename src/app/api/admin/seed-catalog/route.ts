import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { seedCatalogBooks } from "@/lib/books/catalog-seed";
import { getAuthenticatedUser } from "@/lib/auth/session-user";

export async function POST() {
  const auth = await getAuthenticatedUser();
  if (!auth || auth.session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await seedCatalogBooks();
    revalidatePath("/catalog");
    revalidatePath("/admin/books");

    return NextResponse.json({
      ok: true,
      message: `Seeded ${result.upserted} books into the catalog.`,
      ...result,
    });
  } catch (error) {
    console.error("[seed-catalog] Failed:", error);
    const message =
      error instanceof Error ? error.message : "Could not seed catalog.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
