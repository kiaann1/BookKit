import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { enforceUserRateLimit } from "@/lib/security/rate-limit";
import { exportUserData } from "@/lib/user/data-export";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceUserRateLimit(auth.userId, "data-export", {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) {
    return limited;
  }

  const data = await exportUserData(auth.userId);
  if (!data) {
    return NextResponse.json(
      { error: "Could not export your data right now." },
      { status: 503 },
    );
  }

  const filename = `bookkit-data-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
