import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { seedCatalogBooks } from "@/lib/books/catalog-seed";

export async function POST() {
  const auth = await assertAdminApi();
  if ("error" in auth) {
    return auth.error;
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
