function readEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

export function siteUrl(): string {
  const custom = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (custom && !custom.includes("localhost") && !custom.includes("127.0.0.1")) {
    return custom.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }
  const netlify = process.env.URL?.trim();
  if (netlify && !netlify.includes("localhost")) {
    return netlify.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return "https://anomalybox.com";
  }
  return custom || "http://localhost:3000";
}

export const env = {
  supabaseUrl: () => readEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:58321"),
  supabaseAnonKey: () => readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  stripeSecretKey: () => readEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: () => readEnv("STRIPE_WEBHOOK_SECRET"),
  resendApiKey: () => process.env.RESEND_API_KEY,
  emailFrom: () => process.env.EMAIL_FROM ?? "Anomaly Box <notifications@anomalybox.com>",
  atelierInbox: () => "support@anomalybox.com",
  siteUrl: () => siteUrl(),
  metaAppId: () => process.env.META_APP_ID,
  metaAppSecret: () => process.env.META_APP_SECRET,
  metaRedirectUri: () => process.env.META_REDIRECT_URI ?? `${siteUrl()}/api/auth/instagram/callback`,
  linkedAccountTokenSecret: () => readEnv("LINKED_ACCOUNT_TOKEN_SECRET"),
};