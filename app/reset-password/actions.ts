"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FLASH } from "@/lib/flash-messages";

export async function resetPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    redirect(`/reset-password?error=${encodeURIComponent(FLASH.passwordTooShort)}`);
  }
  if (password !== confirmation) {
    redirect(`/reset-password?error=${encodeURIComponent(FLASH.passwordsDoNotMatch)}`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/reset-password?expired=1");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(FLASH.passwordUpdateFailed)}`);
  }

  await supabase.auth.signOut({ scope: "global" });
  redirect("/login?password=reset");
}
