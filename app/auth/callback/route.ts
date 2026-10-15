import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");
  const next = safeNextPath(url.searchParams.get("next"), "/profile");

  if (oauthError) {
    return NextResponse.redirect(
      `${siteUrl()}/login?error=${encodeURIComponent(oauthError)}&next=${encodeURIComponent(next)}`,
    );
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return NextResponse.redirect(
        `${siteUrl()}/login?error=${encodeURIComponent(error?.message || "Oturum açma doğrulaması başarısız oldu.")}&next=${encodeURIComponent(next)}`,
      );
    }

    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        display_name: data.user.user_metadata?.display_name ?? data.user.email,
      },
      { onConflict: "id" },
    );

    return NextResponse.redirect(`${siteUrl()}${next}`);
  }

  return NextResponse.redirect(`${siteUrl()}/login?error=${encodeURIComponent("Doğrulama kodu bulunamadı.")}`);
}