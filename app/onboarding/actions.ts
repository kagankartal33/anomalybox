"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export async function saveOnboarding(formData: FormData) {
  const { supabase, user } = await requireUser();
  const displayName = String(formData.get("display_name") ?? "");
  const handle = String(formData.get("handle") ?? "");
  const niche = String(formData.get("niche") ?? "");
  const cuisineDetail = String(formData.get("cuisine_detail") ?? "").trim().slice(0, 140);
  const categoryId = String(formData.get("category_id") ?? "");
  const personaId = String(formData.get("persona_id") ?? "");

  await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName || user.email,
  }, { onConflict: "id" });

  await supabase.from("creator_profiles").upsert({
    user_id: user.id,
    handle,
    niche,
    default_platforms: ["instagram_reels"],
    production_capacity: { review_flow: "manual_admin", mvp: true, cuisine_detail: cuisineDetail || null },
  }, { onConflict: "user_id" });

  if (categoryId) {
    await supabase.from("creator_category_preferences").upsert({
      user_id: user.id,
      category_id: categoryId,
      persona_id: personaId || null,
      priority: 1,
      selected_content_layers: [],
    }, { onConflict: "user_id,category_id,persona_id" });
  }

  redirect("/store");
}