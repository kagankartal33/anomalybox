/**
 * Poll Stripe until the standard account can charge, then promote production to live.
 *
 * Safe to re-run. Exits 0 when live is configured, 2 while still waiting (if --once),
 * 1 on hard failure.
 *
 * Usage:
 *   node tools/promote-stripe-live-when-ready.mjs
 *   node tools/promote-stripe-live-when-ready.mjs --once
 *   node tools/promote-stripe-live-when-ready.mjs --interval-sec 60 --max-hours 6
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const args = new Set(process.argv.slice(2));
const once = args.has("--once");
function argNumber(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) ? value : fallback;
}
const intervalSec = argNumber("--interval-sec", 90);
const maxHours = argNumber("--max-hours", 8);
const maxMs = Math.max(1, maxHours) * 60 * 60 * 1000;
const started = Date.now();

function info(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function readCliKeys() {
  const configPath = path.join(os.homedir(), ".config", "stripe", "config.toml");
  if (!fs.existsSync(configPath)) {
    throw new Error(`Stripe CLI config missing: ${configPath}. Run stripe login.`);
  }
  const raw = fs.readFileSync(configPath, "utf8");
  const pick = (key) => raw.match(new RegExp(`${key}\\s*=\\s*'([^']+)'`))?.[1] ?? "";
  return {
    testKey: pick("test_mode_api_key"),
    liveKey: pick("live_mode_api_key"),
    accountId: pick("account_id"),
    displayName: pick("display_name"),
  };
}

function stripeGet(apiKey, resourcePath) {
  const result = spawnSync("stripe", ["get", resourcePath, "--api-key", apiKey], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "stripe get failed").trim());
  }
  const stdout = (result.stdout || "").trim();
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  return JSON.parse(stdout.slice(start, end + 1));
}

function healthMode() {
  try {
    const result = spawnSync(
      "node",
      [
        "-e",
        "fetch('https://anomalybox.com/api/health').then(r=>r.json()).then(j=>{console.log(JSON.stringify(j));}).catch(e=>{console.error(e); process.exit(1);})",
      ],
      { encoding: "utf8", windowsHide: true },
    );
    if (result.status !== 0) return { ok: false };
    return JSON.parse((result.stdout || "").trim());
  } catch {
    return { ok: false };
  }
}

function promoteLive() {
  info("Promoting production to Stripe LIVE...");
  const result = spawnSync(
    "node",
    ["tools/setup-stripe-production.mjs", "--mode", "live", "--redeploy"],
    {
      encoding: "utf8",
      windowsHide: true,
      stdio: "inherit",
    },
  );
  if (result.status !== 0) {
    throw new Error("setup-stripe-production.mjs --mode live failed");
  }
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  info("== Stripe live auto-promote ==");
  info(`Poll every ${intervalSec}s for up to ${maxHours}h. once=${once}`);

  while (true) {
    const keys = readCliKeys();
    info(`CLI account=${keys.displayName || keys.accountId || "unknown"} liveKey=${keys.liveKey ? "present" : "missing"}`);

    // Prefer live key if CLI already has it; otherwise probe account via test key.
    if (keys.liveKey?.startsWith("sk_live_")) {
      try {
        const account = stripeGet(keys.liveKey, "/v1/account");
        info(
          `Live account probe: charges_enabled=${account.charges_enabled} details_submitted=${account.details_submitted} payouts_enabled=${account.payouts_enabled}`,
        );
        if (account.charges_enabled) {
          const health = healthMode();
          if (health?.checks?.paymentMode === "live") {
            info("Production already on live payments. Done.");
            process.exit(0);
          }
          promoteLive();
          const after = healthMode();
          info(`Post-promote health: ${JSON.stringify(after)}`);
          if (after?.checks?.paymentMode === "live") {
            info("SUCCESS production is live.");
            process.exit(0);
          }
          throw new Error("Promote finished but health still not live.");
        }
      } catch (error) {
        info(`Live key present but not usable yet: ${error instanceof Error ? error.message : error}`);
      }
    } else if (keys.testKey?.startsWith("sk_test_")) {
      const account = stripeGet(keys.testKey, "/v1/account");
      info(
        `Account ${account.id}: charges_enabled=${account.charges_enabled} details_submitted=${account.details_submitted} payouts_enabled=${account.payouts_enabled}`,
      );
      if (account.charges_enabled || account.details_submitted) {
        info("Account advanced, but live CLI key missing. Attempting stripe login reminder + re-check.");
        info("ACTION REQUIRED ONCE: run `stripe login` after finishing https://dashboard.stripe.com/account/onboarding");
      } else {
        info("Stripe account still incomplete. Waiting for dashboard onboarding.");
        info("Open: https://dashboard.stripe.com/account/onboarding");
      }
    } else {
      throw new Error("No Stripe CLI keys available. Run stripe login.");
    }

    if (once) {
      info("Still waiting (--once). Exit 2.");
      process.exit(2);
    }
    if (Date.now() - started > maxMs) {
      info(`Timed out after ${maxHours}h while waiting for live activation.`);
      process.exit(2);
    }
    await sleep(Math.max(15, intervalSec) * 1000);
  }
}

main().catch((error) => {
  console.error(`FAIL ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
