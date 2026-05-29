#!/usr/bin/env node
/**
 * R2 Asset Migration Script
 * Downloads all files from Mocha's R2 (mochausercontent.com) and uploads
 * them to the new remodeleriq-assets R2 bucket via wrangler.
 *
 * Usage:
 *   node scripts/migrate-r2-assets.mjs
 *
 * Requires:
 *   - wrangler authenticated (wrangler whoami)
 *   - R2_PUBLIC_URL env var set to your pub-XXXX.r2.dev URL
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ASSET_LIST = join(ROOT, "..", "public_asset_links.json");
const DOWNLOAD_DIR = join(ROOT, "tmp-r2-migration");
const BUCKET = "remodeleriq-assets";
const PROGRESS_FILE = join(ROOT, "tmp-r2-migration", "_progress.json");

const urls = JSON.parse(readFileSync(ASSET_LIST, "utf8"));

if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR, { recursive: true });

// Load progress to allow resuming
let progress = { done: [], failed: [] };
if (existsSync(PROGRESS_FILE)) {
  progress = JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));
  console.log(`Resuming — ${progress.done.length} already done, ${progress.failed.length} previously failed`);
}

const doneSet = new Set(progress.done);
const todo = urls.filter((u) => !doneSet.has(u));
console.log(`Total: ${urls.length} | Remaining: ${todo.length}`);

let successCount = 0;
let failCount = 0;

for (let i = 0; i < todo.length; i++) {
  const url = todo[i];
  // Extract the filename from the URL path
  const rawKey = decodeURIComponent(new URL(url).pathname.slice(1));
  const localPath = join(DOWNLOAD_DIR, rawKey.replace(/[/\\]/g, "_"));

  process.stdout.write(`[${i + 1}/${todo.length}] ${rawKey.slice(0, 60)}... `);

  try {
    // Download
    if (!existsSync(localPath)) {
      execSync(`curl -sS -o "${localPath}" "${url}"`, { timeout: 30000 });
    }

    // Upload to R2
    execSync(`wrangler r2 object put "${BUCKET}/${rawKey}" --file="${localPath}"`, {
      cwd: ROOT,
      timeout: 60000,
      stdio: "pipe",
    });

    // Delete local copy immediately to preserve disk space
    try { unlinkSync(localPath); } catch {}

    progress.done.push(url);
    successCount++;
    console.log("✓");
  } catch (err) {
    progress.failed.push({ url, error: err.message?.slice(0, 120) });
    failCount++;
    console.log(`✗ ${err.message?.slice(0, 80)}`);
  }

  // Save progress every 10 files
  if ((i + 1) % 10 === 0) {
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  }
}

writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

console.log(`\n✅ Done — ${successCount} uploaded, ${failCount} failed`);
if (progress.failed.length > 0) {
  console.log("Failed files saved to tmp-r2-migration/_progress.json");
}
