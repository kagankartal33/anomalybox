import { execFileSync } from "node:child_process";

const raw = execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["netlify", "env:list", "--context", "production", "--json"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);
const parsed = JSON.parse(raw);

function valueFor(key) {
  if (Array.isArray(parsed)) {
    const row = parsed.find((item) => item?.key === key);
    if (!row) return "";
    if (typeof row.value === "string") return row.value;
    if (Array.isArray(row.values)) {
      const production = row.values.find((entry) => entry?.context === "production");
      return typeof production?.value === "string" ? production.value : "";
    }
    return "";
  }
  return typeof parsed?.[key] === "string" ? parsed[key] : "";
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

console.log(JSON.stringify(report, null, 2));