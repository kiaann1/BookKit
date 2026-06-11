import { NextResponse } from "next/server";
import { runPhase3Checks } from "@/lib/health/phase3";

export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await runPhase3Checks();
    return NextResponse.json(report, { status: report.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Phase 3 check failed",
      },
      { status: 500 },
    );
  }
}
