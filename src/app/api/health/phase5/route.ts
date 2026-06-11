import { NextResponse } from "next/server";
import { runPhase5Checks } from "@/lib/health/phase5";

export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await runPhase5Checks();
    return NextResponse.json(report, { status: report.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Phase 5 check failed",
      },
      { status: 500 },
    );
  }
}
