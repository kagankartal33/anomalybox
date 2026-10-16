import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CreativeDossierShelf, type CreatorBox } from "@/components/CreativeDossierShelf";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { displayCardPremise, displayCardTitle } from "@/lib/card-display";
import { premiumAssets } from "@/lib/premium-assets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      product_name: product?.name ?? "Shoot brief",
      product_slug: product?.slug ?? "viral_box",
      category_name: category?.name ?? category?.slug ?? "Creator category",
      persona_name: persona?.name ?? persona?.slug ?? "Creator persona",
      items,
    };
  });

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Creator Vault</p>
        <h1 className="mt-2 text-4xl font-semibold">Your briefs</h1>
        <p className="mt-2 max-w-2xl text-ink/70">
          Each brief keeps the lane and creator mode you bought. Changing your profile later does not rewrite what is already here.
        </p>
      </div>

      {!boxes.length ? (
        <section className="rounded-md border border-ink/10 bg-white p-8 text-center shadow-soft">
          <div className="relative mx-auto mb-5 h-40 w-full max-w-md">
            <Image
              src={premiumAssets.marketing.emptyVault}
              alt="An illustration of an empty vault — no briefs have been unlocked yet"
              fill
              sizes="400px"
              className="rounded-sm object-cover"
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">Empty vault</p>
          <h2 className="mt-2 text-2xl font-semibold">No creative briefs yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink/60">
            Your Creator Vault is empty. Configure a creative brief in Store with your lane and creator mode. Purchased and gifted briefs appear here secured until you choose to access them.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link className="focus-ring inline-flex rounded-md bg-ink px-5 py-3 font-semibold text-white" href="/store">
              Open Store
            </Link>
            <Link className="focus-ring inline-flex rounded-md border border-ink/15 px-5 py-3 font-semibold text-ink/75" href="/pricing">
              Compare creative brief packages
            </Link>
          </div>
        </section>
      ) : (
        <CreativeDossierShelf boxes={boxes} />
      )}
    </AppShell>
  );
}
