/**
 * audit_duplicate_cards.mjs
 * Checks whether any idea_id appears in more than one box (delivery) across the entire system.
 * Also verifies inventory status alignment and constraint health.
 *
 * Usage: node scripts/audit_duplicate_cards.mjs
 */

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
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

function ok(msg) { console.log(`${GREEN}✅ ${msg}${RESET}`); }
function warn(msg) { console.log(`${YELLOW}⚠️  ${msg}${RESET}`); }
function fail(msg) { console.log(`${RED}❌ ${msg}${RESET}`); }
function info(msg) { console.log(`${CYAN}ℹ  ${msg}${RESET}`); }
function header(msg) { console.log(`\n${BOLD}${msg}${RESET}`); }

async function run() {
  console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  VIRALBOX — Duplicate Card Audit${RESET}`);
  console.log(`${BOLD}  Target: ${env.NEXT_PUBLIC_SUPABASE_URL}${RESET}`);
  console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}\n`);

  // ─── 1. Check for idea_ids that appear in more than one delivery ───
  header("1. Global idea_id uniqueness check (cross-box)");

  const { data: allItems, error: itemsError } = await supabase
    .from("idea_box_items")
    .select("idea_id, delivery_id, user_id, slot_index, assigned_band, created_at")
    .order("created_at", { ascending: true });

  if (itemsError) {
    fail(`Failed to fetch idea_box_items: ${itemsError.message}`);
    return;
  }

  info(`Total idea_box_items rows: ${allItems.length}`);

  // Group by idea_id
  const byIdea = new Map();
  for (const item of allItems) {
    if (!byIdea.has(item.idea_id)) byIdea.set(item.idea_id, []);
    byIdea.get(item.idea_id).push(item);
  }

  const duplicates = [...byIdea.entries()].filter(([, rows]) => rows.length > 1);

  if (duplicates.length === 0) {
    ok(`No idea_id appears in more than one box. Global uniqueness: CLEAN`);
  } else {
    fail(`DUPLICATE CARDS FOUND: ${duplicates.length} idea_ids appear in multiple boxes!`);
    for (const [ideaId, rows] of duplicates) {
      console.log(`\n  ${RED}idea_id: ${ideaId}${RESET}`);
      for (const row of rows) {
        console.log(`    delivery_id=${row.delivery_id} user_id=${row.user_id} slot=${row.slot_index} band=${row.assigned_band} created=${row.created_at}`);
      }
    }
  }

  // ─── 2. Check same delivery duplicate idea_ids (within-box) ───
  header("2. Within-box idea_id uniqueness check");

  const byDelivery = new Map();
  for (const item of allItems) {
    if (!byDelivery.has(item.delivery_id)) byDelivery.set(item.delivery_id, []);
    byDelivery.get(item.delivery_id).push(item);
  }

  let withinBoxDups = 0;
  for (const [deliveryId, items] of byDelivery.entries()) {
    const ideaIds = items.map(i => i.idea_id);
    const unique = new Set(ideaIds);
    if (unique.size < ideaIds.length) {
      withinBoxDups++;
      fail(`Within-box duplicate in delivery ${deliveryId}: ${ideaIds.filter((id, i) => ideaIds.indexOf(id) !== i)}`);
    }
  }

  if (withinBoxDups === 0) {
    ok("No within-box duplicates found.");
  }

  // ─── 3. Check inventory alignment (retired = assigned) ───
  header("3. Inventory status alignment check");

  const assignedInventoryIds = allItems.map(i => i.inventory_id).filter(Boolean);

  if (assignedInventoryIds.length > 0) {
    // Check assigned items that don't have inventory_id
    const missingInvId = allItems.filter(i => !i.inventory_id);
    if (missingInvId.length > 0) {
      warn(`${missingInvId.length} idea_box_items have no inventory_id (legacy rows)`);
    }
  }

  // Check that all assigned inventory slots are retired
  const { data: activeAssigned } = await supabase
    .from("idea_inventory")
    .select("id, idea_id, status, reuse_count")
    .eq("status", "available")
    .eq("reuse_count", 0);

  // Cross-check: available inventory that is also in idea_box_items
  if (activeAssigned && activeAssigned.length > 0) {
    const assignedIdeasSet = new Set(allItems.map(i => i.idea_id));
    const leaking = activeAssigned.filter(inv => assignedIdeasSet.has(inv.idea_id));
    if (leaking.length > 0) {
      fail(`${leaking.length} inventory rows are still 'available' but their idea_id is already assigned to a box!`);
      for (const inv of leaking.slice(0, 10)) {
        console.log(`  inv.id=${inv.id} idea_id=${inv.idea_id} status=${inv.status} reuse=${inv.reuse_count}`);
      }
    } else {
      ok("No inventory leak: no 'available' inventory row has its idea_id in any box.");
    }
  }

  // ─── 4. Check retired inventory that ISN'T in any box (orphan retires) ───
  header("4. Orphan retired inventory check");

  const { data: retiredInv } = await supabase
    .from("idea_inventory")
    .select("id, idea_id, status, reuse_count")
    .eq("status", "retired")
    .limit(2000);

  if (retiredInv) {
    const assignedIdeasSet = new Set(allItems.map(i => i.idea_id));
    const orphanRetired = retiredInv.filter(inv => !assignedIdeasSet.has(inv.idea_id));
    if (orphanRetired.length > 0) {
      warn(`${orphanRetired.length} inventory rows are 'retired' but NOT assigned to any box (orphan retires — could be replaced cards or manual retires)`);
    } else {
      ok("All retired inventory rows are accounted for in idea_box_items.");
    }
  }

  // ─── 5. Per-user box summary ───
  header("5. Per-user box summary");

  const { data: deliveries } = await supabase
    .from("idea_box_deliveries")
    .select("id, user_id, status, delivered_at, category_id, persona_id")
    .order("user_id")
    .order("delivered_at", { ascending: true });

  if (deliveries) {
    const byUser = new Map();
    for (const d of deliveries) {
      if (!byUser.has(d.user_id)) byUser.set(d.user_id, []);
      byUser.get(d.user_id).push(d);
    }

    for (const [userId, userDeliveries] of byUser.entries()) {
      const delivered = userDeliveries.filter(d => d.status === "delivered");
      console.log(`\n  User ${userId}: ${delivered.length} delivered box(es), ${userDeliveries.length} total deliveries`);

      // Check if this user has any cross-box duplicates
      const userItems = allItems.filter(i => i.user_id === userId);
      const userIdeaIds = userItems.map(i => i.idea_id);
      const uniqueUserIdeas = new Set(userIdeaIds);

      if (uniqueUserIdeas.size < userIdeaIds.length) {
        fail(`  → User has ${userIdeaIds.length - uniqueUserIdeas.size} duplicate idea_ids across their boxes!`);
        // Find the duplicates
        const counts = {};
        for (const id of userIdeaIds) counts[id] = (counts[id] || 0) + 1;
        for (const [ideaId, count] of Object.entries(counts)) {
          if (count > 1) {
            console.log(`    DUPE idea_id=${ideaId} appears ${count} times`);
          }
        }
      } else {
        ok(`  → All ${uniqueUserIdeas.size} cards are unique across this user's ${delivered.length} box(es).`);
      }
    }
  }

  // ─── 6. Overall inventory stock count ───
  header("6. Available inventory stock (remaining capacity)");

  const { data: available, error: availErr } = await supabase
    .from("idea_inventory")
    .select("score_band, category_id")
    .eq("status", "available")
    .eq("reuse_count", 0);

  if (availErr) {
    warn(`Could not query inventory: ${availErr.message}`);
  } else {
    const bands = { low: 0, mid: 0, high: 0 };
    for (const row of available) {
      bands[row.score_band] = (bands[row.score_band] || 0) + 1;
    }
    info(`Available inventory: low=${bands.low} mid=${bands.mid} high=${bands.high} (total=${available.length})`);
    if (available.length < 50) {
      warn("Inventory is running low! Consider generating more cards.");
    }
  }

  console.log(`\n${BOLD}═══════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  Audit complete.${RESET}`);
  console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}\n`);
}

run().catch(err => {
  fail(`Unhandled error: ${err.message}`);
  process.exit(1);
});
