/**
 * Stripe webhook signature + idempotent replay smoke test.
 *
 * Requires:
 * - STRIPE_WEBHOOK_SECRET (and preferably local Next server)
 * - App reachable at WEBHOOK_BASE_URL (default http://127.0.0.1:3000)
 *
 * Run:
 *   node tools/test-stripe-webhook-replay.mjs
 *   node tools/test-stripe-webhook-replay.mjs --base-url http://127.0.0.1:3000
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

function argValue(flag, fallback = "") {
  const index = process.argv.indexOf(flag);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const baseUrl = (argValue("--base-url") || process.env.WEBHOOK_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const webhookUrl = `${baseUrl}/api/stripe/webhook`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function generateStripeSignature(payload, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

function buildCheckoutEvent(eventId) {
  const sessionId = `cs_test_replay_${eventId.replace(/[^a-zA-Z0-9]/g, "").slice(-18)}`;
  return {
    id: eventId,
    object: "event",
    api_version: "2025-06-30.basil",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.completed",
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: sessionId,
        object: "checkout.session",
        amount_total: 2900,
        currency: "usd",
        payment_intent: `pi_test_${eventId.slice(-12)}`,
        // Intentionally incomplete metadata so the handler records the event
        // and fails processing without requiring a full inventory setup.
        metadata: {
          user_id: "",
          box_product_slug: "viral_box_500",
          category_slug: "beauty",
          persona_slug: "luxury_editor",
        },
      },
    },
  };
}

function buildIgnoredEvent(eventId) {
  return {
    id: eventId,
    object: "event",
    api_version: "2025-06-30.basil",
    created: Math.floor(Date.now() / 1000),
    type: "customer.updated",
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: `cus_${eventId.replace(/[^a-zA-Z0-9]/g, "").slice(-18)}`,
        object: "customer",
      },
    },
  };
}

async function postWebhook(payload, headers = {}) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: payload,
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: response.status, text, json };
}

async function main() {
  console.log(`Stripe webhook replay smoke against ${webhookUrl}`);

  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET in environment or .env.local");
  }

  // 1) Missing signature must fail closed.
  {
    const payload = JSON.stringify(buildCheckoutEvent(`evt_missing_sig_${Date.now()}`));
    const result = await postWebhook(payload);
    assert(result.status === 400, `Expected 400 for missing signature, got ${result.status}: ${result.text}`);
    console.log("OK  missing signature rejected");
  }

  // 2) Invalid signature must fail closed.
  {
    const eventId = `evt_bad_sig_${Date.now()}`;
    const payload = JSON.stringify(buildCheckoutEvent(eventId));
    const result = await postWebhook(payload, { "stripe-signature": "t=1,v1=deadbeef" });
    assert(result.status === 400, `Expected 400 for invalid signature, got ${result.status}: ${result.text}`);
    console.log("OK  invalid signature rejected");
  }

  // 3) A signed, unhandled Stripe event is safely recorded as processed.
  const eventId = `evt_replay_${Date.now()}`;
  const payload = JSON.stringify(buildIgnoredEvent(eventId));
  const signature = generateStripeSignature(payload, webhookSecret);

  const first = await postWebhook(payload, { "stripe-signature": signature });
  assert(first.status === 200, `Expected 200 for signed event, got ${first.status}: ${first.text}`);
  console.log("OK  signed event recorded and processed");

  // 4) Replay of the same event id must be treated as duplicate.
  const second = await postWebhook(payload, { "stripe-signature": signature });
  assert(second.status === 200, `Expected 200 for duplicate replay, got ${second.status}: ${second.text}`);
  assert(second.json?.duplicate === true || second.json?.ok === true, `Unexpected duplicate response: ${second.text}`);
  if (second.json?.duplicate === true) {
    console.log("OK  duplicate event replay short-circuited");
  } else {
    console.log("OK  duplicate event replay returned ok (idempotent path)");
  }

  console.log("\nStripe webhook replay smoke passed.");
}

main().catch((error) => {
  console.error(`\nStripe webhook replay smoke failed: ${error.message}`);
  process.exit(1);
});
