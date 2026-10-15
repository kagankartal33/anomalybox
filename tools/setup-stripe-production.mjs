/**
 * Configure Stripe for Anomaly Box production.
 *
 * - Reads Stripe CLI keys from ~/.config/stripe/config.toml
 * - Ensures a production webhook endpoint exists for the live site URL
 * - Writes STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET into Vercel production
 * - Optionally updates local .env.local (never commits secrets)
 *
 * Usage:
 *   node tools/setup-stripe-production.mjs
 *   node tools/setup-stripe-production.mjs --mode test
 *   node tools/setup-stripe-production.mjs --mode live
 *   node tools/setup-stripe-production.mjs --mode auto
 *   node tools/setup-stripe-production.mjs --skip-vercel
 *   node tools/setup-stripe-production.mjs --skip-env-local
 *   node tools/setup-stripe-production.mjs --redeploy
 */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const SITE_URL = "https://anomalybox.com";
const WEBHOOK_PATH = "/api/stripe/webhook";
const WEBHOOK_URL = `${SITE_URL}${WEBHOOK_PATH}`;
const WEBHOOK_DESCRIPTION = "Anomaly Box production fulfillment and inventory lifecycle";
const ENABLED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "charge.refunded",
];

const args = new Set(process.argv.slice(2));
const modeArgIndex = process.argv.indexOf("--mode");
const requestedMode = modeArgIndex >= 0 ? process.argv[modeArgIndex + 1] : "auto";
const skipVercel = args.has("--skip-vercel");
const skipEnvLocal = args.has("--skip-env-local");
const redeploy = args.has("--redeploy");

function die(message, code = 1) {
  console.error(`FAIL ${message}`);
  process.exit(code);
}

function info(message) {
  console.log(message);
}

function maskSecret(value) {
  if (!value || value.length < 12) return "(missing)";
  return `${value.slice(0, 10)}…${value.slice(-4)} (len ${value.length})`;
}

function readStripeCliConfig() {
  const configPath = path.join(os.homedir(), ".config", "stripe", "config.toml");
  if (!fs.existsSync(configPath)) {
    die(`Stripe CLI config not found at ${configPath}. Run: stripe login`);
  }
  const raw = fs.readFileSync(configPath, "utf8");
  const pick = (key) => {
    const match = raw.match(new RegExp(`${key}\\s*=\\s*'([^']+)'`));
    return match?.[1] ?? "";
  };
  return {
    configPath,
    accountId: pick("account_id"),
    displayName: pick("display_name"),
    testKey: pick("test_mode_api_key"),
    liveKey: pick("live_mode_api_key"),
    testPub: pick("test_mode_pub_key"),
    livePub: pick("live_mode_pub_key"),
  };
}

function stripeJson(apiKey, method, resourcePath, formFields = []) {
  const verb =
    method.toLowerCase() === "get"
      ? "get"
      : method.toLowerCase() === "delete"
        ? "delete"
        : "post";
  const args = [verb, resourcePath, "--api-key", apiKey];
  if (verb === "post" || verb === "delete") {
    args.push("--confirm");
  }
  for (const field of formFields) {
    args.push("-d", field);
  }
  const result = spawnSync("stripe", args, {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "Stripe CLI command failed").trim();
    throw new Error(err);
  }
  const stdout = (result.stdout || "").trim();
  if (!stdout) throw new Error(`Empty response from Stripe ${method} ${resourcePath}`);
  // Stripe CLI may print warnings before JSON.
  const jsonStart = stdout.indexOf("{");
  const jsonEnd = stdout.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < jsonStart) {
    throw new Error(`Stripe CLI returned non-JSON for ${method} ${resourcePath}`);
  }
  return JSON.parse(stdout.slice(jsonStart, jsonEnd + 1));
}

function resolveMode(cli, requested) {
  if (requested === "test") return "test";
  if (requested === "live") {
    if (!cli.liveKey?.startsWith("sk_live_")) {
      die(
        "Live mode requested but no live API key is available in Stripe CLI. Complete Stripe account activation, then run: stripe login",
      );
    }
    return "live";
  }
  if (requested === "auto") {
    return cli.liveKey?.startsWith("sk_live_") ? "live" : "test";
  }
  die(`Unknown --mode ${requested}. Use test | live | auto.`);
}

function accountStatus(apiKey) {
  const account = stripeJson(apiKey, "GET", "/v1/account");
  return {
    id: account.id,
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
    country: account.country,
    defaultCurrency: account.default_currency,
    displayName: account.settings?.dashboard?.display_name ?? account.business_profile?.name ?? "",
    email: account.email,
    url: account.business_profile?.url ?? "",
  };
}

function listWebhooks(apiKey) {
  const list = stripeJson(apiKey, "GET", "/v1/webhook_endpoints?limit=100");
  return Array.isArray(list.data) ? list.data : [];
}

function ensureWebhook(apiKey) {
  const existing = listWebhooks(apiKey).filter((endpoint) => endpoint.url === WEBHOOK_URL);
  for (const endpoint of existing) {
    try {
      stripeJson(apiKey, "DELETE", `/v1/webhook_endpoints/${endpoint.id}`);
      info(`Deleted previous webhook ${endpoint.id}`);
    } catch (error) {
      console.warn(`WARN could not delete webhook ${endpoint.id}: ${error.message}`);
    }
  }

  const form = [
    `url=${WEBHOOK_URL}`,
    `description=${WEBHOOK_DESCRIPTION}`,
    ...ENABLED_EVENTS.map((event) => `enabled_events[]=${event}`),
  ];
  const created = stripeJson(apiKey, "POST", "/v1/webhook_endpoints", form);
  if (!created.secret?.startsWith("whsec_")) {
    die("Stripe created a webhook but did not return a signing secret.");
  }
  info(`Created webhook ${created.id} -> ${created.url} (livemode=${created.livemode})`);
  return created;
}

function vercelEnvSet(key, value) {
  // Vercel env add is append-only for existing keys; remove then re-add.
  spawnSync("npx", ["--yes", "vercel", "env", "rm", key, "production", "-y"], {
    encoding: "utf8",
    windowsHide: true,
    env: process.env,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const result = spawnSync(
    "npx",
    ["--yes", "vercel", "env", "add", key, "production"],
    {
      encoding: "utf8",
      windowsHide: true,
      env: process.env,
      shell: false,
      input: `${value}\n`,
    },
  );
  if (result.status !== 0) {
    const lastError = (result.stderr || result.stdout || `Failed to set ${key}`).trim();
    throw new Error(lastError.slice(0, 400));
  }
}

function updateEnvLocal(secretKey, webhookSecret) {
  const envPath = path.resolve(".env.local");
  const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8").split(/\r?\n/) : [];
  const upsert = (name, value) => {
    const index = lines.findIndex((line) => line.startsWith(`${name}=`));
    const next = `${name}=${value}`;
    if (index >= 0) lines[index] = next;
    else lines.push(next);
  };
  upsert("STRIPE_SECRET_KEY", secretKey);
  upsert("STRIPE_WEBHOOK_SECRET", webhookSecret);
  if (!lines.some((line) => line.startsWith("NEXT_PUBLIC_SITE_URL="))) {
    upsert("NEXT_PUBLIC_SITE_URL", SITE_URL);
  }
  fs.writeFileSync(envPath, `${lines.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n").trim()}\n`, "utf8");
  info(`Updated local ${envPath} Stripe keys.`);
}

function triggerRedeploy() {
  const result = spawnSync("npx", ["--yes", "vercel", "deploy", "--prod", "--yes"], {
    encoding: "utf8",
    windowsHide: true,
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.warn("WARN Vercel production deploy failed; env vars are set — trigger a production deploy from Vercel UI or CLI.");
    return;
  }
  info("Triggered Vercel production deploy.");
}

function main() {
  info("== Anomaly Box Stripe production setup ==");
  const cli = readStripeCliConfig();
  info(`Stripe CLI account: ${cli.displayName || cli.accountId || "(unknown)"}`);
  info(`Test key: ${maskSecret(cli.testKey)}`);
  info(`Live key: ${maskSecret(cli.liveKey)}`);

  const mode = resolveMode(cli, requestedMode);
  const apiKey = mode === "live" ? cli.liveKey : cli.testKey;
  if (!apiKey?.startsWith(mode === "live" ? "sk_live_" : "sk_test_")) {
    die(`Missing valid ${mode} secret key in Stripe CLI config.`);
  }

  const account = accountStatus(apiKey);
  info(
    `Account ${account.id}: charges_enabled=${account.chargesEnabled} payouts_enabled=${account.payoutsEnabled} details_submitted=${account.detailsSubmitted} currency=${account.defaultCurrency} country=${account.country}`,
  );

  if (mode === "live" && !account.chargesEnabled) {
    die(
      "Live mode is selected but Stripe charges are not enabled yet. Finish activation at https://dashboard.stripe.com/account/onboarding then re-run with --mode live.",
    );
  }

  if (mode === "test" && !cli.liveKey) {
    info("NOTE Live API key is not available yet. Production will stay on Stripe TEST mode until account activation + stripe login.");
    info("Activate: https://dashboard.stripe.com/account/onboarding");
    info("Then: stripe login && node tools/setup-stripe-production.mjs --mode live --redeploy");
  }

  const webhook = ensureWebhook(apiKey);
  const secretKey = apiKey;
  const webhookSecret = webhook.secret;

  if (!skipEnvLocal) {
    updateEnvLocal(secretKey, webhookSecret);
  }

  if (!skipVercel) {
    info("Writing Vercel production env (values not printed)...");
    vercelEnvSet("STRIPE_SECRET_KEY", secretKey);
    vercelEnvSet("STRIPE_WEBHOOK_SECRET", webhookSecret);
    info("Vercel production STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET updated.");
  } else {
    info("Skipped Vercel env update (--skip-vercel).");
  }

  if (redeploy && !skipVercel) {
    // Env changes on Vercel apply to new deploys; force a production rebuild.
    try {
      execFileSync("npx", ["--yes", "vercel", "deploy", "--prod", "--yes"], {
        encoding: "utf8",
        stdio: "inherit",
        windowsHide: true,
        env: process.env,
      });
      info("Vercel production deploy complete.");
    } catch {
      triggerRedeploy();
    }
  }

  // Verify secret key can talk to Stripe and report mode.
  const balance = stripeJson(secretKey, "GET", "/v1/balance");
  info(`Stripe balance reachable (livemode=${balance.livemode === true}).`);
  info(`Webhook secret: ${maskSecret(webhookSecret)}`);
  info(`Configured mode: ${mode}`);
  info("Done.");
  if (mode === "test") {
    info("Production can accept Stripe TEST cards only until live mode is activated.");
  } else {
    info("Production is configured for LIVE charges. Run a small real checkout smoke carefully.");
  }
}

try {
  main();
} catch (error) {
  die(error instanceof Error ? error.message : String(error));
}
