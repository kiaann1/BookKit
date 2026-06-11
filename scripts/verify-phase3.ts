/**
 * Verify Phase 3 exit criteria locally or against a deployed URL.
 *
 * Usage:
 *   npm run verify:phase3
 *   npm run verify:phase3 -- --url https://book-kit-psi.vercel.app
 */

import { config } from "dotenv";

config();

async function verifyLocal() {
  const { runPhase3Checks } = await import("../src/lib/health/phase3");
  return runPhase3Checks();
}

async function verifyRemote(baseUrl: string) {
  const url = new URL("/api/health/phase3", baseUrl).toString();
  const response = await fetch(url, { cache: "no-store" });
  const body = await response.text();

  let data: Awaited<ReturnType<typeof verifyLocal>> & { error?: string };
  try {
    data = JSON.parse(body) as typeof data;
  } catch {
    throw new Error(
      `Expected JSON from ${url} (HTTP ${response.status}). Deploy the latest code or check the URL. Response starts with: ${body.slice(0, 80)}`,
    );
  }

  if (!response.ok && !data.checks?.length) {
    throw new Error(data.error ?? `HTTP ${response.status} from ${url}`);
  }

  return data;
}

function printReport(
  report: Awaited<ReturnType<typeof verifyLocal>>,
  label: string,
) {
  console.log(`\nPhase 3 verification — ${label}\n`);

  for (const check of report.checks) {
    const icon = check.ok ? "✓" : "✗";
    console.log(`${icon} ${check.label}`);
    if (check.detail) {
      console.log(`  ${check.detail}`);
    }
    if (!check.ok && check.hint) {
      console.log(`  → ${check.hint}`);
    }
  }

  console.log(
    `\n${report.ok ? "Phase 3 complete." : "Phase 3 incomplete — fix the items above."}`,
  );
  console.log(`Storage: ${report.storageDriver}\n`);
}

async function main() {
  const urlArgIndex = process.argv.indexOf("--url");
  const baseUrl =
    urlArgIndex >= 0 ? process.argv[urlArgIndex + 1]?.replace(/\/$/, "") : null;

  if (baseUrl) {
    const report = await verifyRemote(baseUrl);
    printReport(report, baseUrl);
    process.exit(report.ok ? 0 : 1);
  }

  const report = await verifyLocal();
  printReport(report, "local");
  process.exit(report.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
