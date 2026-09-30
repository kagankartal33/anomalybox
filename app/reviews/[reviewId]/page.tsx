import { AppShell } from "@/components/AppShell";
import { ReviewUploadForm } from "@/components/ReviewUploadForm";
import { StatusPill } from "@/components/StatusPill";
import { dateTime } from "@/lib/format";
import { requireUser } from "@/lib/auth";

export default async function ReviewDetailPage({ params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const { supabase, user } = await requireUser();
  const [{ data: review }, { data: attempts }, { data: checks }] = await Promise.all([
    supabase.from("creator_video_reviews").select("*").eq("id", reviewId).eq("user_id", user.id).single(),
    supabase.from("creator_video_review_attempts").select("*").eq("review_id", reviewId).eq("user_id", user.id).order("attempt_number"),
    supabase.from("creator_video_review_checks").select("attempt_id,section,label,status,evidence_summary,revision_advice,created_at").eq("review_id", reviewId).eq("user_id", user.id).order("created_at"),
  ]);

  if (!review) {
    return (
      <AppShell>
        <div className="rounded-md border border-ink/10 bg-white p-5">Review not found.</div>
      </AppShell>
    );
  }

  const needsRevision = review.status === "revision_requested" || review.status === "blocked";

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="space-y-4">
          <div className="rounded-md border border-ink/10 bg-white p-6 shadow-soft">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink/40">Video review</p>
                <h1 className="mt-2 text-4xl font-semibold">Execution feedback</h1>
                <p className="mt-2 text-ink/60">Your latest status and admin feedback appear here.</p>
              </div>
              <StatusPill value={review.status} />
            </div>
            {review.creator_report ? (
              <div className="mt-5 rounded-md bg-mist/70 p-4">
                <div className="font-semibold">{(review.creator_report as Record<string, string>).headline ?? "Admin feedback"}</div>
                <p className="mt-1 text-sm leading-6 text-ink/70">{(review.creator_report as Record<string, string>).overall_feedback}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-md border border-ink/10 bg-white p-5">
            <h2 className="mb-3 text-2xl font-semibold">Checklist result</h2>
            {!checks?.length ? <p className="text-ink/60">The admin checklist has not been saved yet.</p> : null}
            <div className="space-y-2">
              {checks?.map((check) => (
                <div key={`${check.attempt_id}-${check.label}`} className="rounded-md border border-ink/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{check.section} / {check.label}</div>
                    <StatusPill value={check.status} />
                  </div>
                  {check.evidence_summary ? <p className="mt-2 text-sm text-ink/65">{check.evidence_summary}</p> : null}
                  {check.revision_advice ? <p className="mt-1 text-sm text-coral">{check.revision_advice}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="font-semibold">Attempt history</h2>
            <div className="mt-3 space-y-2">
              {attempts?.map((attempt) => (
                <div key={attempt.id} className="rounded-md bg-paper p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Attempt {attempt.attempt_number}</span>
                    <StatusPill value={attempt.status} />
                  </div>
                  <p className="mt-1 text-ink/50">{dateTime(attempt.submitted_at ?? attempt.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
          {needsRevision ? (
            <div>
              <h2 className="mb-3 text-xl font-semibold">Submit a revised video</h2>
              <ReviewUploadForm reviewId={review.id} ideaId={review.idea_id} />
            </div>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}