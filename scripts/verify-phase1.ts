/**
 * Verify Phase 1 exit criteria locally or against a deployed URL.
 *
 * Usage:
 *   npm run verify:phase1
 *   npm run verify:phase1 -- --url https://book-kit-psi.vercel.app
 */

import { config } from "dotenv";

config();

async function verifyLocal() {
  const { runPhase1Checks } = await import("../src/lib/health/phase1");
  return runPhase1Checks();
}

async function verifyRemote(baseUrl: string) {
  const url = new URL("/api/health/phase1", baseUrl).toString();
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
  console.log(`\nPhase 1 verification — ${label}\n`);

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
    `\n${report.ok ? "Phase 1 complete." : "Phase 1 incomplete — fix the items above."}`,
  );
  console.log(
    `Published books: ${report.publishedBookCount} · Storage: ${report.storageDriver}\n`,
  );
}

async function main() {
  const urlIndex = process.argv.indexOf("--url");
  const remoteUrl = urlIndex >= 0 ? process.argv[urlIndex + 1] : null;

  if (remoteUrl) {
    const report = await verifyRemote(remoteUrl.replace(/\/$/, ""));
    printReport(report, remoteUrl);
    process.exit(report.ok ? 0 : 1);
    return;
  }

  const report = await verifyLocal();
  printReport(report, "local");
  process.exit(report.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
