function readEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export const env = {
  supabaseUrl: () => readEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55321"),
  supabaseAnonKey: () => readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  stripeSecretKey: () => readEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: () => readEnv("STRIPE_WEBHOOK_SECRET"),
  resendApiKey: () => process.env.RESEND_API_KEY,
  emailFrom: () => process.env.EMAIL_FROM ?? "ViralBox <notifications@viralbox.local>",
  metaAppId: () => process.env.META_APP_ID,
  metaAppSecret: () => process.env.META_APP_SECRET,
  metaRedirectUri: () => process.env.META_REDIRECT_URI ?? `${siteUrl()}/api/auth/instagram/callback`,
};