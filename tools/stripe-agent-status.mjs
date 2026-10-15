/**
 * One-shot status for Stripe agent tooling + production payment surface.
 *
 *   node tools/stripe-agent-status.mjs
 *   npm run stripe:agent:status
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function run(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: "utf8", windowsHide: true, shell: process.platform === "win32" });
  return {
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

function readPreferredStripeKey() {
  const configPath = path.join(os.homedir(), ".config", "stripe", "config.toml");
  if (!fs.existsSync(configPath)) return { testKey: "", liveKey: "", accountId: "", displayName: "" };
  const raw = fs.readFileSync(configPath, "utf8");
  const blocks = raw.split(/\n(?=\[)/);
  let best = { testKey: "", liveKey: "", accountId: "", displayName: "" };
  for (const block of blocks) {
    const pick = (key) => block.match(new RegExp(`${key}\\s*=\\s*'([^']+)'`))?.[1] ?? "";
    const candidate = {
      testKey: pick("test_mode_api_key"),
      liveKey: pick("live_mode_api_key"),
      accountId: pick("account_id"),
      displayName: pick("display_name"),
    };
    if (!candidate.accountId) continue;
    if (candidate.liveKey) best = candidate;
    else if (!best.accountId) best = candidate;
  }
  return best;
}

function stripeJson(apiKey, resourcePath) {
  const result = spawnSync("stripe", ["get", resourcePath, "--api-key", apiKey], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || "stripe get failed").trim().slice(0, 300));
  const stdout = (result.stdout || "").trim();
  return JSON.parse(stdout.slice(stdout.indexOf("{"), stdout.lastIndexOf("}") + 1));
}

function mask(value) {
  if (!value) return null;
  return `${value.slice(0, 10)}…${value.slice(-4)}`;
}

const report = {
  timestamp: new Date().toISOString(),
  agent: null,
  account: null,
  products: [],
  prices: [],
  webhooks: [],
  health: null,
  skillsDirs: {
    agents: fs.existsSync(path.resolve(".agents/skills")),
    grok: fs.existsSync(path.resolve(".grok/skills")),
  },
};

const agentStatus = run("stripe", ["agent", "setup", "--status", "--json"]);
if (agentStatus.status === 0) {
  try {
    report.agent = JSON.parse(agentStatus.stdout);
  } catch {
    report.agent = { raw: agentStatus.stdout.slice(0, 400) };
  }
} else {
  report.agent = { error: agentStatus.stderr || agentStatus.stdout };
}

const cli = readPreferredStripeKey();
if (cli.testKey) {
  try {
    const account = stripeJson(cli.testKey, "/v1/account");
    report.account = {
      id: account.id,
      displayName: account.settings?.dashboard?.display_name ?? cli.displayName,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
      defaultCurrency: account.default_currency,
      testKey: mask(cli.testKey),
      liveKey: mask(cli.liveKey),
      liveKeyKind: cli.liveKey?.startsWith("rk_live_")
        ? "restricted"
        : cli.liveKey?.startsWith("sk_live_")
          ? "secret"
          : cli.liveKey
            ? "unknown"
            : "missing",
    };
    const products = stripeJson(cli.testKey, "/v1/products?limit=20&active=true");
    report.products = (products.data || []).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.metadata?.box_product_slug,
      defaultPrice: p.default_price,
    }));
    const prices = stripeJson(cli.testKey, "/v1/prices?limit=20&active=true");
    report.prices = (prices.data || []).map((p) => ({
      id: p.id,
      amount: p.unit_amount,
      currency: p.currency,
      product: p.product,
      nickname: p.nickname || p.metadata?.box_product_slug,
    }));
    const webhooks = stripeJson(cli.testKey, "/v1/webhook_endpoints?limit=20");
    report.webhooks = (webhooks.data || []).map((w) => ({ id: w.id, status: w.status, url: w.url }));
  } catch (error) {
    report.account = { error: error instanceof Error ? error.message : String(error) };
  }
}

try {
  const health = await fetch("https://anomalybox.com/api/health");
  report.health = await health.json();
} catch (error) {
  report.health = { error: error instanceof Error ? error.message : String(error) };
}

console.log(JSON.stringify(report, null, 2));
