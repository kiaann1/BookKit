import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

function resolveStoragePath(key: string) {
  const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = path.join(STORAGE_ROOT, normalized);
  if (!fullPath.startsWith(STORAGE_ROOT)) {
    throw new Error("Invalid storage key");
  }
  return fullPath;
}

export async function uploadLocal(
  key: string,
  body: Buffer,
): Promise<void> {
  const filePath = resolveStoragePath(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body);
}

export async function readLocal(key: string): Promise<Buffer | null> {
  try {
    const filePath = resolveStoragePath(key);
    return await readFile(filePath);
  } catch {
    return null;
  }
}

export async function deleteLocal(key: string): Promise<void> {
  try {
    const filePath = resolveStoragePath(key);
    await unlink(filePath);
  } catch {
    // File may not exist.
  }
}
