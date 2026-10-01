import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\
?\
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const limitIndex = process.argv.indexOf("--limit");
const limit = limitIndex >= 0 ? Number(process.argv[limitIndex + 1]) : 500;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const now = new Date().toISOString();

const { data: reviews, error: reviewError } = await supabase
  .from("creator_video_reviews")
  .select("id,user_id,storage_bucket,storage_path,raw_video_expires_at,raw_video_retention_status")
  .eq("raw_video_retention_status", "active")
  .lt("raw_video_expires_at", now)
  .limit(limit);

if (reviewError) throw new Error(reviewError.message);

const reviewIds = (reviews ?? []).map((review) => review.id);

let attempts = [];
if (reviewIds.length) {
  const { data, error } = await supabase
    .from("creator_video_review_attempts")
    .select("id,review_id,user_id,storage_bucket,storage_path,raw_video_retention_status")
    .in("review_id", reviewIds)
    .eq("raw_video_retention_status", "active");
  if (error) throw new Error(error.message);
  attempts = data ?? [];
}

const targetsByBucket = new Map();
function addTarget(bucket, storagePath) {
  if (!bucket || !storagePath) return;
  const existing = targetsByBucket.get(bucket) ?? new Set();
  existing.add(storagePath);
  targetsByBucket.set(bucket, existing);
}

for (const review of reviews ?? []) addTarget(review.storage_bucket, review.storage_path);
for (const attempt of attempts) addTarget(attempt.storage_bucket, attempt.storage_path);

const summary = {
  mode: apply ? "apply" : "dry-run",
  expired_review_count: reviewIds.length,
  expired_attempt_count: attempts.length,
  storage_object_count: [...targetsByBucket.values()].reduce((total, paths) => total + paths.size, 0),
};

console.log(JSON.stringify(summary, null, 2));

if (!apply || !reviewIds.length) {
  console.log(apply ? "No expired creator review videos found." : "Dry run only. Re-run with --apply to remove expired storage objects.");
} else {
  let failed = false;
  const failures = [];

  for (const [bucket, paths] of targetsByBucket.entries()) {
    const pathList = [...paths];
    const { error } = await supabase.storage.from(bucket).remove(pathList);
    if (error) {
      failed = true;
      failures.push({ bucket, message: error.message });
    }
  }

  const retentionStatus = failed ? "delete_failed" : "deleted";
  const deletedAt = failed ? null : now;

  await supabase
    .from("creator_video_reviews")
    .update({ raw_video_retention_status: retentionStatus, raw_video_deleted_at: deletedAt })
    .in("id", reviewIds);

  if (attempts.length) {
    await supabase
      .from("creator_video_review_attempts")
      .update({ raw_video_retention_status: retentionStatus, raw_video_deleted_at: deletedAt })
      .in("review_id", reviewIds);
  }

  await supabase.from("creator_video_review_events").insert((reviews ?? []).map((review) => ({
    review_id: review.id,
    user_id: review.user_id,
    event_type: failed ? "raw_video_retention_cleanup_failed" : "raw_video_retention_cleanup_completed",
    actor: "system",
    metadata: {
      deleted_at: deletedAt,
      storage_object_count: summary.storage_object_count,
      failures,
    },
  })));

  if (failed) {
    console.error(JSON.stringify({ failures }, null, 2));
    throw new Error("One or more expired review videos could not be removed.");
  }

  console.log("Expired creator review videos removed.");
}