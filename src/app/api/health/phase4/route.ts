import { NextResponse } from "next/server";
import { runPhase4Checks } from "@/lib/health/phase4";

export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await runPhase4Checks();
    return NextResponse.json(report, { status: report.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Phase 4 check failed",
      },
      { status: 500 },
    );
  }
}
