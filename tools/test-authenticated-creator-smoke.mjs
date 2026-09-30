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

const { data: item, error: itemError } = await admin
  .from("idea_box_items")
  .select("idea_id,delivery_id,slot_index")
  .eq("user_id", signInData.user.id)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

assert.ifError(itemError);
assert.ok(item?.idea_id, "creator should have at least one assigned card for card-detail smoke");

const card = await fetchText(`${baseUrl}/cards/${item.idea_id}`, cookies);
assert.equal(card.response.status, 200, `/cards/${item.idea_id} should render, got ${card.response.status}`);
assert.match(card.body, /Premium creator card/i, "card detail should render creator card header");
assert.match(card.body, /Scene Flow/i, "card detail should include Scene Flow");
assert.match(card.body, /Edit Assembly Guide/i, "card detail should include Edit Assembly Guide");
assert.doesNotMatch(card.body, /You do not have access/i, "card detail should not deny access");
assert.doesNotMatch(card.body, /\b(score_band|training|dataset|internal_rank_score)\b/i, "card detail should not expose internal terms");

console.log(`Authenticated creator smoke passed for ${email}`);
console.log(`Vault: ${baseUrl}/boxes`);
console.log(`Card:  ${baseUrl}/cards/${item.idea_id}`);