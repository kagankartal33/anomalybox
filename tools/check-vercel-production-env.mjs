import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tempEnvPath = path.join(os.tmpdir(), `anomalybox-vercel-env-${Date.now()}.local`);

function pullProductionEnv() {
  const vercelArgs = ["--yes", "vercel", "env", "pull", tempEnvPath, "--environment=production", "--yes"];
  const result = spawnSync(
    process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npx",
    process.platform === "win32" ? ["/d", "/s", "/c", `npx.cmd ${vercelArgs.join(" ")}`] : vercelArgs,
    {
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "vercel env pull failed").trim().slice(0, 500));
  }
  if (!fs.existsSync(tempEnvPath)) {
    throw new Error("vercel env pull did not create an env file");
  }
}

function loadEnvFile(filePath) {
  const out = new Map();
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out.set(key, value);
  }
  return out;
}

function valueFor(envMap, key) {
  return envMap.get(key) ?? "";
}

function redacted(value) {
  return value === "[SENSITIVE]";
}

let envMap;
try {
  pullProductionEnv();
  envMap = loadEnvFile(tempEnvPath);
} finally {
  try {
    fs.unlinkSync(tempEnvPath);
  } catch {
    // ignore cleanup failures
  }
}

const stripeSecret = valueFor(envMap, "STRIPE_SECRET_KEY");
const siteUrl = valueFor(envMap, "NEXT_PUBLIC_SITE_URL");
const supabaseUrl = valueFor(envMap, "NEXT_PUBLIC_SUPABASE_URL");

const report = {
  siteUrl: redacted(siteUrl)
    ? "redacted_unverified"
    : siteUrl === "https://anomalybox.com"
      ? "correct"
      : siteUrl
        ? "unexpected"
        : "missing",
  supabaseUrl: redacted(supabaseUrl)
    ? "redacted_unverified"
    : supabaseUrl.includes("psqqqhcfmfojrqsvzzzb.supabase.co")
    ? "correct"
    : supabaseUrl
      ? "unexpected"
      : "missing",
  supabaseAnon: valueFor(envMap, "NEXT_PUBLIC_SUPABASE_ANON_KEY") ? "present" : "missing",
  supabaseServiceRole: valueFor(envMap, "SUPABASE_SERVICE_ROLE_KEY") ? "present" : "missing",
  stripeMode: redacted(stripeSecret)
    ? "redacted_unverified"
    : stripeSecret.startsWith("sk_live_")
    ? "live"
    : stripeSecret.startsWith("sk_test_")
      ? "test"
      : "missing_or_unknown",
  stripeWebhook: redacted(valueFor(envMap, "STRIPE_WEBHOOK_SECRET"))
    ? "present_redacted"
    : valueFor(envMap, "STRIPE_WEBHOOK_SECRET").startsWith("whsec_")
      ? "present"
      : "missing",
  resend: valueFor(envMap, "RESEND_API_KEY").startsWith("re_") ? "present" : "missing",
  emailFrom: valueFor(envMap, "EMAIL_FROM") ? "present" : "missing",
  internalToken: valueFor(envMap, "INTERNAL_API_TOKEN") ? "present" : "missing",
  adminToken:
    valueFor(envMap, "ADMIN_API_TOKEN") || valueFor(envMap, "ADMIN_INTERNAL_SECRET")
      ? "present"
      : "missing",
  linkedAccountToken: valueFor(envMap, "LINKED_ACCOUNT_TOKEN_SECRET") ? "present" : "missing",
};

try {
  const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: { apikey: valueFor(envMap, "NEXT_PUBLIC_SUPABASE_ANON_KEY") },
  });
  if (response.ok) {
    const settings = await response.json();
    report.googleOAuth = settings.external?.google === true ? "enabled" : "disabled";
    report.appleOAuth = settings.external?.apple === true ? "enabled" : "disabled";
    report.emailAuth =
      settings.external?.email === true || settings.disable_signup === false ? "enabled" : "unknown";
  }
} catch {
  report.authSettings = "unreachable";
}

try {
  const anonKey = valueFor(envMap, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
  const [productsResponse, categoriesResponse, personasResponse] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/box_products?select=slug,name,idea_count&enabled=eq.true&order=price_usd_cents.asc`,
      { headers },
    ),
    fetch(
      `${supabaseUrl}/rest/v1/categories?select=slug,name&enabled=eq.true&order=sort_order.asc&limit=20`,
      { headers },
    ),
    fetch(
      `${supabaseUrl}/rest/v1/creator_personas?select=slug,name&enabled=eq.true&order=sort_order.asc&limit=20`,
      { headers },
    ),
  ]);
  if (productsResponse.ok && categoriesResponse.ok && personasResponse.ok) {
    report.catalog = {
      products: await productsResponse.json(),
      categories: await categoriesResponse.json(),
      personas: await personasResponse.json(),
    };
  }
} catch {
  report.catalog = "unreachable";
}

console.log(JSON.stringify(report, null, 2));
