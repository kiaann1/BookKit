import { NextResponse } from "next/server";
import { runPhase6Checks } from "@/lib/health/phase6";

export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await runPhase6Checks();
    return NextResponse.json(report, { status: report.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Phase 6 check failed",
      },
      { status: 500 },
    );
  }
}
