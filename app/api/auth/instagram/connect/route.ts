import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env, siteUrl } from "@/lib/env";

export async function GET() {
  const appId = env.metaAppId();
  if (!appId) return NextResponse.redirect(`${siteUrl()}/onboarding?error=${encodeURIComponent("Instagram connection is not configured")}`);

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("vb_meta_state", state, { httpOnly: true, sameSite: "lax", secure: siteUrl().startsWith("https"), path: "/", maxAge: 600 });

  const url = new URL("https://www.facebook.com/v20.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", env.metaRedirectUri());
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "instagram_basic,pages_show_list");
  url.searchParams.set("response_type", "code");

  return NextResponse.redirect(url);
}
