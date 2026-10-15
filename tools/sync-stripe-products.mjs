/**
 * Create / sync Anomaly Box products + one-time USD prices in Stripe.
 * Also writes stripe product/price ids into public.box_products.metadata when
 * Supabase service credentials are available.
 *
 * Usage:
 *   node tools/sync-stripe-products.mjs
 *   node tools/sync-stripe-products.mjs --mode test
 *   node tools/sync-stripe-products.mjs --mode live
 *   node tools/sync-stripe-products.mjs --mode both
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const CATALOG = [
  {
    slug: "viral_box_500",
    name: "Classic Red Dossier",
    description: "2 campaign-ready creative briefs calibrated to your lane, creator mode, and production style.",
    amountCents: 900,
    ideaCount: 2,
  },
  {
    slug: "premium_viral_box_1000",
    name: "Signature Purple Dossier",
    description: "5 campaign-ready creative briefs with deeper production direction and launch-ready creative angles.",
    amountCents: 1900,
    ideaCount: 5,
  },
];

const modeArgIndex = process.argv.indexOf("--mode");
const requestedMode = modeArgIndex >= 0 ? process.argv[modeArgIndex + 1] : "test";

function die(message) {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function info(message) {
  console.log(message);
}

function readStripeCliConfig() {
  const configPath = path.join(os.homedir(), ".config", "stripe", "config.toml");
  if (!fs.existsSync(configPath)) die(`Stripe CLI config missing: ${configPath}`);
  const raw = fs.readFileSync(configPath, "utf8");
  // Prefer the profile that has a live key (real account), not an older sandbox block.
  const blocks = raw.split(/\n(?=\[)/);
  let best = null;
  for (const block of blocks) {
    const pick = (key) => block.match(new RegExp(`${key}\\s*=\\s*'([^']+)'`))?.[1] ?? "";
    const candidate = {
      testKey: pick("test_mode_api_key"),
      liveKey: pick("live_mode_api_key"),
      displayName: pick("display_name"),
      accountId: pick("account_id"),
    };
    if (!candidate.accountId && !candidate.testKey && !candidate.liveKey) continue;
    if (!best) best = candidate;
    if (candidate.liveKey) best = candidate;
  }
  if (!best) die("No Stripe CLI account block found.");
  return best;
}

function loadDotEnv(filePath = ".env.local") {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

function stripeJson(apiKey, verb, resourcePath, formFields = [], { live = false } = {}) {
  const args = [verb, resourcePath, "--api-key", apiKey];
  if (live) args.push("--live");
  if (verb === "post" || verb === "delete") args.push("--confirm");
  for (const field of formFields) args.push("-d", field);
  const result = spawnSync("stripe", args, { encoding: "utf8", windowsHide: true });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "stripe command failed").trim().slice(0, 600));
  }
  const stdout = (result.stdout || "").trim();
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error(`Non-JSON Stripe response for ${verb} ${resourcePath}`);
  return JSON.parse(stdout.slice(start, end + 1));
}

function listAll(apiKey, resourcePath, { live = false, params = [] } = {}) {
  const out = [];
  let startingAfter = "";
  for (let i = 0; i < 20; i += 1) {
    const query = ["limit=100", ...params];
    if (startingAfter) query.push(`starting_after=${startingAfter}`);
    const pathWithQuery = `${resourcePath}?${query.join("&")}`;
    const page = stripeJson(apiKey, "get", pathWithQuery, [], { live });
    const data = Array.isArray(page.data) ? page.data : [];
    out.push(...data);
    if (!page.has_more || data.length === 0) break;
    startingAfter = data[data.length - 1].id;
  }
  return out;
}

function ensureProduct(apiKey, item, { live = false } = {}) {
  const products = listAll(apiKey, "/v1/products", { live });
  const existing = products.find(
    (product) => product.metadata?.box_product_slug === item.slug || product.name === item.name,
  );

  if (existing) {
    const updated = stripeJson(
      apiKey,
      "post",
      `/v1/products/${existing.id}`,
      [
        `name=${item.name}`,
        `description=${item.description}`,
        "active=true",
        `metadata[box_product_slug]=${item.slug}`,
        `metadata[idea_count]=${item.ideaCount}`,
        "metadata[currency]=usd",
      ],
      { live },
    );
    info(`Updated product ${updated.id} (${item.slug}) live=${live}`);
    return updated;
  }

  const created = stripeJson(
    apiKey,
    "post",
    "/v1/products",
    [
      `name=${item.name}`,
      `description=${item.description}`,
      "active=true",
      `metadata[box_product_slug]=${item.slug}`,
      `metadata[idea_count]=${item.ideaCount}`,
      "metadata[currency]=usd",
    ],
    { live },
  );
  info(`Created product ${created.id} (${item.slug}) live=${live}`);
  return created;
}

function ensurePrice(apiKey, item, productId, { live = false } = {}) {
  const prices = listAll(apiKey, "/v1/prices", {
    live,
    params: [`product=${productId}`, "active=true"],
  }).filter((price) => price.product === productId || price.product?.id === productId);
  const match = prices.find(
    (price) =>
      price.currency === "usd" &&
      price.unit_amount === item.amountCents &&
      price.type === "one_time" &&
      (price.metadata?.box_product_slug === item.slug || !price.metadata?.box_product_slug),
  );
  if (match) {
    info(`Reusing price ${match.id} for ${item.slug} ($${(item.amountCents / 100).toFixed(2)}) live=${live}`);
    return match;
  }

  // Archive other active one-time prices for THIS product only.
  for (const price of prices) {
    if (price.type === "one_time" && price.active && price.id) {
      try {
        stripeJson(apiKey, "post", `/v1/prices/${price.id}`, ["active=false"], { live });
        info(`Archived old price ${price.id} on ${productId}`);
      } catch (error) {
        console.warn(`WARN could not archive ${price.id}: ${error.message}`);
      }
    }
  }

  const created = stripeJson(
    apiKey,
    "post",
    "/v1/prices",
    [
      `product=${productId}`,
      "currency=usd",
      `unit_amount=${item.amountCents}`,
      "tax_behavior=unspecified",
      `metadata[box_product_slug]=${item.slug}`,
      `metadata[idea_count]=${item.ideaCount}`,
      `nickname=${item.slug}`,
    ],
    { live },
  );
  info(`Created price ${created.id} for ${item.slug} ($${(item.amountCents / 100).toFixed(2)}) live=${live}`);
  return created;
}

async function writeSupabaseMetadata(results, mode) {
  loadDotEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    info("Skip Supabase metadata write (missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).");
    return;
  }

  for (const row of results) {
    try {
      const listRes = await fetch(
        `${supabaseUrl}/rest/v1/box_products?slug=eq.${encodeURIComponent(row.slug)}&select=id,slug,metadata`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        },
      );
      if (!listRes.ok) {
        console.warn(`WARN could not load box_products for ${row.slug}: ${listRes.status} ${await listRes.text()}`);
        continue;
      }
      const rows = await listRes.json();
      const product = rows[0];
      if (!product) {
        console.warn(`WARN no box_products row for ${row.slug}`);
        continue;
      }
      const existingMeta = product.metadata && typeof product.metadata === "object" ? product.metadata : {};
      const existingStripe = existingMeta.stripe && typeof existingMeta.stripe === "object" ? existingMeta.stripe : {};
      const metadata = {
        ...existingMeta,
        stripe: {
          ...existingStripe,
          [mode]: {
            product_id: row.productId,
            price_id: row.priceId,
            currency: "usd",
            unit_amount: row.amountCents,
            synced_at: new Date().toISOString(),
          },
        },
      };
      const updateRes = await fetch(`${supabaseUrl}/rest/v1/box_products?id=eq.${product.id}`, {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ price_usd_cents: row.amountCents, metadata }),
      });
      if (!updateRes.ok) {
        console.warn(`WARN metadata update failed for ${row.slug}: ${updateRes.status} ${await updateRes.text()}`);
      } else {
        info(`Saved Stripe ${mode} ids on box_products.${row.slug}`);
      }
    } catch (error) {
      console.warn(`WARN Supabase write failed for ${row.slug}: ${error instanceof Error ? error.message : error}`);
    }
  }
}

function isStripeSecret(key, mode) {
  if (!key) return false;
  if (mode === "live") return /^(sk|rk)_live_/.test(key);
  return /^(sk|rk)_test_/.test(key);
}

async function syncMode(mode, apiKey) {
  if (!isStripeSecret(apiKey, mode)) {
    die(`Missing valid ${mode} secret key.`);
  }
  const live = mode === "live";
  const account = stripeJson(apiKey, "get", "/v1/account", [], { live });
  info(
    `== Sync ${mode} == account=${account.id} charges_enabled=${account.charges_enabled} currency=${account.default_currency}`,
  );
  if (live && !account.charges_enabled) {
    die("Live charges are not enabled on this Stripe account yet.");
  }

  const results = [];
  for (const item of CATALOG) {
    const product = ensureProduct(apiKey, item, { live });
    const price = ensurePrice(apiKey, item, product.id, { live });
    results.push({
      slug: item.slug,
      name: item.name,
      amountCents: item.amountCents,
      productId: product.id,
      priceId: price.id,
    });
  }

  await writeSupabaseMetadata(results, mode);
  return results;
}

async function main() {
  const cli = readStripeCliConfig();
  info(`Stripe CLI: ${cli.displayName || cli.accountId || "unknown"}`);

  const modes =
    requestedMode === "both"
      ? ["test", "live"]
      : requestedMode === "live" || requestedMode === "test"
        ? [requestedMode]
        : (() => {
            die("Use --mode test | live | both");
          })();

  const summary = {};
  for (const mode of modes) {
    const key = mode === "live" ? cli.liveKey : cli.testKey;
    if (mode === "live" && !key) {
      die("Live key missing. Run: stripe login  (approve live access) then re-run with --mode live");
    }
    summary[mode] = await syncMode(mode, key);
  }

  info("== Summary ==");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => die(error instanceof Error ? error.message : String(error)));
