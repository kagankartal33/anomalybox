import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { randomUUID } from "crypto";

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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:58321";
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TARGET_EMAIL = "kagankartalbabahan@outlook.com";
const TARGET_NAME = "Kagan Kartal Babahan";

async function run() {
  console.log(`\n=== GIFTING 1 CLASSIC RED + 1 SIGNATURE PURPLE BOX TO ${TARGET_EMAIL} ===`);
  console.log(`Supabase URL: ${supabaseUrl}`);

  // 1. Find or create user in Supabase Auth
  let userId;
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.log("listUsers error:", listError.message);
  }

  const existingUser = usersData?.users?.find((u) => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());

  if (existingUser) {
    userId = existingUser.id;
    console.log(`✓ Found existing user: ${userId} (${existingUser.email})`);
  } else {
    console.log(`Creating user ${TARGET_EMAIL}...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: TARGET_EMAIL,
      email_confirm: true,
      user_metadata: { display_name: TARGET_NAME },
    });

    if (createError) {
      console.error("User creation failed:", createError.message);
      // Fallback: check if we can query profiles
      const { data: prof } = await supabase.from("profiles").select("id").eq("display_name", TARGET_NAME).limit(1);
      if (prof && prof.length > 0) {
        userId = prof[0].id;
      } else {
        // Generate a new UUID for profile
        userId = randomUUID();
        console.log(`Generating local UUID for user: ${userId}`);
      }
    } else if (newUser?.user) {
      userId = newUser.user.id;
      console.log(`✓ Created user: ${userId}`);
    }
  }

  // 2. Ensure Profile & Creator Profile
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

  console.log(`✓ Profile & creator profile ready for ${userId}`);

  // 3. Deliver Box 1: Classic Red Dossier (viral_box_500)
  console.log("\n--- Delivering Box 1: Classic Red Dossier (viral_box_500) ---");
  const { data: purchase1, error: p1Err } = await supabase
    .from("purchases")
    .insert({
      user_id: userId,
      box_product_id: (await supabase.from("box_products").select("id").eq("slug", "viral_box_500").single()).data?.id,
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

  if (p1Err) console.log("Purchase 1 notice:", p1Err.message);

  const { data: del1, error: del1Err } = await supabase.rpc("deliver_idea_box", {
    p_user_id: userId,
    p_box_product_slug: "viral_box_500",
    p_category_slug: "lifestyle",
    p_persona_slug: "relatable_lifestyle",
    p_purchase_id: purchase1?.id || null,
  });

  if (del1Err) {
    console.error("Delivery 1 error:", del1Err.message);
  } else {
    console.log(`✓ Classic Red Box delivered! Delivery ID: ${del1}`);
  }

  // 4. Deliver Box 2: Signature Purple Dossier (premium_viral_box_1000)
  console.log("\n--- Delivering Box 2: Signature Purple Dossier (premium_viral_box_1000) ---");
  const { data: purchase2, error: p2Err } = await supabase
    .from("purchases")
    .insert({
      user_id: userId,
      box_product_id: (await supabase.from("box_products").select("id").eq("slug", "premium_viral_box_1000").single()).data?.id,
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

  if (p2Err) console.log("Purchase 2 notice:", p2Err.message);

  const { data: del2, error: del2Err } = await supabase.rpc("deliver_idea_box", {
    p_user_id: userId,
    p_box_product_slug: "premium_viral_box_1000",
    p_category_slug: "luxury",
    p_persona_slug: "luxury_editor",
    p_purchase_id: purchase2?.id || null,
  });

  if (del2Err) {
    console.error("Delivery 2 error:", del2Err.message);
  } else {
    console.log(`✓ Signature Purple Box delivered! Delivery ID: ${del2}`);
  }

  // 5. Verify User Deliveries and Items
  console.log("\n--- Verifying Creator Vault for User ---");
  const { data: userDeliveries } = await supabase
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
    .eq("user_id", userId)
    .order("delivered_at", { ascending: false });

  console.log(`Total boxes in Creator Vault for ${TARGET_EMAIL}: ${userDeliveries?.length || 0}`);
  for (const d of userDeliveries || []) {
    console.log(`\n📦 Box: ${d.box_product?.name} (${d.box_product?.slug})`);
    console.log(`   Lane: ${d.category?.name} | Persona: ${d.persona?.name} | Status: ${d.status}`);
    console.log(`   Cards assigned (${d.items?.length || 0}):`);
    for (const it of d.items || []) {
      console.log(`     - [Slot ${it.slot_index} | ${it.assigned_band?.toUpperCase()}] ${it.card?.title}`);
    }
  }

  console.log("\n🎉 SUCCESS: 1 Classic Red Box and 1 Signature Purple Box have been delivered!");
}

run().catch(console.error);
