import { execFileSync } from "node:child_process";

const command = process.platform === "win32"
  ? [process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "npx netlify env:list --context production --json"]]
  : ["npx", ["netlify", "env:list", "--context", "production", "--json"]];
const raw = execFileSync(command[0], command[1], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
const parsed = JSON.parse(raw);
const valueCache = new Map();

function valueFor(key) {
  if (valueCache.has(key)) return valueCache.get(key);
  const extract = (value) => {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    if (typeof value.value === "string") return value.value;
    if (typeof value.production === "string") return value.production;
    if (value.production && typeof value.production.value === "string") return value.production.value;
    if (Array.isArray(value.values)) {
      const production = value.values.find((entry) => entry?.context === "production");
      return extract(production);
    }
    if (value.values && typeof value.values === "object") return extract(value.values);
    return "";
  };

  let resolved = "";
  if (Array.isArray(parsed)) {
    const row = parsed.find((item) => item?.key === key);
    resolved = extract(row);
  } else {
    resolved = extract(parsed?.[key]);
  }
  if (resolved) {
    valueCache.set(key, resolved);
    return resolved;
  }

  try {
    const getCommand = process.platform === "win32"
      ? [process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `npx netlify env:get ${key} --context production`]]
      : ["npx", ["netlify", "env:get", key, "--context", "production"]];
    const value = execFileSync(getCommand[0], getCommand[1], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    valueCache.set(key, value);
    return value;
  } catch {
    valueCache.set(key, "");
    return "";
  }
}

const stripeSecret = valueFor("STRIPE_SECRET_KEY");
const siteUrl = valueFor("NEXT_PUBLIC_SITE_URL");
const supabaseUrl = valueFor("NEXT_PUBLIC_SUPABASE_URL");

const report = {
  siteUrl: siteUrl === "https://anomalybox.com" ? "correct" : siteUrl ? "unexpected" : "missing",
  supabaseUrl: supabaseUrl.includes("psqqqhcfmfojrqsvzzzb.supabase.co") ? "correct" : supabaseUrl ? "unexpected" : "missing",
  supabaseAnon: valueFor("NEXT_PUBLIC_SUPABASE_ANON_KEY") ? "present" : "missing",
  supabaseServiceRole: valueFor("SUPABASE_SERVICE_ROLE_KEY") ? "present" : "missing",
  stripeMode: stripeSecret.startsWith("sk_live_") ? "live" : stripeSecret.startsWith("sk_test_") ? "test" : "missing_or_unknown",
  stripeWebhook: valueFor("STRIPE_WEBHOOK_SECRET").startsWith("whsec_") ? "present" : "missing",
  resend: valueFor("RESEND_API_KEY").startsWith("re_") ? "present" : "missing",
  emailFrom: valueFor("EMAIL_FROM") ? "present" : "missing",
  internalToken: valueFor("INTERNAL_API_TOKEN") ? "present" : "missing",
  adminToken: valueFor("ADMIN_API_TOKEN") || valueFor("ADMIN_INTERNAL_SECRET") ? "present" : "missing",
};

try {
  const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: { apikey: valueFor("NEXT_PUBLIC_SUPABASE_ANON_KEY") },
  });
  if (response.ok) {
    const settings = await response.json();
    report.googleOAuth = settings.external?.google === true ? "enabled" : "disabled";
    report.appleOAuth = settings.external?.apple === true ? "enabled" : "disabled";
    report.emailAuth = settings.external?.email === true || settings.disable_signup === false ? "enabled" : "unknown";
  }
} catch {
  report.authSettings = "unreachable";
}

try {
  const anonKey = valueFor("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
  const [productsResponse, categoriesResponse, personasResponse] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/box_products?select=slug,name,idea_count&enabled=eq.true&order=price_usd_cents.asc`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/categories?select=slug,name&enabled=eq.true&order=sort_order.asc&limit=20`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/creator_personas?select=slug,name&enabled=eq.true&order=sort_order.asc&limit=20`, { headers }),
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