"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { FLASH } from "@/lib/flash-messages";

export async function saveOnboarding(formData: FormData) {
  const { supabase, user } = await requireUser();
  const displayName = String(formData.get("display_name") ?? "");
  const handle = String(formData.get("handle") ?? "");
  const niche = String(formData.get("niche") ?? "");
  const cuisineDetail = String(formData.get("cuisine_detail") ?? "").trim().slice(0, 140);
  const categoryIds = [
    String(formData.get("category_id_1") ?? ""),
    String(formData.get("category_id_2") ?? ""),
    String(formData.get("category_id_3") ?? ""),
  ].filter(Boolean);
  const personaId = String(formData.get("persona_id") ?? "");
  const uniqueCategoryIds = [...new Set(categoryIds)].slice(0, 3);

  if (!uniqueCategoryIds.length) {
    redirect(`/onboarding?error=${encodeURIComponent(FLASH.laneRequired)}`);
  }

  const { data: validCategories } = await supabase
    .from("categories")
    .select("id")
    .in("id", uniqueCategoryIds)
    .eq("enabled", true);
  const validCategoryIds = new Set((validCategories ?? []).map((category) => category.id));
  const safeCategoryIds = uniqueCategoryIds.filter((catId) => validCategoryIds.has(catId));

  if (!safeCategoryIds.length) {
    redirect(`/onboarding?error=${encodeURIComponent(FLASH.lanesUnavailable)}`);
  }

  await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName || user.email,
  }, { onConflict: "id" });

  await supabase.from("creator_profiles").upsert({
    user_id: user.id,
    handle,
    niche,
    default_platforms: ["instagram_reels"],
    production_capacity: { mvp: true, cuisine_detail: cuisineDetail || null },
  }, { onConflict: "user_id" });

  // Clear previous lanes and save fresh up to 3. Existing delivered boxes keep
  // their original category/persona through idea_box_deliveries.
  await supabase.from("creator_category_preferences").delete().eq("user_id", user.id);

  const preferencePromises = safeCategoryIds
    .filter(Boolean)
    .map((catId, index) =>
      supabase.from("creator_category_preferences").insert({
        user_id: user.id,
        category_id: catId,
        persona_id: personaId || null,
        priority: index + 1,
        selected_content_layers: [],
      })
    );
  await Promise.all(preferencePromises);

  redirect("/store");
}
