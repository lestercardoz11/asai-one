// One-time, idempotent migration: move product imagery from /public/images into
// the Supabase Storage bucket `product-images` and rewrite product_images.url to
// the public Storage URLs. Re-runnable — rows already pointing at http(s) are skipped.
//
//   node scripts/migrate-images-to-storage.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (service role) in
// .env.local. Uploads via the service-role client (bypasses Storage RLS).

import { readFileSync, existsSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUCKET = "product-images";

function loadEnv() {
  const env = {};
  const file = join(ROOT, ".env.local");
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return { ...env, ...process.env };
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: rows, error } = await supabase
  .from("product_images")
  .select("id, url")
  .like("url", "/images/%");
if (error) {
  console.error("query product_images failed:", error.message);
  process.exit(1);
}

let migrated = 0;
let skipped = 0;
for (const row of rows ?? []) {
  if (/^https?:\/\//.test(row.url)) {
    skipped++;
    continue;
  }
  const file = basename(row.url); // e.g. asai-absrd.webp
  const localPath = join(ROOT, "public", "images", file);
  if (!existsSync(localPath)) {
    console.warn(`! local file missing for ${row.url} (${localPath}); skipping`);
    skipped++;
    continue;
  }
  const objectPath = `products/${file}`;
  const body = readFileSync(localPath);
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, body, { contentType: "image/webp", upsert: true });
  if (upErr) {
    console.error(`! upload failed for ${file}:`, upErr.message);
    process.exit(1);
  }
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const { error: updErr } = await supabase
    .from("product_images")
    .update({ url: pub.publicUrl })
    .eq("id", row.id);
  if (updErr) {
    console.error(`! db update failed for ${file}:`, updErr.message);
    process.exit(1);
  }
  console.log(`✓ ${row.url} → ${pub.publicUrl}`);
  migrated++;
}

console.log(`\nDone. migrated=${migrated} skipped=${skipped}`);
