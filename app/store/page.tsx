import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { StoreConfigurator } from "@/components/StoreConfigurator";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "ViralBox Store | Choose Your Private Creator Box",
  description:
    "Explore Classic Red Box and SIGNATURE PURPLE BOX, then match your purchase to a creator lane and creator mode before checkout.",
  alternates: {
    canonical: "/store",
  },
};

type StoreSearchParams = {
  box?: string;
  category?: string;
  persona?: string;
  detail?: string;
  checkout?: string;
};

export default async function StorePage({ searchParams }: { searchParams: Promise<StoreSearchParams> }) {
  const params = await searchParams;
  const supabase = createSupabaseAdminClient();
  const [{ data: products }, { data: categories }, { data: personas }] = await Promise.all([
    supabase.from("box_products").select("slug,name,price_usd_cents,idea_count,metadata").eq("enabled", true).order("price_usd_cents"),
    supabase.from("categories").select("id,slug,name,family").eq("enabled", true).order("sort_order").limit(2000),
    supabase.from("creator_personas").select("id,slug,name,description,tags,metadata").eq("enabled", true).order("sort_order").limit(100),
  ]);

  const productRows = (products ?? []).map((product) => ({
    ...product,
    metadata: (product.metadata ?? null) as Record<string, unknown> | null,
  }));
  const categoryRows = categories ?? [];
  const personaRows = (personas ?? []).map((persona) => ({
    ...persona,
    metadata: (persona.metadata ?? null) as {
      audience_promise?: string;
      content_mechanics?: string[];
      visual_style?: string;
      best_categories?: string[];
    } | null,
  }));

  const initialProductSlug = productRows.some((product) => product.slug === params.box) ? String(params.box) : productRows[0]?.slug ?? "";
  const initialCategorySlug = categoryRows.some((category) => category.slug === params.category) ? String(params.category) : categoryRows[0]?.slug ?? "";
  const initialPersonaSlug = personaRows.some((persona) => persona.slug === params.persona) ? String(params.persona) : personaRows[0]?.slug ?? "";
  const initialContextDetail = String(params.detail ?? "").slice(0, 160);

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/40">ViralBox Store</p>
        <h1 className="mt-2 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-1px]">Choose the box, lane, and creator mode for this purchase.</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/66">
          Browse the Store before login. Checkout requires an account, and your selected lane and creator mode are preserved when you sign in.
        </p>
        {params.checkout === "1" ? (
          <div className="mt-5 rounded-md border border-teal/20 bg-teal/8 p-4 text-sm leading-6 text-ink/70">
            Your box selection is still here. Sign-in is complete, so you can review the match and open secure checkout.
          </div>
        ) : null}
      </div>

      <StoreConfigurator
        products={productRows}
        categories={categoryRows}
        personas={personaRows}
        initialProductSlug={initialProductSlug}
        initialCategorySlug={initialCategorySlug}
        initialPersonaSlug={initialPersonaSlug}
        initialContextDetail={initialContextDetail}
      />
    </AppShell>
  );
}