/**
 * Environment preflight for launch.
 *
 * Local mode (default) reports warnings without failing on localhost/test placeholders.
 * Production mode fails on missing values, placeholder values, localhost URLs, and
 * inconsistent provider configuration.
 *
 * Usage:
 *   node tools/check-production-env.mjs
 *   node tools/check-production-env.mjs --production
 *   node tools/check-production-env.mjs --env-file .env.production --production
 */

import fs from "node:fs";

const args = new Set(process.argv.slice(2));
const production = args.has("--production") || process.env.PRODUCTION_PREFLIGHT === "1";
const envFileArgIndex = process.argv.indexOf("--env-file");
const envFile = envFileArgIndex >= 0 ? process.argv[envFileArgIndex + 1] : ".env.local";

function loadDotEnv(path) {
  if (!path || !fs.existsSync(path)) return false;
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
  return true;
}

function isLocalUrl(value) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)(:\d+)?/i.test(value);
}

function isPlaceholder(value) {
  return /placeholder|replace-with|your-|_placeholder|local-admin-token|local-internal-token/i.test(value);
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const loaded = loadDotEnv(envFile);
const errors = [];
const warnings = [];

function requireValue(name, options = {}) {
  const value = process.env[name] ?? "";
  if (!value) {
    errors.push(`${name} is required.`);
    return "";
  }
  if (isPlaceholder(value)) {
    const message = `${name} still looks like a placeholder.`;
    if (production || options.neverPlaceholder) errors.push(message);
    else warnings.push(message);
  }
  if (options.minLength && value.length < options.minLength) {
    errors.push(`${name} must be at least ${options.minLength} characters.`);
  }
  if (options.url && !validHttpUrl(value)) {
    errors.push(`${name} must be a valid http(s) URL.`);
  }
  if (options.noLocalhost && isLocalUrl(value)) {
    const message = `${name} points to localhost (${value}).`;
    if (production) errors.push(message);
    else warnings.push(message);
  }
  return value;
}

const siteUrl = requireValue("NEXT_PUBLIC_SITE_URL", { url: true, noLocalhost: true });
const supabaseUrl = requireValue("NEXT_PUBLIC_SUPABASE_URL", { url: true, noLocalhost: true });
const anonKey = requireValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRoleKey = requireValue("SUPABASE_SERVICE_ROLE_KEY");
const stripeSecret = requireValue("STRIPE_SECRET_KEY");
const stripeWebhook = requireValue("STRIPE_WEBHOOK_SECRET");
const linkedSecret = requireValue("LINKED_ACCOUNT_TOKEN_SECRET", { minLength: 32 });
const internalToken = process.env.INTERNAL_API_TOKEN ?? "";
const adminToken = process.env.ADMIN_API_TOKEN ?? process.env.ADMIN_INTERNAL_SECRET ?? "";

if (anonKey && serviceRoleKey && anonKey === serviceRoleKey) {
  errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY must not equal SUPABASE_SERVICE_ROLE_KEY.");
}

if (serviceRoleKey && !/^eyJ|^sb_secret_/i.test(serviceRoleKey)) {
  warnings.push("SUPABASE_SERVICE_ROLE_KEY does not look like a Supabase JWT/service key.");
}

if (stripeSecret) {
  if (!/^sk_(test|live)_/.test(stripeSecret)) {
    errors.push("STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.");
  }
  if (production && !stripeSecret.startsWith("sk_live_")) {
    warnings.push("Production preflight is using a Stripe test key. This is fine only for test-mode launch smoke.");
  }
}

if (stripeWebhook && !/^whsec_/.test(stripeWebhook)) {
  errors.push("STRIPE_WEBHOOK_SECRET must start with whsec_.");
}

if (production && siteUrl && !siteUrl.startsWith("https://")) {
  errors.push("NEXT_PUBLIC_SITE_URL must use https:// in production.");
}

if (production && supabaseUrl && !supabaseUrl.startsWith("https://")) {
  errors.push("NEXT_PUBLIC_SUPABASE_URL must use https:// in production.");
}

if (process.env.META_APP_ID || process.env.META_APP_SECRET) {
  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    errors.push("META_APP_ID and META_APP_SECRET must be configured together.");
  }
  const redirect = process.env.META_REDIRECT_URI ?? "";
  if (redirect && siteUrl && !redirect.startsWith(siteUrl)) {
    warnings.push("META_REDIRECT_URI does not start with NEXT_PUBLIC_SITE_URL.");
  }
}

if (process.env.RESEND_API_KEY && !/^re_/.test(process.env.RESEND_API_KEY)) {
  warnings.push("RESEND_API_KEY does not look like a Resend key.");
}

if (process.env.EMAIL_FROM && !/.+<[^@\s]+@[^@\s]+\.[^@\s]+>/.test(process.env.EMAIL_FROM) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(process.env.EMAIL_FROM)) {
  warnings.push("EMAIL_FROM should be an email address or 'Name <email@example.com>'.");
}

if (production) {
  if (!process.env.RESEND_API_KEY) {
    errors.push("RESEND_API_KEY is required in production for Atelier lead delivery.");
  }
  if (!process.env.EMAIL_FROM) {
    errors.push("EMAIL_FROM is required in production for Atelier lead delivery.");
  }
  if (!internalToken || isPlaceholder(internalToken) || internalToken.length < 24) {
    errors.push("INTERNAL_API_TOKEN must be a non-placeholder secret of at least 24 characters in production.");
  }
  if (!adminToken || isPlaceholder(adminToken) || adminToken.length < 24) {
    errors.push("ADMIN_API_TOKEN or ADMIN_INTERNAL_SECRET must be a non-placeholder secret of at least 24 characters in production.");
  }
}

console.log(`== Anomaly Box env preflight (${production ? "production" : "local"}) ==`);
console.log(`Env file: ${loaded ? envFile : "not loaded"}`);
console.log(`Site URL: ${siteUrl || "(missing)"}`);
console.log(`Supabase URL: ${supabaseUrl || "(missing)"}`);
console.log(`Stripe mode: ${stripeSecret?.startsWith("sk_live_") ? "live" : stripeSecret?.startsWith("sk_test_") ? "test" : "unknown"}`);
console.log(`Meta OAuth: ${process.env.META_APP_ID && process.env.META_APP_SECRET ? "configured" : "not configured"}`);
console.log(`Email: ${process.env.RESEND_API_KEY ? "configured" : "not configured"}`);

for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`FAIL ${error}`);

if (errors.length) {
  console.error(`\nEnv preflight failed with ${errors.length} issue(s).`);
  process.exit(1);
}

console.log("\nEnv preflight passed.");
