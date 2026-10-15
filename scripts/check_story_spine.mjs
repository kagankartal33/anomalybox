import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

function loadEnv() {
  const env = {};
  for (const fn of [".env.local", ".env"]) {
    if (existsSync(fn)) {
      for (const line of readFileSync(fn, "utf-8").split(/\r?\n/)) {
        const t = line.trim();
        if (t && !t.startsWith("#") && t.includes("=")) {
          const [k, ...v] = t.split("=");
          if (!env[k.trim()]) env[k.trim()] = v.join("=").replace(/^["']|["']$/g, "").trim();
        }
      }
    }
  }
  return env;
}

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data } = await sb.from("idea_cards").select("idea_id,card").limit(8);
let emptyCount = 0;
let filledCount = 0;

for (const row of data) {
  const c = row.card;
  const ss = c.story_spine || c.storySpine || [];
  if (ss.length === 0) {
    emptyCount++;
    console.log(`EMPTY storySpine — idea_id: ${row.idea_id}`);
  } else {
    filledCount++;
    console.log(`FILLED (${ss.length} items) — idea_id: ${row.idea_id}`);
    console.log(`  [0]: ${String(ss[0]).substring(0, 80)}`);
  }
}

console.log(`\nSummary: ${filledCount} filled, ${emptyCount} empty (out of ${data.length} sampled)`);
