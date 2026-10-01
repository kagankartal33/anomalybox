import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"), "/profile");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) return NextResponse.redirect(`${siteUrl()}/login?error=${encodeURIComponent(error?.message ?? "Google login failed")}&next=${encodeURIComponent(next)}`);
  return NextResponse.redirect(data.url);
}