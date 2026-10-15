import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/navigation";
import { isOAuthProviderEnabled } from "@/lib/supabase/auth-settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = safeNextPath(requestUrl.searchParams.get("next"), "/profile");

  if (!(await isOAuthProviderEnabled("apple"))) {
    const loginUrl = new URL("/login", siteUrl());
    loginUrl.searchParams.set("error", "Apple sign-in is not available yet. Please use email sign-in.");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: "name email",
    },
  });

  if (error || !data.url) {
    const loginUrl = new URL("/login", siteUrl());
    loginUrl.searchParams.set("error", "Apple sign-in could not be started. Please try again.");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(data.url);
}
