import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

function loadEnv() {
  const env = {};
  for (const fn of [".env.local", ".env", ".env.vercel"]) {
    if (existsSync(fn)) {
      for (const line of readFileSync(fn, "utf-8").split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [k, ...v] = trimmed.split("=");
          if (!env[k.trim()]) {
            env[k.trim()] = v.join("=").replace(/^["']|["']$/g, "").trim();
          }
        }
      }
    }
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function check() {
  const deliveryIds = [
    "36d6bfe4-69de-4f64-b9fa-af39ffdcc723",
    "f3d656d5-9a65-4e9c-89a8-875fcbb74fe7"
  ];

  const { data: dels, error } = await supabase
    .from("idea_box_deliveries")
    .select("*")
    .in("id", deliveryIds);

  console.log("Deliveries found in DB:", dels?.length);
  console.log(JSON.stringify(dels, null, 2));

  const { data: items } = await supabase
    .from("idea_box_items")
    .select("*")
    .in("delivery_id", deliveryIds);

  console.log("\nItems found in DB:", items?.length);
  console.log(JSON.stringify(items, null, 2));
}

check().catch(console.error);
