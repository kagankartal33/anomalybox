"use server";

import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");

  if (email && email.length <= 320) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
      captchaToken: captchaToken || undefined,
    });

    if (error) {
      console.warn("Password reset request was not accepted by the auth provider.", {
        code: error.code,
        status: error.status,
      });
    }
  }

  redirect("/forgot-password?sent=1");
}