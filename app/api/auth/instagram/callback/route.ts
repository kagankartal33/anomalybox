import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env, siteUrl } from "@/lib/env";
import { encryptLinkedAccountToken } from "@/lib/token-crypto";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("vb_meta_state")?.value;

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(`${siteUrl()}/onboarding?error=${encodeURIComponent("Instagram bağlantısı doğrulanamadı")}`);
  }

  const appId = env.metaAppId();
  const appSecret = env.metaAppSecret();
  if (!appId || !appSecret) {
    return NextResponse.redirect(`${siteUrl()}/onboarding?error=${encodeURIComponent("Meta app secret env eksik")}`);
  }

  const { user } = await requireUser();
  const tokenUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("redirect_uri", env.metaRedirectUri());
  tokenUrl.searchParams.set("code", code);

  const tokenResponse = await fetch(tokenUrl);
  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    return NextResponse.redirect(`${siteUrl()}/onboarding?error=${encodeURIComponent("Meta token alınamadı")}`);
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("linked_social_accounts").upsert({
    user_id: user.id,
    provider: "instagram",
    provider_account_id: tokenPayload.user_id ? String(tokenPayload.user_id) : null,
    access_token_encrypted: encryptLinkedAccountToken(String(tokenPayload.access_token)),
    scopes: ["instagram_basic", "pages_show_list"],
    metadata: { connected_via: "meta_oauth", token_type: tokenPayload.token_type ?? null },
  }, { onConflict: "user_id,provider" });

  return NextResponse.redirect(`${siteUrl()}/onboarding?instagram=connected`);
}