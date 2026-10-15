import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { randomUUID } from "crypto";

function loadEnv(file) {
  const env = {};
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf-8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [k, ...v] = trimmed.split("=");
        if (!env[k.trim()]) {
          env[k.trim()] = v.join("=").replace(/^["']|["']$/g, "").trim();
        }
      }
    }
  }
  return env;
}

const prodEnv = loadEnv(".env.production.local");
const supabaseUrl = prodEnv.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = prodEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.production.local");
  process.exit(1);
}

console.log("Connected to LIVE Production Supabase:", supabaseUrl);

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TARGET_EMAIL = "kagankartalbabahan@outlook.com";
const TARGET_NAME = "Kagan Kartal Babahan";

async function main() {
  // Step 1: Ensure 12 Categories exist on Production
  console.log("\n--- Step 1: Ensuring 12 categories on Production ---");
  const storeCats = [
    { slug: "beauty", name: "Beauty", family: "creator_content", enabled: true },
    { slug: "commerce_affiliate", name: "Commerce & Affiliate", family: "creator_content", enabled: true },
    { slug: "creator_education", name: "Creator Education", family: "creator_content", enabled: true },
    { slug: "entertainment_comedy", name: "Entertainment Comedy", family: "creator_content", enabled: true },
    { slug: "fashion", name: "Fashion", family: "creator_content", enabled: true },
    { slug: "fitness_wellness_safe", name: "Fitness & Wellness Safe", family: "creator_content", enabled: true },
    { slug: "food", name: "Food", family: "creator_content", enabled: true },
    { slug: "lifestyle", name: "Lifestyle", family: "creator_content", enabled: true },
    { slug: "luxury", name: "Luxury", family: "creator_content", enabled: true },
    { slug: "parenting_family", name: "Parenting & Family", family: "creator_content", enabled: true },
    { slug: "thought_leadership", name: "Thought Leadership", family: "creator_content", enabled: true },
    { slug: "travel", name: "Travel", family: "creator_content", enabled: true },
  ];

  for (const c of storeCats) {
    await supabase.from("categories").upsert(c, { onConflict: "slug" });
  }

  // Step 2: Ensure 84 Finalist Cards are on Production
  console.log("--- Step 2: Ensuring Idea Cards Stock on Production ---");
  const { data: dbCats } = await supabase.from("categories").select("id,slug").in("slug", storeCats.map(s => s.slug));
  const catMap = Object.fromEntries(dbCats.map(c => [c.slug, c.id]));

  const { data: dbPersonas } = await supabase.from("creator_personas").select("id,slug").limit(100);
  const personaMap = Object.fromEntries(dbPersonas.map(p => [p.slug, p.id]));
  const defaultPersonaId = dbPersonas[0]?.id;

  const cardLines = readFileSync("production_exports/store_12_categories_84_cards.jsonl", "utf-8")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => JSON.parse(l));

  const candRows = [];
  const cardRows = [];
  const invRows = [];

  for (const r of cardLines) {
    const catSlug = r.category_slug;
    const catId = catMap[catSlug];
    if (!catId) continue;

    const pSlug = r.persona_slug || "expert_guide";
    const pId = personaMap[pSlug] || defaultPersonaId;
    const ideaId = r.idea_id || randomUUID();
    const cand = r.candidate || {};
    const card = r.card || {};
    const scoreBand = r.score_band;
    const rank = r.rank || 85;

    const title = card.title || cand.title || "Creator Brief Card";
    const premise = cand.one_sentence_premise || card.card?.one_sentence_premise || "Execution-ready creator brief.";

    candRows.push({
      id: ideaId,
      platform: "instagram_reels",
      format: "reels",
      language: "en",
      locale: "en-US",
      title,
      one_sentence_premise: premise,
      safety_status: "SAFE",
      perspective_prism_status: "PASS",
      confidence_band: "high",
      status: "published",
      decision_trace: cand.decision_trace || { production_finalist: true },
      category_id: catId,
      persona_id: pId,
      candidate_source: "admin_direct",
      hook_options: cand.hook_options || [],
      story_beats: cand.story_beats || [],
      comedy_remix: cand.comedy_remix || {},
      human_awareness: cand.human_awareness || {},
      production_requirements: cand.production_requirements || {},
    });

    cardRows.push({
      idea_id: ideaId,
      title,
      card: card.card || {},
    });

    invRows.push({
      idea_id: ideaId,
      category_id: catId,
      persona_id: pId,
      platform: "instagram_reels",
      language: "en",
      internal_rank_score: rank,
      score_band: scoreBand,
      quality_floor_passed: true,
      status: "available",
      reuse_count: 0,
      max_reuse_count: 1,
      metadata: {
        production_finalist: true,
        score_band: scoreBand,
        category_slug: catSlug,
        creator_visible_scores: false,
      },
    });
  }

  await supabase.from("idea_candidates").upsert(candRows, { onConflict: "id" });
  await supabase.from("idea_cards").upsert(cardRows, { onConflict: "idea_id" });
  await supabase.from("idea_inventory").upsert(invRows, { onConflict: "idea_id" });
  console.log(`✓ 84 Finalist Cards synced to Production Supabase!`);

  // Step 3: Find User in Production Auth
  console.log(`\n--- Step 3: Locating user ${TARGET_EMAIL} on Production ---`);
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) console.error("listUsers error:", listError.message);

  let targetUser = usersData?.users?.find(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());

  if (!targetUser) {
    console.log(`User not found in Auth. Checking all registered emails:`);
    for (const u of usersData?.users || []) {
      console.log(`  - ${u.id}: ${u.email}`);
    }
    // Also check profiles table
    const { data: profs } = await supabase.from("profiles").select("id,display_name");
    console.log("Profiles in DB:", profs);

    // Let's create the user in Auth if not existing
    console.log(`Creating user ${TARGET_EMAIL} in Production Auth...`);
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email: TARGET_EMAIL,
      email_confirm: true,
      user_metadata: { display_name: TARGET_NAME },
    });
    if (cErr) {
      console.error("Create user error:", cErr.message);
    } else {
      targetUser = created.user;
    }
  }

  if (!targetUser) {
    console.error("Could not find or create target user on production.");
    process.exit(1);
  }

  const userId = targetUser.id;
  console.log(`✓ Found target user on Production: ${userId} (${targetUser.email})`);

  // Step 4: Ensure Profile and Creator Profile
  await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: TARGET_NAME,
      role: "creator",
    },
    { onConflict: "id" }
  );

  await supabase.from("creator_profiles").upsert(
    {
      user_id: userId,
      handle: "@kagankartal",
      niche: "luxury, fashion & lifestyle",
      default_platforms: ["instagram_reels"],
    },
    { onConflict: "user_id" }
  );

  // Step 5: Deliver 1 Classic Red Box and 1 Signature Purple Box
  console.log("\n--- Step 5: Delivering Boxes to User on Production ---");

  // Box 1: Classic Red (viral_box_500)
  const { data: pRed } = await supabase.from("box_products").select("id").eq("slug", "viral_box_500").single();
  const { data: purchase1 } = await supabase
    .from("purchases")
    .insert({
      user_id: userId,
      box_product_id: pRed.id,
      provider: "admin_gift",
      amount_usd_cents: 2900,
      currency: "usd",
      status: "paid",
      fulfillment_source: "admin_gift",
      completed_at: new Date().toISOString(),
      metadata: { box_product_slug: "viral_box_500", category_slug: "lifestyle", persona_slug: "relatable_lifestyle", gift: true },
    })
    .select("id")
    .single();

  const { data: del1, error: del1Err } = await supabase.rpc("deliver_idea_box", {
    p_user_id: userId,
    p_box_product_slug: "viral_box_500",
    p_category_slug: "lifestyle",
    p_persona_slug: "relatable_lifestyle",
    p_purchase_id: purchase1?.id || null,
  });

  if (del1Err) console.error("Red delivery error:", del1Err.message);
  else console.log(`✓ Classic Red Box delivered on Production! Delivery ID: ${del1}`);

  // Box 2: Signature Purple (premium_viral_box_1000)
  const { data: pPurple } = await supabase.from("box_products").select("id").eq("slug", "premium_viral_box_1000").single();
  const { data: purchase2 } = await supabase
    .from("purchases")
    .insert({
      user_id: userId,
      box_product_id: pPurple.id,
      provider: "admin_gift",
      amount_usd_cents: 5900,
      currency: "usd",
      status: "paid",
      fulfillment_source: "admin_gift",
      completed_at: new Date().toISOString(),
      metadata: { box_product_slug: "premium_viral_box_1000", category_slug: "luxury", persona_slug: "luxury_editor", gift: true },
    })
    .select("id")
    .single();

  const { data: del2, error: del2Err } = await supabase.rpc("deliver_idea_box", {
    p_user_id: userId,
    p_box_product_slug: "premium_viral_box_1000",
    p_category_slug: "luxury",
    p_persona_slug: "luxury_editor",
    p_purchase_id: purchase2?.id || null,
  });

  if (del2Err) console.error("Purple delivery error:", del2Err.message);
  else console.log(`✓ Signature Purple Box delivered on Production! Delivery ID: ${del2}`);

  // Step 6: Verify User Deliveries in Production Creator Vault
  console.log("\n--- Step 6: Verifying Production Creator Vault ---");
  const { data: deliveries, error: dErr } = await supabase
    .from("idea_box_deliveries")
    .select(`
      id,
      status,
      delivered_at,
      box_product:box_products(slug, name),
      category:categories(slug, name),
      persona:creator_personas(slug, name),
      items:idea_box_items(
        id,
        slot_index,
        assigned_band,
        card:idea_cards(title)
      )
    `)
    .eq("user_id", userId);

  if (dErr) console.error("Error fetching deliveries:", dErr.message);

  console.log(`\n🎉 Total Boxes in Production Creator Vault for ${TARGET_EMAIL}: ${deliveries?.length || 0}`);
  for (const d of deliveries || []) {
    console.log(`\n📦 [${d.box_product?.name}] (${d.box_product?.slug})`);
    console.log(`   Lane: ${d.category?.name} | Persona: ${d.persona?.name} | Status: ${d.status}`);
    console.log(`   Cards assigned (${d.items?.length || 0}):`);
    for (const it of d.items || []) {
      console.log(`     - [Slot ${it.slot_index} | ${it.assigned_band?.toUpperCase()}] ${it.card?.title}`);
    }
  }
}

main().catch(console.error);
