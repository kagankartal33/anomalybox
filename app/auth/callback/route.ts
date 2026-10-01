import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"), "/profile");
  const supabase = await createSupabaseServerClient();

  if (code) {
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: data.user.user_metadata?.display_name ?? data.user.email,
      }, { onConflict: "id" });
    }
  }

  return NextResponse.redirect(`${siteUrl()}${next}`);
}