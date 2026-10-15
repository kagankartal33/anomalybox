import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"), "/profile");
  const loginUrl = new URL("/login", siteUrl());
  loginUrl.searchParams.set("next", next);
  const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (providerError) {
    loginUrl.searchParams.set("error", "Sign-in was cancelled or could not be completed. Please try again.");
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    loginUrl.searchParams.set("error", "The sign-in response was incomplete. Please try again.");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.warn("OAuth or recovery callback could not exchange its authorization code.", {
      code: error?.code,
      status: error?.status,
    });
    loginUrl.searchParams.set("error", "Your secure session could not be verified. Please try again.");
    return NextResponse.redirect(loginUrl);
  }

  await supabase.from("profiles").upsert({
    id: data.user.id,
    display_name:
      data.user.user_metadata?.display_name ??
      data.user.user_metadata?.full_name ??
      data.user.user_metadata?.name ??
      data.user.email,
  }, { onConflict: "id" });

  return NextResponse.redirect(`${siteUrl()}${next}`);
}
