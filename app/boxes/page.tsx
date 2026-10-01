import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CreativeDossierShelf, type CreatorBox } from "@/components/CreativeDossierShelf";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { displayCardPremise, displayCardTitle } from "@/lib/card-display";

export default async function BoxesPage() {
  const { user } = await requireUser();
  const supabase = createSupabaseAdminClient();

  const { data: deliveries } = await supabase
    .from("idea_box_deliveries")
    .select(`
      id,
      status,
      delivered_at,
      created_at,
      metadata,
      box_products(slug,name),
      categories(slug,name),
      creator_personas(slug,name),
      idea_box_items(id,idea_id,slot_index)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const ideaIds = deliveries?.flatMap((delivery) => delivery.idea_box_items?.map((item) => item.idea_id) ?? []) ?? [];
  const { data: cards } = ideaIds.length
    ? await supabase.from("idea_cards").select("idea_id,title,card").in("idea_id", ideaIds)
    : { data: [] };
  const cardByIdea = new Map(cards?.map((card) => [card.idea_id, card]) ?? []);

  const boxes: CreatorBox[] = (deliveries ?? []).map((delivery) => {
    const product = Array.isArray(delivery.box_products) ? delivery.box_products[0] : delivery.box_products;
    const category = Array.isArray(delivery.categories) ? delivery.categories[0] : delivery.categories;
    const persona = Array.isArray(delivery.creator_personas) ? delivery.creator_personas[0] : delivery.creator_personas;
    const metadata = (delivery.metadata ?? {}) as Record<string, unknown>;
    const items = [...(delivery.idea_box_items ?? [])]
      .sort((a, b) => a.slot_index - b.slot_index)
      .map((item) => {
        const card = cardByIdea.get(item.idea_id);
        const cardPayload = (card?.card ?? {}) as Record<string, unknown>;
        return {
          id: item.id,
          idea_id: item.idea_id,
          slot_index: item.slot_index,
          title: displayCardTitle(cardPayload, card?.title),
          premise: displayCardPremise(cardPayload),
        };
      });

    return {
      id: delivery.id,
      status: delivery.status,
      created_at: delivery.created_at,
      delivered_at: delivery.delivered_at,
      opened_at: typeof metadata.opened_at === "string" ? metadata.opened_at : null,
      product_name: product?.name ?? "Premium ViralBox",
      product_slug: product?.slug ?? "viral_box",
      category_name: category?.name ?? category?.slug ?? "Creator category",
      persona_name: persona?.name ?? persona?.slug ?? "Creator persona",
      items,
    };
  });

  return (
    <AppShell>
      <section className="mb-6 overflow-hidden rounded-md border border-ink/10 bg-ink p-6 text-white shadow-soft">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">Creator Vault</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">Your premium ViralBox collection</h1>
          <p className="mt-4 text-lg leading-8 text-white/70">
            Sealed boxes stay private until you choose to reveal them. Opened boxes keep your premium creator cards saved for planning, shooting and review.
          </p>
        </div>
      </section>

      {!boxes.length ? (
        <section className="rounded-md border border-ink/10 bg-white p-8 text-center shadow-soft">
          <h2 className="text-2xl font-semibold">Your vault is ready for its first box.</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink/60">Choose your creator lane, buy a ViralBox, and it will appear here as a sealed premium box.</p>
          <Link className="mt-6 inline-flex rounded-md bg-ink px-5 py-3 font-semibold text-white" href="/store">Browse ViralBox store</Link>
        </section>
      ) : (
        <CreativeDossierShelf boxes={boxes} />
      )}
    </AppShell>
  );
}