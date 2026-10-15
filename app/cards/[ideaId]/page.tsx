import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CardSections } from "@/components/CardSections";
import { StatusPill } from "@/components/StatusPill";
import { normalizeCardSections } from "@/lib/card-sections";
import { compactText } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { displayCardTitle } from "@/lib/card-display";
import { reportCard } from "@/app/cards/actions";

const reportReasons = [
  ["unclear_execution", "Execution needs clarification"],
  ["duplicate_or_too_similar", "Too close to another card"],
  ["wrong_lane_or_creator_mode_fit", "Not aligned with my lane or creator mode"],
  ["safety_or_sponsor_concern", "Claim, sponsor, or safety concern"],
  ["too_generic", "Needs a sharper creative angle"],
  ["already_used_or_not_useful", "Not useful for this purchase"],
  ["other", "Other"],
] as const;

function summaryText(card: Record<string, unknown>) {
  const summary = card.idea_summary && typeof card.idea_summary === "object" && !Array.isArray(card.idea_summary)
    ? card.idea_summary as Record<string, unknown>
    : null;

  return compactText(
    summary?.premise ??
      summary?.creator_takeaway ??
      card.one_sentence_premise ??
      card.video_blueprint ??
      "A private creator card with a shootable scene flow and edit guide.",
  );
}

export default async function CardDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ ideaId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ideaId } = await params;
  const query = searchParams ? await searchParams : {};
  const { supabase, user } = await requireUser();
  const [{ data: card }, { data: deliveryItem }, { data: review }] = await Promise.all([
    supabase.from("idea_cards").select("idea_id,title,card,markdown").eq("idea_id", ideaId).single(),
    supabase.from("idea_box_items").select("id,delivery_id,slot_index").eq("user_id", user.id).eq("idea_id", ideaId).maybeSingle(),
    supabase.from("creator_video_reviews").select("id,status,final_decision,creator_report").eq("user_id", user.id).eq("idea_id", ideaId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!card || !deliveryItem) {
    return (
      <AppShell>
        <div className="rounded-md border border-ink/10 bg-white p-5">This private card is not available in your vault.</div>
      </AppShell>
    );
  }

  const rawCard = card.card as Record<string, unknown>;
  const sections = normalizeCardSections(rawCard);
  const cardTitle = displayCardTitle(rawCard, card.title);
  const { data: cardReport } = await supabase
    .from("card_reports")
    .select("id,reason,creator_note,status,admin_decision,admin_feedback,replacement_idea_id,reviewed_at,created_at")
    .eq("user_id", user.id)
    .eq("delivery_item_id", deliveryItem.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const reportError = typeof query.report_error === "string" ? query.report_error : "";
  const reported = query.reported === "1";
  const canSubmitReport = !cardReport || !["under_review", "replaced"].includes(String(cardReport.status));

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <div className="rounded-md border border-ink/10 bg-white p-6 shadow-soft">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-coral">Premium creator brief</p>
                <h1 className="mt-2 text-4xl font-semibold leading-tight">{cardTitle}</h1>
                <p className="mt-3 max-w-3xl leading-7 text-ink/65">{summaryText(rawCard)}</p>
              </div>
              <StatusPill value={review?.status ?? "pending"} />
            </div>
          </div>
          <CardSections sections={sections} />
        </section>

        <aside className="space-y-4">
          <div className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="font-semibold">Execution review</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">Shoot a draft from this brief, then send it for a human review against the card direction.</p>
            {review ? (
              <Link className="mt-4 block rounded-md bg-ink px-4 py-3 text-center font-semibold text-white focus-ring" href={`/reviews/${review.id}`}>Open review notes</Link>
            ) : (
              <Link className="mt-4 block rounded-md bg-ink px-4 py-3 text-center font-semibold text-white focus-ring" href={`/reviews/new?idea_id=${ideaId}&delivery_item_id=${deliveryItem.id}`}>Submit draft for review</Link>
            )}
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Request a card check</h2>
                <p className="mt-2 text-sm leading-6 text-ink/60">Use this if the brief feels unclear, duplicated, unsafe, or mismatched with the box you purchased.</p>
              </div>
              {cardReport ? <StatusPill value={cardReport.status} /> : null}
            </div>

            {reported ? (
              <div className="mt-4 rounded-md border border-teal/20 bg-teal/10 p-3 text-sm text-teal">
                Your card check was sent to the Anomaly Box team.
              </div>
            ) : null}
            {reportError ? (
              <div className="mt-4 rounded-md border border-coral/20 bg-coral/10 p-3 text-sm text-coral">
                {reportError}
              </div>
            ) : null}

            {cardReport ? (
              <div className="mt-4 space-y-3 rounded-md border border-ink/10 bg-paper p-4 text-sm leading-6">
                <div>
                  <span className="font-semibold">Reason:</span> {String(cardReport.reason).replaceAll("_", " ")}
                </div>
                <div>
                  <span className="font-semibold">Your note:</span> {cardReport.creator_note}
                </div>
                {cardReport.status === "under_review" ? (
                  <p className="text-ink/60">This card is under review. You can still use the brief while the team checks the issue.</p>
                ) : null}
                {cardReport.admin_feedback ? (
                  <div className="rounded-md bg-white p-3">
                    <div className="font-semibold">Anomaly Box feedback</div>
                    <p className="mt-1 text-ink/65">{cardReport.admin_feedback}</p>
                  </div>
                ) : null}
                {cardReport.status === "replaced" && cardReport.replacement_idea_id ? (
                  <Link className="block rounded-md bg-ink px-4 py-3 text-center font-semibold text-white focus-ring" href={`/cards/${cardReport.replacement_idea_id}`}>
                    Open replacement brief
                  </Link>
                ) : null}
              </div>
            ) : null}

            {canSubmitReport ? (
              <form action={reportCard} className="mt-4 space-y-3">
                <input type="hidden" name="idea_id" value={ideaId} />
                <input type="hidden" name="delivery_id" value={deliveryItem.delivery_id} />
                <input type="hidden" name="delivery_item_id" value={deliveryItem.id} />
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Reason</span>
                  <select name="reason" className="mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus-ring" required>
                    {reportReasons.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">What should we review?</span>
                  <textarea
                    name="creator_note"
                    className="mt-2 min-h-28 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm leading-6 focus-ring"
                    placeholder="Tell us what feels unclear, duplicated, unsafe, or off-lane."
                    required
                  />
                </label>
                <button className="w-full rounded-md bg-ink px-4 py-3 font-semibold text-white focus-ring" type="submit">
                  {cardReport ? "Send another check" : "Send card check"}
                </button>
              </form>
            ) : null}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}