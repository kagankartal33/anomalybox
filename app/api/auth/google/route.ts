import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=/profile`,
    },
  });

  if (error || !data.url) return NextResponse.redirect(`${siteUrl()}/login?error=${encodeURIComponent(error?.message ?? "Google login failed")}`);
  return NextResponse.redirect(data.url);
}