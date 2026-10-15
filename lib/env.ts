function readEnv(name: string, fallback?: string) {
  const raw = process.env[name]?.trim();
  const value = raw && !raw.includes("[SENSITIVE]") ? raw : fallback;
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function optionalEnv(name: string, fallback: string): string;
function optionalEnv(name: string, fallback?: string): string | undefined;
function optionalEnv(name: string, fallback?: string) {
  const raw = process.env[name]?.trim();
  return raw && !raw.includes("[SENSITIVE]") ? raw : fallback;
}

export function siteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url && (url.startsWith("http://") || url.startsWith("https://")) && !url.includes("[SENSITIVE]")) {
    return url;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://anomalybox.com";
}

export const env = {
  supabaseUrl: () => readEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:58321"),
  supabaseAnonKey: () =>
    readEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
    ),
  supabaseServiceRoleKey: () =>
    readEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
    ),
  stripeSecretKey: () => readEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: () => readEnv("STRIPE_WEBHOOK_SECRET"),
  resendApiKey: () => optionalEnv("RESEND_API_KEY"),
  emailFrom: () => optionalEnv("EMAIL_FROM", "Anomaly Box <notifications@anomalybox.com>"),
  atelierInbox: () => "support@anomalybox.com",
  metaAppId: () => optionalEnv("META_APP_ID"),
  metaAppSecret: () => optionalEnv("META_APP_SECRET"),
  metaRedirectUri: () => optionalEnv("META_REDIRECT_URI", `${siteUrl()}/api/auth/instagram/callback`),
  linkedAccountTokenSecret: () => readEnv("LINKED_ACCOUNT_TOKEN_SECRET"),
};

