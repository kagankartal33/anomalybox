import { env } from "@/lib/env";

type PublicAuthSettings = {
  external?: Record<string, boolean>;
};

export type SupportedOAuthProvider = "google" | "apple";

export async function isOAuthProviderEnabled(provider: SupportedOAuthProvider): Promise<boolean> {
  try {
    const response = await fetch(`${env.supabaseUrl()}/auth/v1/settings`, {
      headers: {
        apikey: env.supabaseAnonKey(),
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) return false;
    const settings = (await response.json()) as PublicAuthSettings;
    return settings.external?.[provider] === true;
  } catch {
    return false;
  }
}