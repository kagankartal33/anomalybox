"use server";

import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/navigation";

async function ensureProfile(userId: string, displayName?: string | null) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    display_name: displayName ?? null,
  }, { onConflict: "id" });
  if (error) {
    console.warn("Creator profile initialization failed.", { code: error.code });
  }
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""), "/profile");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: captchaToken ? { captchaToken } : undefined,
  });
  if (error) {
    console.warn("Sign-in rejected.", { code: error.code, status: error.status });
    const message = error.code === "captcha_failed" ? "Security verification failed. Please try again." : "Email or password is incorrect.";
    redirect(`/login?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`);
  }
  if (data.user) await ensureProfile(data.user.id, data.user.email);
  redirect(next);
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""), "/onboarding");
  if (password.length < 8) {
    redirect(`/login?error=${encodeURIComponent("Password must be at least 8 characters.")}&next=${encodeURIComponent(next)}`);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      captchaToken: captchaToken || undefined,
    },
  });
  if (error) {
    console.warn("Account creation rejected.", { code: error.code, status: error.status });
    const message = error.code === "captcha_failed"
      ? "Security verification failed. Please try again."
      : error.code === "user_already_exists"
        ? "An account may already exist for this email. Try signing in or reset your password."
        : "Your account could not be created. Please check the details and try again.";
    redirect(`/login?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`);
  }
  if (!data.user) {
    redirect(`/login?error=${encodeURIComponent("Your account could not be created. Please try again.")}&next=${encodeURIComponent(next)}`);
  }
  if (!data.session) {
    redirect(`/login?signup=confirm&next=${encodeURIComponent(next)}`);
  }
  await ensureProfile(data.user.id, displayName || data.user.email);
  redirect(next);
}
