import { NextResponse } from "next/server";
import { runPhase7Checks } from "@/lib/health/phase7";

export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await runPhase7Checks();
    return NextResponse.json(report, { status: report.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Phase 7 check failed",
      },
      { status: 500 },
    );
  }
}
