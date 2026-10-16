import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IdeaCardView } from "@/components/idea-card/IdeaCardView";
import { StatusPill } from "@/components/StatusPill";
import { adaptLegacyIdeaCard, presentIdeaCard } from "@/lib/idea-card";
import { requireUser } from "@/lib/auth";
import { publicFlashMessage } from "@/lib/flash-messages";
import { reportCard } from "@/app/cards/actions";

const reportReasons = [
  ["unclear_execution", "The shoot notes are unclear"],
  ["duplicate_or_too_similar", "Too close to another brief"],
  ["wrong_lane_or_creator_mode_fit", "Wrong lane or creator mode"],
  ["safety_or_sponsor_concern", "Claim, sponsor, or safety issue"],
  ["too_generic", "The angle is not specific enough"],
  ["already_used_or_not_useful", "Not useful for this box"],
  ["other", "Other"],
] as const;

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
  const [{ data: card }, { data: deliveryItem }] = await Promise.all([
    supabase.from("idea_cards").select("idea_id,title,card,markdown").eq("idea_id", ideaId).single(),
    supabase.from("idea_box_items").select("id,delivery_id,slot_index").eq("user_id", user.id).eq("idea_id", ideaId).maybeSingle(),
  ]);

  if (!card || !deliveryItem) {
    return (
      <AppShell>
        <div className="rounded-md border border-ink/10 bg-white p-5">This shoot brief is not in your vault.</div>
      </AppShell>
    );
  }

  const rawCard = (card.card ?? {}) as Record<string, unknown>;
  const adapted = adaptLegacyIdeaCard(rawCard, { ideaId: card.idea_id, dbTitle: card.title });
  const presented = presentIdeaCard(adapted.card, { rawLegacy: rawCard, dbTitle: card.title });
  const blocking =
    adapted.card.steps.length < 3 ||
    presented.steps.length < 3 ||
    adapted.issues.some((issue) => issue.severity === "error" && issue.code === "MISSING_REQUIRED_FIELD");

  const { data: cardReport } = await supabase
    .from("card_reports")
    .select("id,reason,creator_note,status,admin_decision,admin_feedback,replacement_idea_id,reviewed_at,created_at")
    .eq("user_id", user.id)
    .eq("delivery_item_id", deliveryItem.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const reportError = publicFlashMessage(typeof query.report_error === "string" ? query.report_error : null);
  const reported = query.reported === "1";
  const canSubmitReport = !cardReport || !["under_review", "replaced"].includes(String(cardReport.status));

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/boxes"
          className="inline-flex items-center gap-1.5 rounded-md py-1 text-xs font-semibold text-ink/60 transition hover:text-ink focus-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Creator Vault</span>
        </Link>
        {/* Mobile only — jump to flag form without scrolling past all sections */}
        <a
          href="#report-section"
          className="xl:hidden text-xs font-semibold text-ink/60 hover:text-ink/70 transition print:hidden"
        >
          Flag this brief
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          {blocking ? (
            <div className="rounded-md border border-coral/20 bg-coral/10 p-4 text-sm text-coral">
              This shoot plan could not be shown correctly. Refresh or open another brief.
            </div>
          ) : (
            <IdeaCardView card={presented} />
          )}
        </section>

        <aside id="report-section" className="space-y-4 print:hidden xl:sticky xl:top-16 xl:self-start">
          <div className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-base">Request a review</h2>
                <p className="mt-1.5 text-xs sm:text-sm leading-6 text-ink/60">
                  Ask for a review if a note is unclear, the brief does not match your box, or you need a replacement.
                </p>
              </div>
              {cardReport ? <StatusPill value={cardReport.status} /> : null}
            </div>

            {reported ? (
              <div className="mt-4 rounded-md border border-teal/20 bg-teal/10 p-3 text-sm text-teal">
                Your review request was received. The team will be in touch.
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
                  <p className="text-ink/60">This brief is under review. You can keep using it while the team looks at it.</p>
                ) : null}
                {cardReport.admin_feedback ? (
                  <div className="rounded-md bg-white p-3">
                    <div className="font-semibold">Team feedback</div>
                    <p className="mt-1 text-ink/65">{cardReport.admin_feedback}</p>
                  </div>
                ) : null}
                {cardReport.status === "replaced" && cardReport.replacement_idea_id ? (
                  <Link
                    className="block rounded-md bg-ink px-4 py-3 text-center font-semibold text-white focus-ring"
                    href={`/cards/${cardReport.replacement_idea_id}`}
                  >
                    Open the replacement brief
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
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Reason</span>
                  <select name="reason" className="mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus-ring" required>
                    {reportReasons.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">What should we review?</span>
                  <textarea
                    name="creator_note"
                    className="mt-2 min-h-24 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm leading-6 focus-ring"
                    placeholder="Note anything unclear, repeated, or off for this box."
                    required
                  />
                </label>
                <button className="w-full rounded-md bg-ink px-4 py-2.5 font-semibold text-white focus-ring text-sm" type="submit">
                  {cardReport ? "Request another review" : "Send review request"}
                </button>
              </form>
            ) : null}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
