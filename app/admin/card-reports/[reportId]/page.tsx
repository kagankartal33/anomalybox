import Link from "next/link";
import { ArrowLeft, Flag, RefreshCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IdeaCardView } from "@/components/idea-card/IdeaCardView";
import { StatusPill } from "@/components/StatusPill";
import { saveCardReportDecision } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { displayCardTitle } from "@/lib/card-display";
import { adaptLegacyIdeaCard, presentIdeaCard } from "@/lib/idea-card";
import { dateTime } from "@/lib/format";

export default async function AdminCardReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { reportId } = await params;
  const query = searchParams ? await searchParams : {};
  const supabase = createSupabaseAdminClient();

  const { data: report } = await supabase.from("card_reports").select("*").eq("id", reportId).single();
  if (!report) {
    return (
      <AppShell>
        <div className="rounded-md border border-ink/10 bg-white p-5">Card report could not be found.</div>
      </AppShell>
    );
  }

  const [{ data: profile }, { data: delivery }, { data: item }, { data: reportedCard }, { data: boxItems }] = await Promise.all([
    supabase.from("profiles").select("id,display_name").eq("id", report.user_id).maybeSingle(),
    supabase.from("idea_box_deliveries").select("id,user_id,category_id,persona_id,status,categories(name,slug),creator_personas(name,slug)").eq("id", report.delivery_id).single(),
    supabase.from("idea_box_items").select("id,delivery_id,idea_id,inventory_id,slot_index").eq("id", report.delivery_item_id).single(),
    supabase.from("idea_cards").select("idea_id,title,card").eq("idea_id", report.idea_id).single(),
    supabase.from("idea_box_items").select("id,idea_id").eq("delivery_id", report.delivery_id),
  ]);

  const excludedIdeaIds = new Set((boxItems ?? []).map((row) => row.idea_id));
  excludedIdeaIds.add(report.idea_id);
  const { data: inventoryRows } = await supabase
    .from("idea_inventory")
    .select("id,idea_id,internal_rank_score,published_at,status,quality_floor_passed")
    .eq("category_id", delivery?.category_id)
    .eq("persona_id", delivery?.persona_id)
    .eq("status", "available")
    .eq("reuse_count", 0)
    .eq("max_reuse_count", 1)
    .eq("quality_floor_passed", true)
    .order("internal_rank_score", { ascending: false })
    .limit(40);
  const filteredInventory = (inventoryRows ?? []).filter((row) => !excludedIdeaIds.has(row.idea_id)).slice(0, 12);
  const { data: candidateCards } = filteredInventory.length
    ? await supabase.from("idea_cards").select("idea_id,title,card").in("idea_id", filteredInventory.map((row) => row.idea_id))
    : { data: [] };

  const candidateByIdea = new Map((candidateCards ?? []).map((card) => [card.idea_id, card]));
  const replacementCandidates = filteredInventory
    .map((inventory) => {
      const card = candidateByIdea.get(inventory.idea_id);
      return card ? { inventory, card, title: displayCardTitle(card.card, card.title) } : null;
    })
    .filter(Boolean) as Array<{ inventory: { id: string; idea_id: string }; card: { idea_id: string; title: string | null; card: unknown }; title: string }>;

  const rawCard = reportedCard?.card as Record<string, unknown> | undefined;
  const adapted = adaptLegacyIdeaCard(rawCard ?? {}, {
    ideaId: reportedCard?.idea_id,
    dbTitle: reportedCard?.title,
  });
  const presented = presentIdeaCard(adapted.card, {
    rawLegacy: rawCard ?? null,
    dbTitle: reportedCard?.title,
  });
  const title = reportedCard ? displayCardTitle(reportedCard.card, reportedCard.title) : "Reported card";
  const error = typeof query.error === "string" ? query.error : "";
  const saved = query.saved === "1";
  const category = Array.isArray(delivery?.categories) ? delivery?.categories[0] : delivery?.categories;
  const persona = Array.isArray(delivery?.creator_personas) ? delivery?.creator_personas[0] : delivery?.creator_personas;

  return (
    <AppShell>
      <div className="mb-5">
        <Link href="/admin#card-reports" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-ink focus-ring">
          <ArrowLeft className="h-4 w-4" />
          Back to admin reports
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="space-y-5">
          <div className="rounded-md border border-ink/10 bg-white p-6 shadow-soft">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-coral">Card report</p>
                <h1 className="mt-2 text-4xl font-semibold leading-tight">{title}</h1>
                <p className="mt-3 text-sm leading-6 text-ink/60">
                  {category?.name ?? "Category"} / {persona?.name ?? "Creator mode"} / Slot {item?.slot_index ?? "-"}
                </p>
              </div>
              <StatusPill value={report.status} />
            </div>
          </div>

          <div className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal">
              <Flag className="h-4 w-4" />
              Creator concern
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-ink/10 bg-paper p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Reason</div>
                <p className="mt-2 font-semibold">{String(report.reason).replaceAll("_", " ")}</p>
              </div>
              <div className="rounded-md border border-ink/10 bg-paper p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Reporter</div>
                <p className="mt-2 font-semibold">{profile?.display_name ?? report.user_id}</p>
                <p className="mt-1 text-sm text-ink/50">{dateTime(report.created_at)}</p>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-ink/10 bg-white p-4 text-sm leading-6 text-ink/68">
              {report.creator_note}
            </div>
          </div>

          <IdeaCardView card={presented} />
        </section>

        <aside className="space-y-4">
          {error ? <div className="rounded-md border border-coral/20 bg-coral/10 p-4 text-sm text-coral">{error}</div> : null}
          {saved ? <div className="rounded-md border border-teal/20 bg-teal/10 p-4 text-sm text-teal">Decision saved.</div> : null}

          <form action={saveCardReportDecision} className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-[#5B2A86]" />
              <h2 className="font-semibold">Admin decision</h2>
            </div>
            <input type="hidden" name="report_id" value={report.id} />
            <input type="hidden" name="user_id" value={report.user_id} />

            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Decision</span>
              <select name="decision" className="mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus-ring" defaultValue="reject">
                <option value="reject">Reject report - keep card</option>
                <option value="accept_no_replace">Accept - no replacement</option>
                <option value="accept_replace">Accept - replace this slot</option>
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Replacement card</span>
              <select name="replacement_inventory_id" className="mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus-ring" defaultValue="">
                <option value="">No replacement selected</option>
                {replacementCandidates.map((candidate) => (
                  <option key={candidate.inventory.id} value={candidate.inventory.id}>{candidate.title}</option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-5 text-ink/50">
                Replacement is only used for &quot;Accept - replace this slot.&quot; Candidates are filtered to this box lane and creator mode.
              </p>
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Creator-facing feedback</span>
              <textarea name="admin_feedback" className="mt-2 min-h-32 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm leading-6 focus-ring" required />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Private admin note</span>
              <textarea name="admin_private_note" className="mt-2 min-h-24 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm leading-6 focus-ring" />
            </label>

            <button className="mt-4 w-full rounded-md bg-ink px-4 py-3 font-semibold text-white focus-ring" type="submit">
              Save decision
            </button>
          </form>

          <div className="rounded-md border border-ink/10 bg-paper p-4 text-sm leading-6 text-ink/60">
            {replacementCandidates.length ? `${replacementCandidates.length} eligible replacement cards are available for this route.` : "No eligible replacement cards are available. Accept without replacement or restock this route first."}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
