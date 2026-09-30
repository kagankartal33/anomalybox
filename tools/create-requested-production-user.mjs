import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const email = "khankartal@gmail.com";
const raw = execFileSync(
  process.env.ComSpec ?? "cmd.exe",
  ["/d", "/s", "/c", "npx netlify env:list --context production --json"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);
const parsed = JSON.parse(raw);

function valueFor(key) {
  const row = Array.isArray(parsed) ? parsed.find((item) => item?.key === key) : parsed?.[key];
  const extract = (value) => {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    if (typeof value.value === "string") return value.value;
    if (typeof value.production === "string") return value.production;
    if (value.production && typeof value.production.value === "string") return value.production.value;
    if (Array.isArray(value.values)) {
      return extract(value.values.find((entry) => entry?.context === "production"));
    }
    if (value.values && typeof value.values === "object") return extract(value.values);
    return "";
  };
  return extract(row);
}

const supabaseUrl = valueFor("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = valueFor("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRoleKey = valueFor("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error("Required production Supabase configuration is unavailable.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const temporaryPassword = `${randomBytes(30).toString("base64url")}Aa1!`;
const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password: temporaryPassword,
  email_confirm: true,
  user_metadata: { display_name: "Khan Kartal" },
});

if (createError && createError.code !== "email_exists") {
  throw new Error(`Account creation failed: ${createError.code ?? createError.status ?? "unknown"}`);
}

if (created.user) {
  const { error: profileError } = await admin.from("profiles").upsert(
    { id: created.user.id, display_name: "Khan Kartal" },
    { onConflict: "id" },
  );
  if (profileError) {
    throw new Error(`Profile creation failed: ${profileError.code ?? "unknown"}`);
  }
}

const publicClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { error: recoveryError } = await publicClient.auth.resetPasswordForEmail(email, {
  redirectTo: "https://anomalybox.com/auth/callback?next=%2Freset-password",
});

console.log(JSON.stringify({
  account: createError?.code === "email_exists" ? "already_exists" : "created",
  recoveryRequest: recoveryError ? "rejected" : "accepted",
  recoveryCode: recoveryError?.code ?? null,
  recoveryStatus: recoveryError?.status ?? null,
}, null, 2));

if (recoveryError) process.exit(1);