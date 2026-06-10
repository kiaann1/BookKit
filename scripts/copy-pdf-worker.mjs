import { copyFileSync, cpSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const pdfjsDist = join(root, "node_modules/pdfjs-dist");
const pdfjsPublic = join(publicDir, "pdfjs");

mkdirSync(publicDir, { recursive: true });
mkdirSync(pdfjsPublic, { recursive: true });

copyFileSync(
  join(pdfjsDist, "legacy/build/pdf.worker.min.mjs"),
  join(publicDir, "pdf.worker.min.mjs"),
);

for (const dir of ["cmaps", "standard_fonts", "wasm"]) {
  cpSync(join(pdfjsDist, dir), join(pdfjsPublic, dir), { recursive: true });
}
