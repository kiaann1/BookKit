import { NextResponse } from "next/server";
import { runPhase1Checks } from "@/lib/health/phase1";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await runPhase1Checks();
    return NextResponse.json(report, { status: report.ok ? 200 : 503 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        checks: [],
        publishedBookCount: 0,
        storageDriver: "unknown",
      },
      { status: 500 },
    );
  }
}
