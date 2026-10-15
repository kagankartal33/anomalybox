/**
 * Authenticated creator smoke:
 * - signs in with Supabase SSR cookie storage
 * - requests /boxes with the real auth cookies
 * - finds one assigned card for that user
 * - requests /cards/:ideaId with the same auth cookies
 *
 * Defaults use the local demo account from tools/reset-demo-account.ps1.
 * Override with AUTH_SMOKE_EMAIL, AUTH_SMOKE_PASSWORD, and BASE_URL.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function loadDotEnv(path = ".env.local") {
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

function cookieHeader(cookies) {
  return cookies.map(({ name, value }) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`).join("; ");
}

async function fetchText(url, cookies) {
  const response = await fetch(url, {
    redirect: "manual",
    headers: {
      Cookie: cookieHeader(cookies),
    },
  });
  const body = await response.text();
  return { response, body };
}

async function maybeSingleOrThrow(query) {
  const { data, error } = await query.maybeSingle();
  assert.ifError(error);
  return data;
}

async function createSmokeCard(admin, userId) {
  const batchId = "auth_smoke_creator_card";
  const [{ data: product, error: productError }, { data: category, error: categoryError }, { data: persona, error: personaError }] = await Promise.all([
    admin.from("box_products").select("id,price_usd_cents").eq("slug", "viral_box_500").maybeSingle(),
    admin.from("categories").select("id").eq("slug", "travel").maybeSingle(),
    admin.from("creator_personas").select("id").eq("slug", "travel_curator").maybeSingle(),
  ]);
  assert.ifError(productError);
  assert.ifError(categoryError);
  assert.ifError(personaError);
  assert.ok(product?.id, "smoke setup requires viral_box_500");
  assert.ok(category?.id, "smoke setup requires travel category");
  assert.ok(persona?.id, "smoke setup requires travel_curator persona");

  const oldCandidates = await admin.from("idea_candidates").select("id").eq("user_id", userId).eq("external_idea_id", batchId);
  assert.ifError(oldCandidates.error);
  const oldIdeaIds = (oldCandidates.data ?? []).map((row) => row.id);
  if (oldIdeaIds.length) {
    const oldItems = await admin.from("idea_box_items").select("delivery_id").eq("user_id", userId).in("idea_id", oldIdeaIds);
    assert.ifError(oldItems.error);
    const oldDeliveryIds = [...new Set((oldItems.data ?? []).map((row) => row.delivery_id).filter(Boolean))];
    await admin.from("idea_box_items").delete().eq("user_id", userId).in("idea_id", oldIdeaIds);
    await admin.from("idea_inventory").delete().in("idea_id", oldIdeaIds);
    await admin.from("idea_cards").delete().in("idea_id", oldIdeaIds);
    if (oldDeliveryIds.length) await admin.from("idea_box_deliveries").delete().in("id", oldDeliveryIds);
    await admin.from("idea_candidates").delete().in("id", oldIdeaIds);
  }

  const cardPayload = {
    title: "Creator Smoke Travel Card",
    format: "instagram_reels_35_45",
    one_sentence_premise: "A short travel Reel that proves the authenticated creator can open a private card.",
    idea_summary: {
      premise: "The creator opens with a clean arrival shot, shows one proof detail, and ends with a saveable route prompt.",
      creator_takeaway: "Show arrival, proof, and a clear viewer action.",
    },
    video_blueprint: {
      duration_seconds: 35,
      opening_visual: "Start on a clean arrival shot with the destination visible.",
      scene_arc: "Arrival -> proof detail -> route cue -> save/comment CTA.",
      payoff_visual: "Hold the route cue long enough to read.",
    },
    execution_ranges: [
      {
        time_range: "0-3s",
        purpose: "attention",
        action: "Open on the destination or product experience in one steady shot.",
        camera: "Keep the frame stable and readable.",
        say: "This is the moment I would check first.",
        on_screen_text_required: true,
        on_screen_text: "First check",
        creator_touch: "Use the real location or offer detail.",
        edit: "Hard cut from arrival into proof.",
        visual_cue: "environment",
      },
      {
        time_range: "4-15s",
        purpose: "proof",
        action: "Show one concrete proof detail that helps the viewer decide.",
        camera: "Move from medium shot to close detail.",
        say: "Here is the detail that makes the choice easier.",
        on_screen_text_required: true,
        on_screen_text: "Proof detail",
        creator_touch: "Name the audience's real question.",
        edit: "Let the proof breathe, then cut before it repeats.",
        visual_cue: "proof",
      },
      {
        time_range: "16-35s",
        purpose: "payoff",
        action: "End with a route, checklist, or comment choice.",
        camera: "Return to a clean wide frame.",
        say: "Save this before you choose the route.",
        on_screen_text_required: true,
        on_screen_text: "Save this route",
        creator_touch: "Ask one specific comment question.",
        edit: "Hold the final overlay for at least two seconds.",
        visual_cue: "payoff",
      },
    ],
    scene_script: [
      { second: "0-3", purpose: "attention", voiceover: "This is the moment I would check first.", on_screen_text: "First check" },
      { second: "4-15", purpose: "proof", voiceover: "Here is the detail that makes the choice easier.", on_screen_text: "Proof detail" },
      { second: "16-35", purpose: "payoff", voiceover: "Save this before you choose the route.", on_screen_text: "Save this route" },
    ],
    shot_list: [
      { second: "0-3", shot: "Arrival", action: "Show the clearest first impression.", overlay: "First check" },
      { second: "4-15", shot: "Proof", action: "Show the most useful decision detail.", overlay: "Proof detail" },
      { second: "16-35", shot: "CTA", action: "Hold the final save/comment prompt.", overlay: "Save this route" },
    ],
    editing_timeline: [
      { second: "0-3", beat: "attention", edit: "Hard cut into proof." },
      { second: "4-15", beat: "proof", edit: "Use one close-up and one medium shot." },
      { second: "16-35", beat: "payoff", edit: "Hold the final overlay." },
    ],
  };

  const candidate = await maybeSingleOrThrow(
    admin
      .from("idea_candidates")
      .insert({
        user_id: userId,
        category_id: category.id,
        persona_id: persona.id,
        platform: "instagram_reels",
        format: "reels_35_45",
        language: "en",
        locale: "US",
        title: cardPayload.title,
        one_sentence_premise: cardPayload.one_sentence_premise,
        core_insight: "Authenticated creator smoke card.",
        opportunity_statement: "Verify protected card access.",
        mechanism_ids: ["auth_smoke"],
        hook_options: ["This is the moment I would check first."],
        story_beats: cardPayload.scene_script,
        human_awareness: { tone: "calm" },
        production_requirements: { smoke: true },
        safety_status: "SAFE",
        perspective_prism_status: "PASS",
        confidence_band: "HIGH",
        status: "published",
        decision_trace: { smoke: true },
        external_idea_id: batchId,
        content_style_layers: ["auth_smoke"],
        candidate_source: "admin_direct",
      })
      .select("id")
  );

  await admin.from("idea_cards").insert({
    idea_id: candidate.id,
    title: cardPayload.title,
    card: cardPayload,
    markdown: `# ${cardPayload.title}\n\n${cardPayload.one_sentence_premise}`,
  });

  const inventory = await maybeSingleOrThrow(
    admin
      .from("idea_inventory")
      .insert({
        idea_id: candidate.id,
        category_id: category.id,
        persona_id: persona.id,
        platform: "instagram_reels",
        language: "en",
        content_style_layers: ["auth_smoke"],
        internal_rank_score: 99,
        score_band: "high",
        quality_floor_passed: true,
        status: "retired",
        reuse_count: 1,
        max_reuse_count: 1,
        last_assigned_at: new Date().toISOString(),
        metadata: { smoke: true, custom_batch_id: batchId },
      })
      .select("id")
  );

  const purchase = await maybeSingleOrThrow(
    admin
      .from("purchases")
      .insert({
        user_id: userId,
        box_product_id: product.id,
        provider: "admin_gift",
        amount_usd_cents: product.price_usd_cents,
        currency: "usd",
        status: "paid",
        category_id: category.id,
        persona_id: persona.id,
        fulfillment_source: "admin_gift",
        completed_at: new Date().toISOString(),
        metadata: { smoke: true, custom_batch_id: batchId },
        raw_event: { source: "test-authenticated-creator-smoke" },
      })
      .select("id")
  );

  const delivery = await maybeSingleOrThrow(
    admin
      .from("idea_box_deliveries")
      .insert({
        user_id: userId,
        purchase_id: purchase.id,
        box_product_id: product.id,
        category_id: category.id,
        persona_id: persona.id,
        status: "delivered",
        allocation: { high: 1 },
        delivered_at: new Date().toISOString(),
        metadata: { smoke: true, custom_batch_id: batchId, opened_at: new Date().toISOString() },
      })
      .select("id")
  );

  await admin.from("idea_box_items").insert({
    delivery_id: delivery.id,
    user_id: userId,
    inventory_id: inventory.id,
    idea_id: candidate.id,
    slot_index: 1,
    assigned_band: "high",
  });

  return { idea_id: candidate.id, delivery_id: delivery.id, slot_index: 1 };
}

loadDotEnv();

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.AUTH_SMOKE_EMAIL ?? "demo.creator@viralbox.test";
const password = process.env.AUTH_SMOKE_PASSWORD ?? "DemoViralBox2026!";

assert.ok(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL is required");
assert.ok(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required");
assert.ok(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY is required");
assert.ok(email, "AUTH_SMOKE_EMAIL is required");
assert.ok(password, "AUTH_SMOKE_PASSWORD is required");

const cookies = [];
const supabase = createServerClient(supabaseUrl, anonKey, {
  cookies: {
    getAll() {
      return cookies;
    },
    setAll(items) {
      for (const item of items) {
        const existing = cookies.findIndex((cookie) => cookie.name === item.name);
        const next = { name: item.name, value: item.value };
        if (existing >= 0) cookies[existing] = next;
        else cookies.push(next);
      }
    },
  },
});

const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
assert.ifError(signInError);
assert.ok(signInData.user?.id, "sign-in should return a user");
assert.ok(cookies.length > 0, "sign-in should set SSR auth cookies");

const boxes = await fetchText(`${baseUrl}/boxes`, cookies);
assert.equal(boxes.response.status, 200, `/boxes should render for authenticated creator, got ${boxes.response.status}`);
assert.match(boxes.body, /Creator Vault|Your premium collection/i, "/boxes should render Creator Vault content");
assert.doesNotMatch(boxes.body, /Welcome back|Sign in/i, "/boxes should not render login content");

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let { data: item, error: itemError } = await admin
  .from("idea_box_items")
  .select("idea_id,delivery_id,slot_index")
  .eq("user_id", signInData.user.id)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

assert.ifError(itemError);
if (!item?.idea_id) {
  item = await createSmokeCard(admin, signInData.user.id);
}
assert.ok(item?.idea_id, "creator should have at least one assigned card for card-detail smoke");

const card = await fetchText(`${baseUrl}/cards/${item.idea_id}`, cookies);
assert.equal(card.response.status, 200, `/cards/${item.idea_id} should render, got ${card.response.status}`);
assert.match(card.body, /Premium creator brief/i, "card detail should render creator brief header");
assert.match(card.body, /Video Flow/i, "card detail should include the Video Flow overview");
assert.match(card.body, /Shoot Plan/i, "card detail should include the Shoot Plan");
assert.match(card.body, />Goal</i, "card detail should expose the step goal");
assert.match(card.body, />Action</i, "card detail should expose the step action");
assert.match(card.body, />Say this</i, "card detail should expose spoken-line direction");
assert.match(card.body, />Shot</i, "card detail should expose shot direction");
assert.doesNotMatch(card.body, /Use this idea in your own words/i, "card detail should not show old raw Say copy");
assert.doesNotMatch(card.body, /Read this as set direction/i, "card detail should not show old set-direction helper copy");
assert.doesNotMatch(card.body, /You do not have access/i, "card detail should not deny access");
assert.doesNotMatch(card.body, /\b(score_band|training|dataset|internal_rank_score)\b/i, "card detail should not expose internal terms");

console.log(`Authenticated creator smoke passed for ${email}`);
console.log(`Vault: ${baseUrl}/boxes`);
console.log(`Card:  ${baseUrl}/cards/${item.idea_id}`);