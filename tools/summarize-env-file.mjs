import fs from "node:fs";

const file = process.argv[2];
const values = new Map();
for (const line of fs.readFileSync(file, "utf8").split(/
?
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const index = trimmed.indexOf("=");
  if (index < 0) continue;
  values.set(trimmed.slice(0, index), trimmed.slice(index + 1).replace(/^['"]|['"]$/g, ""));
}
console.log("keys=" + [...values.keys()].join(","));
for (const key of [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "EMAIL_FROM",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "INTERNAL_API_TOKEN",
  "ADMIN_API_TOKEN",
  "ADMIN_INTERNAL_SECRET",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]) {
  const value = values.get(key) || "";
  const safe = key.endsWith("URL") || key === "EMAIL_FROM" ? value || "missing" : value ? "present" : "missing";
  console.log(`${key}=${safe}`);
}