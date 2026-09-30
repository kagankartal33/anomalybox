import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { CardSections } from "@/components/CardSections";
import { checklistFromIdeaCard } from "@/lib/admin-review";
import { normalizeCardSections } from "@/lib/card-sections";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { saveManualReview } from "../../actions";

export default async function AdminReviewDetailPage({ params, searchParams }: { params: Promise<{ reviewId: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { reviewId } = await params;
  const query = await searchParams;
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const { data: review } = await supabase.from("creator_video_reviews").select("*").eq("id", reviewId).single();
  if (!review) {
    return <AppShell><div className="rounded-md border border-ink/10 bg-white p-5">Review not found.</div></AppShell>;
  }
  const [{ data: attempts }, { data: card }, { data: existingChecks }] = await Promise.all([
    supabase.from("creator_video_review_attempts").select("*").eq("review_id", reviewId).order("attempt_number"),
    supabase.from("idea_cards").select("title,card").eq("idea_id", review.idea_id).single(),
    supabase.from("creator_video_review_checks").select("*").eq("review_id", reviewId),
  ]);
  const currentAttempt = attempts?.find((attempt) => attempt.id === review.current_attempt_id) ?? attempts?.at(-1);
  const signed = currentAttempt?.storage_path
    ? await supabase.storage.from("creator-review-videos").createSignedUrl(currentAttempt.storage_path, 3600)
    : { data: null };
  const cardJson = card?.card ?? {};
  const sections = normalizeCardSections(cardJson);
  const checklist = checklistFromIdeaCard(cardJson);
  const existingByKey = new Map(existingChecks?.filter((check) => check.attempt_id === currentAttempt?.id).map((check) => [check.check_key, check]) ?? []);

  return (
    <AppShell>
      <div className="mb-5 flex flex-col justify-between gap-4 rounded-md border border-ink/10 bg-white p-6 shadow-soft md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink/40">Manual review</p>
          <h1 className="mt-2 text-4xl font-semibold">Creator video checklist</h1>
          <p className="mt-2 text-ink/60">{card?.title}</p>
        </div>
        <StatusPill value={review.status} />
      </div>
      {query.error ? <div className="mb-4 rounded-md bg-coral/10 p-3 text-sm text-coral">{query.error}</div> : null}
      {query.saved ? <div className="mb-4 rounded-md bg-teal/10 p-3 text-sm text-teal">Review saved.</div> : null}
      <div className="grid gap-6 xl:grid-cols-[480px_1fr]">
        <section className="space-y-4">
          <div className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
            <h2 className="mb-3 text-xl font-semibold">Submitted video</h2>
            {signed.data?.signedUrl ? (
              <video className="aspect-[9/16] max-h-[640px] w-full rounded-md bg-ink" controls src={signed.data.signedUrl} />
            ) : (
              <div className="rounded-md bg-paper p-5 text-ink/60">Signed video URL could not be created, or the video has not finished uploading.</div>
            )}
          </div>
          <CardSections sections={sections} />
        </section>
        <section className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="text-2xl font-semibold">Checklist & feedback</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">Mark each item based on the submitted video. Creator-facing advice should be specific and practical.</p>
          <form action={saveManualReview} className="mt-4 space-y-4">
            <input type="hidden" name="review_id" value={review.id} />
            <input type="hidden" name="attempt_id" value={currentAttempt?.id ?? ""} />
            <input type="hidden" name="user_id" value={review.user_id} />
            <input type="hidden" name="idea_id" value={review.idea_id} />
            {checklist.map((item) => {
              const existing = existingByKey.get(item.check_key);
              return (
                <div key={item.check_key} className="rounded-md border border-ink/10 p-4">
                  <input type="hidden" name="check_key" value={item.check_key} />
                  <input type="hidden" name={`section_${item.check_key}`} value={item.section} />
                  <input type="hidden" name={`label_${item.check_key}`} value={item.label} />
                  <input type="hidden" name={`source_${item.check_key}`} value={item.source_card_path} />
                  <input type="hidden" name={`required_${item.check_key}`} value={String(item.is_required)} />
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <div className="font-semibold">{item.label}</div>
                      <p className="mt-1 text-sm text-ink/60">{item.admin_look_for}</p>
                    </div>
                    <select className="focus-ring rounded-md border border-ink/15 px-2 py-2 text-sm" name={`status_${item.check_key}`} defaultValue={existing?.status ?? "missing"}>
                      <option value="pass">pass</option>
                      <option value="partial">partial</option>
                      <option value="missing">missing</option>
                      <option value="not_applicable">not applicable</option>
                    </select>
                  </div>
                  <textarea className="focus-ring mt-3 min-h-16 w-full rounded-md border border-ink/15 px-3 py-2 text-sm" name={`evidence_${item.check_key}`} defaultValue={existing?.evidence_summary ?? ""} placeholder="What did you see in the video?" />
                  <textarea className="focus-ring mt-2 min-h-16 w-full rounded-md border border-ink/15 px-3 py-2 text-sm" name={`advice_${item.check_key}`} defaultValue={existing?.revision_advice ?? ""} placeholder="Practical feedback for the creator" />
                </div>
              );
            })}
            <label className="grid gap-2 text-sm font-semibold">
              Final decision
              <select className="focus-ring rounded-md border border-ink/15 px-3 py-3 font-normal" name="final_decision" defaultValue={review.final_decision ?? "minor_revisions"}>
                <option value="minor_revisions">minor revisions</option>
                <option value="needs_reshoot">needs reshoot</option>
                <option value="ready_to_post">ready to post</option>
                <option value="brand_safety_blocked">brand safety blocked</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Creator feedback
              <textarea className="focus-ring min-h-28 rounded-md border border-ink/15 px-3 py-3 font-normal" name="overall_feedback" defaultValue={(review.creator_report as Record<string, string>)?.overall_feedback ?? ""} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Admin private note
              <textarea className="focus-ring min-h-20 rounded-md border border-ink/15 px-3 py-3 font-normal" name="admin_private_notes" defaultValue={review.admin_private_notes ?? ""} />
            </label>
            <button className="focus-ring w-full rounded-md bg-ink px-4 py-3 font-semibold text-white">Save review</button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}