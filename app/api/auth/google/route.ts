import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/navigation";
import { isOAuthProviderEnabled } from "@/lib/supabase/auth-settings";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"), "/profile");
  const loginUrl = new URL("/login", siteUrl());
  loginUrl.searchParams.set("next", next);

  if (!(await isOAuthProviderEnabled("google"))) {
    loginUrl.searchParams.set("error", "Google sign-in is not enabled yet. Please use email sign-in.");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: "openid email profile",
    },
  });

  if (error || !data.url) {
    loginUrl.searchParams.set("error", "Google sign-in could not be started. Please try again.");
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.redirect(data.url);
}
