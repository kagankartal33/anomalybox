"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generationProvenance } from "@/lib/generation/provenance";
import { generationProvenance } from "@/lib/generation/provenance";

const RatingInput = z.object({
  ideaId: z.string().uuid(),
  decision: z.enum(["approve", "refine", "reject"]),
  rank: z.coerce.number().int().min(1).max(5),
  runtimeFit: z.enum(["rushed", "right", "padded"]),
  failureCodes: z.array(z.string().regex(/^[a-z0-9_]{2,64}$/)).max(16),
  notes: z.string().trim().max(1000),
});

export async function saveGoldRating(formData: FormData) {
  const { profile } = await requireAdmin();
  const parsed = goldRatingInputSchema.safeParse({
    ideaId: formData.get("idea_id"),
    decision: formData.get("decision"),
    rank: formData.get("rank"),
    runtimeFit: formData.get("runtime_fit"),
    failureCodes: formData.getAll("failure_codes"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    redirect(`/admin/card-quality?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid_rating")}`);
  }

  const supabase = createSupabaseAdminClient();
  const { data: candidate, error: candidateError } = await supabase
    .from("idea_candidates")
    .select("id,category_id,persona_id,platform,language,generation_batch_id,decision_trace,status")
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
  const generation = generationProvenance(candidate.decision_trace);
  const { error } = await supabase.from("idea_card_gold_ratings").upsert({
    idea_id: candidate.id,
    generation_run_id: generation.runId,
    rater_id: profile.id,
    source: generation.isV22Generated ? "generated" : "existing_stock",
    category_slug: category.slug,
    persona_slug: persona.slug,
    platform: candidate.platform,
    language: candidate.language,
    provider: generation.provider,
    model: generation.model,
    prompt_version: generation.promptVersion,
    card_snapshot: card.card,
    human_decision: parsed.data.decision,
    human_rank: parsed.data.rank,
    runtime_fit: parsed.data.runtimeFit,
    failure_codes: parsed.data.failureCodes,
    notes: parsed.data.notes || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "rater_id,idea_id" });
  if (error) redirect(`/admin/card-quality?error=${encodeURIComponent(error.code)}`);

  const { data: pendingReview } = await supabase
    .from("idea_quality_checks")
    .select("decision")
    .eq("idea_id", candidate.id)
    .eq("decision", "human_review_required")
    .maybeSingle();
  if (pendingReview && candidate.status === "human_review_required") {
    const { data: resolved, error: reviewResolutionError } = await supabase.rpc("resolve_idea_quality_human_review", {
      p_idea_id: candidate.id,
      p_rater_id: profile.id,
      p_decision: parsed.data.decision,
    });
    if (reviewResolutionError || resolved !== true) {
      redirect(`/admin/card-quality?error=${encodeURIComponent(reviewResolutionError?.code ?? "review_resolution_failed")}`);
    }
  }
  revalidatePath("/admin/card-quality");
  redirect("/admin/card-quality?saved=1");
}