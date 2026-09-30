import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CardSections } from "@/components/CardSections";
import { StatusPill } from "@/components/StatusPill";
import { normalizeCardSections } from "@/lib/card-sections";
import { compactText } from "@/lib/format";
import { requireUser } from "@/lib/auth";

export default async function CardDetailPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  const { supabase, user } = await requireUser();
  const [{ data: card }, { data: deliveryItem }, { data: review }] = await Promise.all([
    supabase.from("idea_cards").select("idea_id,title,card,markdown").eq("idea_id", ideaId).single(),
    supabase.from("idea_box_items").select("id,delivery_id,slot_index").eq("user_id", user.id).eq("idea_id", ideaId).maybeSingle(),
    supabase.from("creator_video_reviews").select("id,status,final_decision,creator_report").eq("user_id", user.id).eq("idea_id", ideaId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!card || !deliveryItem) {
    return (
      <AppShell>
        <div className="rounded-md border border-ink/10 bg-white p-5">You do not have access to this card.</div>
      </AppShell>
    );
  }

  const rawCard = card.card as Record<string, unknown>;
  const sections = normalizeCardSections(rawCard);

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <div className="rounded-md border border-ink/10 bg-white p-6 shadow-soft">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-coral">Premium creator card</p>
                <h1 className="mt-2 text-4xl font-semibold leading-tight">{card.title}</h1>
                <p className="mt-3 max-w-3xl leading-7 text-ink/65">{compactText(rawCard.idea_summary ?? rawCard.one_sentence_premise)}</p>
              </div>
              <StatusPill value={review?.status ?? "pending"} />
            </div>
          </div>
          <CardSections sections={sections} />
        </section>

        <aside className="space-y-4">
          <div className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="font-semibold">Manual video review</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">Shoot your draft from this card, then send it for a human checklist review.</p>
            {review ? (
              <Link className="mt-4 block rounded-md bg-ink px-4 py-3 text-center font-semibold text-white focus-ring" href={`/reviews/${review.id}`}>Open review result</Link>
            ) : (
              <Link className="mt-4 block rounded-md bg-ink px-4 py-3 text-center font-semibold text-white focus-ring" href={`/reviews/new?idea_id=${ideaId}&delivery_item_id=${deliveryItem.id}`}>Submit my video</Link>
            )}
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-5">
            <h2 className="font-semibold">Brand lift</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">{compactText(rawCard.brand_lift_statement ?? rawCard.strategic_value)}</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}