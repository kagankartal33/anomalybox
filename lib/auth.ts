import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return { supabase, user };
}

export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,role,display_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/profile");
  return { supabase, user, profile };
}

export async function getUserProfile(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}