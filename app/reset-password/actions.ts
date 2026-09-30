"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function resetPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    redirect("/reset-password?error=Password%20must%20be%20at%20least%208%20characters.");
  }
  if (password !== confirmation) {
    redirect("/reset-password?error=Passwords%20do%20not%20match.");
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
    redirect(`/reset-password?error=${encodeURIComponent("Your password could not be updated. Request a new recovery link.")}`);
  }

  await supabase.auth.signOut({ scope: "global" });
  redirect("/login?password=reset");
}