"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function ensureProfile(userId: string, displayName?: string | null) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("profiles").upsert({
    id: userId,
    display_name: displayName ?? null,
  }, { onConflict: "id" });
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  if (data.user) await ensureProfile(data.user.id, data.user.email);
  redirect("/profile");
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  if (data.user) await ensureProfile(data.user.id, displayName || data.user.email);
  redirect("/onboarding");
}