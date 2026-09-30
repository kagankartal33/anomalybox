"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const RatingInput = z.object({
  ideaId: z.string().uuid(),
  decision: z.enum(["approve", "refine", "reject"]),
  rank: z.coerce.number().int().min(1).max(5),
  failureCodes: z.array(z.string().regex(/^[a-z0-9_]{2,64}$/)).max(16),
  notes: z.string().trim().max(1000),
});

export async function saveGoldRating(formData: FormData) {
  const { profile } = await requireAdmin();
  const parsed = RatingInput.safeParse({
    ideaId: formData.get("idea_id"),
    decision: formData.get("decision"),
    rank: formData.get("rank"),
    failureCodes: formData.getAll("failure_codes"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    redirect(`/admin/card-quality?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid_rating")}`);
  }

  const supabase = createSupabaseAdminClient();
  const { data: candidate, error: candidateError } = await supabase
    .from("idea_candidates")
    .select("id,category_id,persona_id,platform,language,generation_batch_id,decision_trace")
    .eq("id", parsed.data.ideaId)
    .single();
  const [{ data: card }, { data: category }, { data: persona }] = await Promise.all([
    supabase.from("idea_cards").select("card").eq("idea_id", parsed.data.ideaId).single(),
    candidate?.category_id ? supabase.from("categories").select("slug").eq("id", candidate.category_id).single() : Promise.resolve({ data: null }),
    candidate?.persona_id ? supabase.from("creator_personas").select("slug").eq("id", candidate.persona_id).single() : Promise.resolve({ data: null }),
  ]);
  if (candidateError || !candidate || !card?.card || !category?.slug || !persona?.slug) {
    redirect("/admin/card-quality?error=card_snapshot_unavailable");
  }
  const trace = candidate.decision_trace && typeof candidate.decision_trace === "object"
    ? candidate.decision_trace as Record<string, unknown>
    : {};
  const generation = trace.generation && typeof trace.generation === "object"
    ? trace.generation as Record<string, unknown>
    : {};
  const { error } = await supabase.from("idea_card_gold_ratings").upsert({
    idea_id: candidate.id,
    rater_id: profile.id,
    source: candidate.generation_batch_id ? "generated" : "existing_stock",
    category_slug: category.slug,
    persona_slug: persona.slug,
    platform: candidate.platform,
    language: candidate.language,
    provider: typeof generation.provider === "string" ? generation.provider : null,
    model: typeof generation.model === "string" ? generation.model : null,
    prompt_version: typeof generation.prompt_version === "string" ? generation.prompt_version : null,
    card_snapshot: card.card,
    human_decision: parsed.data.decision,
    human_rank: parsed.data.rank,
    failure_codes: parsed.data.failureCodes,
    notes: parsed.data.notes || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "rater_id,idea_id" });
  if (error) redirect(`/admin/card-quality?error=${encodeURIComponent(error.code)}`);
  revalidatePath("/admin/card-quality");
  redirect("/admin/card-quality?saved=1");
}