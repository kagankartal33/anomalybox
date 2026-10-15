import { env } from "@/lib/env";

type PublicAuthSettings = {
  external?: Record<string, boolean>;
};

export type SupportedOAuthProvider = "google" | "apple";

export async function isOAuthProviderEnabled(provider: SupportedOAuthProvider): Promise<boolean> {
  if (provider === "google" && process.env.ENABLE_GOOGLE_AUTH === "false") return false;
  if (provider === "apple" && process.env.ENABLE_APPLE_AUTH === "false") return false;
  if (provider === "google" && (process.env.ENABLE_GOOGLE_AUTH === "true" || process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true")) return true;
  if (provider === "apple" && (process.env.ENABLE_APPLE_AUTH === "true" || process.env.NEXT_PUBLIC_ENABLE_APPLE_AUTH === "true")) return true;

  try {
    const response = await fetch(`${env.supabaseUrl()}/auth/v1/settings`, {
      headers: {
        apikey: env.supabaseAnonKey(),
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) return true; // Default enabled so OAuth buttons are visible
    const settings = (await response.json()) as PublicAuthSettings;
    if (settings.external && typeof settings.external[provider] === "boolean") {
      return settings.external[provider];
    }
    return true;
  } catch {
    return true;
  }
}
