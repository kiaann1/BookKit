/**
 * Verify Phase 7 exit criteria locally or against a deployed URL.
 *
 * Usage:
 *   npm run verify:phase7
 *   npm run verify:phase7 -- --url https://book-kit-psi.vercel.app
 */

import { config } from "dotenv";

config();

async function verifyLocal() {
  const { runPhase7Checks } = await import("../src/lib/health/phase7");
  return runPhase7Checks();
}

async function verifyRemote(baseUrl: string) {
  const url = new URL("/api/health/phase7", baseUrl).toString();
  const response = await fetch(url, { cache: "no-store" });
  const body = await response.text();

  let data: Awaited<ReturnType<typeof verifyLocal>> & { error?: string };
  try {
    data = JSON.parse(body) as typeof data;
  } catch {
    throw new Error(
      `Expected JSON from ${url} (HTTP ${response.status}). Response starts with: ${body.slice(0, 80)}`,
    );
  }

  if (!response.ok && !data.checks?.length) {
    throw new Error(data.error ?? `HTTP ${response.status} from ${url}`);
  }

  return data;
}

function printReport(
  report: Awaited<ReturnType<typeof verifyLocal>>,
  source: string,
) {
  console.log(`\nPhase 7 verification (${source})\n`);

  for (const check of report.checks) {
    const mark = check.ok ? "✓" : "✗";
    console.log(`${mark} ${check.label}`);
    if (check.detail) {
      console.log(`  ${check.detail}`);
    }
    if (check.hint) {
      console.log(`  → ${check.hint}`);
    }
  }

  console.log(`\n${report.ok ? "PASS" : "FAIL"}\n`);
}

async function main() {
  const urlFlagIndex = process.argv.indexOf("--url");
  const baseUrl =
    urlFlagIndex >= 0 ? process.argv[urlFlagIndex + 1] : undefined;

  const report = baseUrl
    ? await verifyRemote(baseUrl.replace(/\/$/, ""))
    : await verifyLocal();

  printReport(report, baseUrl ?? "local");
  process.exit(report.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
