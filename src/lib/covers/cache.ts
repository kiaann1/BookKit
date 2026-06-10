import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

type CacheEntry = {
  url: string | null;
  expiresAt: number;
};

const memory = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 60 * 60 * 1000;

function cacheKey(title: string, author: string) {
  return `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;
}

function cacheFilePath() {
  return path.join(process.cwd(), "storage", "covers-cache.json");
}

async function readDiskCache(): Promise<Record<string, CacheEntry>> {
  try {
    const raw = await readFile(cacheFilePath(), "utf-8");
    return JSON.parse(raw) as Record<string, CacheEntry>;
  } catch {
    return {};
  }
}

async function writeDiskCache(data: Record<string, CacheEntry>) {
  try {
    const filePath = cacheFilePath();
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Local storage is read-only on Vercel — memory cache still works.
  }
}

export async function getCachedCoverUrl(title: string, author: string) {
  const key = cacheKey(title, author);
  const hit = memory.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.url;
  }

  const disk = await readDiskCache();
  const diskHit = disk[key];
  if (diskHit && diskHit.expiresAt > Date.now()) {
    memory.set(key, diskHit);
    return diskHit.url;
  }

  return undefined;
}

export async function setCachedCoverUrl(
  title: string,
  author: string,
  url: string | null,
) {
  const key = cacheKey(title, author);
  const entry: CacheEntry = {
    url,
    expiresAt: Date.now() + (url ? CACHE_TTL_MS : NEGATIVE_TTL_MS),
  };

  memory.set(key, entry);

  const disk = await readDiskCache();
  disk[key] = entry;
  await writeDiskCache(disk);
}
