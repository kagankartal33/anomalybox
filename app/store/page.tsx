import type { Metadata } from "next";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { PublicShell } from "@/components/PublicShell";
import { StoreConfigurator } from "@/components/StoreConfigurator";
import { listPurchaseLaneModeCounts } from "@/lib/inventory";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Anomaly Box Store | Choose Your Creative Brief",
  description:
    "Pick Classic Red or Signature Purple, then one lane and one creator mode. Checkout stays closed if that match is out of stock.",
  alternates: {
    canonical: "/store",
  },
};

export const revalidate = 60;

const getStoreCatalog = unstable_cache(
  async () => {
    const supabase = createSupabaseAdminClient();
    const [{ data: products }, { data: categories }, { data: personas }] = await Promise.all([
      supabase.from("box_products").select("slug,name,price_usd_cents,idea_count,allocation,metadata").eq("enabled", true).order("price_usd_cents"),
      supabase.from("categories").select("id,slug,name,family").eq("enabled", true).order("sort_order").limit(2000),
      supabase.from("creator_personas").select("id,slug,name,description,tags,metadata").eq("enabled", true).order("sort_order").limit(100),
    ]);
    return { products: products ?? [], categories: categories ?? [], personas: personas ?? [] };
  },
  ["store-catalog"],
  { revalidate: 120 },
);

const getStoreGrid = unstable_cache(
  async () => {
    const cells = await listPurchaseLaneModeCounts();
    const grid: Record<string, number> = {};
    for (const cell of cells) grid[`${cell.categorySlug}:${cell.personaSlug}`] = cell.highCount;
    return grid;
  },
  ["store-availability-grid"],
  { revalidate: 60 },
);

export default async function StorePage() {
  const [{ products, categories, personas }, initialGrid] = await Promise.all([getStoreCatalog(), getStoreGrid()]);

  const productRows = products.map((product) => ({
    ...product,
    metadata: (product.metadata ?? null) as Record<string, unknown> | null,
  }));
  const categoryRows = categories;
  const personaRows = personas.map((persona) => ({
    ...persona,
    metadata: (persona.metadata ?? null) as {
      audience_promise?: string;
      content_mechanics?: string[];
      visual_style?: string;
      best_categories?: string[];
    } | null,
  }));

  return (
    <PublicShell>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Anomaly Box Store</p>
        <h1 className="mt-2 max-w-4xl text-4xl font-semibold leading-[1.04] sm:text-5xl">Pick a package, a lane, and a creator mode.</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/66">
          You can browse without an account. Sign-in is required to pay. Your lane and mode stay attached if you log in mid-checkout.
        </p>
      </div>

      <Suspense fallback={<div className="rounded-md border border-ink/10 bg-white p-8 text-sm text-ink/60">Loading store options.</div>}>
        <StoreConfigurator
          products={productRows}
          categories={categoryRows}
          personas={personaRows}
          initialProductSlug={productRows[0]?.slug ?? ""}
          initialCategorySlug={categoryRows[0]?.slug ?? ""}
          initialPersonaSlug={personaRows[0]?.slug ?? ""}
          initialContextDetail=""
          initialGrid={initialGrid}
        />
      </Suspense>
    </PublicShell>
  );
}
