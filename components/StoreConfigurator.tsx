"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CakeSlice,
  Camera,
  Check,
  Clapperboard,
  Coffee,
  Compass,
  Cpu,
  Crown,
  Gem,
  GraduationCap,
  HeartHandshake,
  LockKeyhole,
  PackageCheck,
  Palette,
  Radio,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { PremiumIcon } from "@/components/PremiumIcon";
import { CreativeDossierVisual, type CreativeDossierVariant } from "@/components/CreativeDossierVisual";
import { money } from "@/lib/format";
import {
  categoryBucket,
  categoryText,
  cuisineFromQuery,
  filterStoreCategories,
  isCanonicalRestaurant,
  premiumCategoryLabel,
  titleCase,
} from "@/lib/store-category-search";

type ProductOption = {
  slug: string;
  name: string;
  price_usd_cents: number;
  idea_count: number;
  metadata: Record<string, unknown> | null;
};

type CategoryOption = {
  id: string;
  slug: string;
  name: string;
  family: string | null;
};

type PersonaOption = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tags?: string[] | null;
  metadata?: {
    audience_promise?: string;
    content_mechanics?: string[];
    visual_style?: string;
    best_categories?: string[];
  } | null;
};

type Availability = {
  ok: boolean;
  missing: string[];
  counts: Record<string, number>;
};

type AvailabilityState = Availability & {
  key: string;
};

type Visual = {
  Icon: LucideIcon;
  label: string;
  tone: string;
};

const filterTabs = [
  { key: "all", label: "All" },
  { key: "beauty", label: "Beauty" },
  { key: "fashion", label: "Style" },
  { key: "food", label: "Food" },
  { key: "travel", label: "Travel" },
  { key: "education", label: "Learn" },
  { key: "entertainment", label: "Culture" },
  { key: "commerce", label: "Commerce" },
  { key: "business", label: "Business" },
];

function laneVisual(category?: CategoryOption | null): Visual {
  if (!category) return { Icon: Compass, label: "Creator lane", tone: "bg-ink text-white" };
  const text = categoryText(category);
  if (/coffee|cafe|espresso|roaster|tea/.test(text)) return { Icon: Coffee, label: "Cafe atmosphere", tone: "bg-[#6B3F2A] text-white" };
  if (/bakery|dessert|cake|pastry|baking|chocolate|ice cream/.test(text)) return { Icon: CakeSlice, label: "Texture proof", tone: "bg-[#A64B5B] text-white" };
  if (/restaurant|food|recipe|cooking|dining|pizza|sushi|brunch|kitchen|bar|tapas/.test(text)) return { Icon: Utensils, label: "Dining signal", tone: "bg-[#8A4B1F] text-white" };
  if (/makeup|beauty|skin|hair|salon|cosmetic|spa|nail|lash|brow|fragrance/.test(text)) return { Icon: Sparkles, label: "Visual proof", tone: "bg-[#B42335] text-white" };
  if (/fashion|style|clothing|jewelry|watch|shoe|boutique|streetwear|luxury|outfit/.test(text)) return { Icon: Gem, label: "Taste authority", tone: "bg-[#5B2A86] text-white" };
  if (/hotel|resort|travel|tour|tourism|city|museum|park|venue|nomad/.test(text)) return { Icon: Compass, label: "Place narrative", tone: "bg-teal text-white" };
  if (/fitness|sports|athlete|running|marathon|pilates|yoga|workout|wellness/.test(text)) return { Icon: Activity, label: "Performance clarity", tone: "bg-[#244D48] text-white" };
  if (/author|book|booktok|reading|writer|literary/.test(text)) return { Icon: BookOpen, label: "Narrative taste", tone: "bg-[#3B3B5C] text-white" };
  if (/education|school|course|coach|training|tutorial|learning/.test(text)) return { Icon: GraduationCap, label: "Expert clarity", tone: "bg-ink text-white" };
  if (/science|tech|ai|software|gadget|future/.test(text)) return { Icon: Cpu, label: "Smart simplifier", tone: "bg-[#243B53] text-white" };
  if (/comedy|entertainment|film|cinema|theater|music|artist|gaming|podcast|dance/.test(text)) return { Icon: Clapperboard, label: "Culture signal", tone: "bg-[#7A2E52] text-white" };
  if (/shop|store|commerce|product|retail|affiliate|market|supply|ecommerce/.test(text)) return { Icon: ShoppingBag, label: "Buyer confidence", tone: "bg-[#A52434] text-white" };
  if (category.family === "instagram_business") return { Icon: ShieldCheck, label: "Service positioning", tone: "bg-[#243B53] text-white" };
  return { Icon: Camera, label: "Creator signal", tone: "bg-teal text-white" };
}

function laneHint(category: CategoryOption, contextDetail: string) {
  const bucket = categoryBucket(category);
  if (bucket === "food") return contextDetail ? `Uses ${contextDetail} as the concept nuance while matching broad food inventory.` : "Menu logic, sensory proof, atmosphere, and saveable reasons to visit.";
  if (bucket === "beauty") return "Texture, routine, close-up proof, and a believable beauty decision.";
  if (bucket === "fashion") return "Taste filters, outfit logic, status cues, and editorial visual rhythm.";
  if (bucket === "travel") return "Arrival hooks, place details, route logic, and useful emotional proof.";
  if (bucket === "education") return "A clear framework your audience can save, repeat, or trust.";
  if (bucket === "commerce") return "Decision filters and product proof without making the post feel like a hard sell.";
  if (bucket === "entertainment") return "Timing, reaction, payoff, and comment-first audience behavior.";
  return "A focused lane match for the content your audience already expects from you.";
}

function personaVisual(persona: PersonaOption): Visual {
  const map: Record<string, Visual> = {
    luxury_editor: { Icon: Gem, label: "Quiet authority", tone: "bg-[#5B2A86] text-white" },
    relatable_lifestyle: { Icon: HeartHandshake, label: "Human closeness", tone: "bg-[#A64B5B] text-white" },
    expert_guide: { Icon: GraduationCap, label: "Clear expertise", tone: "bg-ink text-white" },
    beauty_tester: { Icon: Sparkles, label: "Proof-led beauty", tone: "bg-[#B42335] text-white" },
    travel_curator: { Icon: Compass, label: "Place curation", tone: "bg-teal text-white" },
    comedy_observer: { Icon: Clapperboard, label: "Timing and turn", tone: "bg-[#7A2E52] text-white" },
    product_reviewer: { Icon: BadgeCheck, label: "Decision proof", tone: "bg-[#A52434] text-white" },
    creator_teacher: { Icon: BookOpen, label: "Teaching rhythm", tone: "bg-[#243B53] text-white" },
    cinematic_storyteller: { Icon: Camera, label: "Cinematic arc", tone: "bg-[#3B3B5C] text-white" },
    founder_operator: { Icon: BriefcaseBusiness, label: "Operator clarity", tone: "bg-[#1F3A44] text-white" },
    live_community_host: { Icon: Radio, label: "Live community", tone: "bg-[#6B3F2A] text-white" },
    performance_athlete: { Icon: Activity, label: "Performance proof", tone: "bg-[#244D48] text-white" },
    artist_worldbuilder: { Icon: Palette, label: "Visual world", tone: "bg-[#7B3F71] text-white" },
    food_experience_maker: { Icon: Utensils, label: "Sensory experience", tone: "bg-[#8A4B1F] text-white" },
    style_strategist: { Icon: Crown, label: "Style strategy", tone: "bg-[#5B2A86] text-white" },
    science_tech_explainer: { Icon: Cpu, label: "Smart explanation", tone: "bg-[#243B53] text-white" },
  };
  return map[persona.slug] ?? { Icon: Sparkles, label: "Creator mode", tone: "bg-teal text-white" };
}

function personaHint(persona: PersonaOption) {
  return persona.description ?? persona.metadata?.audience_promise ?? "Shapes voice, pacing, visual grammar, and audience promise.";
}

function productVariant(product: ProductOption): CreativeDossierVariant {
  return product.slug.includes("1000") ? "purple" : "red";
}

function productEyebrow(product: ProductOption) {
  return product.slug.includes("1000") ? "SIGNATURE PURPLE BOX" : "Classic Red Box";
}

function productDescription(product: ProductOption) {
  if (typeof product.metadata?.short_description === "string") return product.metadata.short_description;
  if (product.slug.includes("1000")) return "5 private strategy cards with deeper execution direction, brand-lift framing, and launch-ready creative angles.";
  return "2 private creator cards calibrated to your lane, creator mode, and production style.";
}

export function StoreConfigurator({
  products,
  categories,
  personas,
  initialProductSlug,
  initialCategorySlug,
  initialPersonaSlug,
  initialContextDetail,
}: {
  products: ProductOption[];
  categories: CategoryOption[];
  personas: PersonaOption[];
  initialProductSlug: string;
  initialCategorySlug: string;
  initialPersonaSlug: string;
  initialContextDetail: string;
}) {
  const [selectedProductSlug, setSelectedProductSlug] = useState(initialProductSlug);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(initialCategorySlug);
  const [selectedPersonaSlug, setSelectedPersonaSlug] = useState(initialPersonaSlug);
  const [contextDetail, setContextDetail] = useState(initialContextDetail);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [availability, setAvailability] = useState<AvailabilityState | null>(null);

  const selectedProduct = products.find((product) => product.slug === selectedProductSlug) ?? products[0];
  const selectedCategory = categories.find((category) => category.slug === selectedCategorySlug) ?? categories[0];
  const selectedPersona = personas.find((persona) => persona.slug === selectedPersonaSlug) ?? personas[0];
  const selectedVariant = selectedProduct ? productVariant(selectedProduct) : "red";
  const availabilityKey = selectedProduct && selectedCategory && selectedPersona ? `${selectedProduct.slug}:${selectedCategory.slug}:${selectedPersona.slug}` : "";
  const checking = !availability || availability.key !== availabilityKey;
  const cuisineQuery = cuisineFromQuery(query);
  const restaurantCategory = useMemo(
    () => categories.find(isCanonicalRestaurant) ?? categories.find((category) => categoryBucket(category) === "food" && categoryText(category).includes("restaurant")),
    [categories],
  );

  const filteredCategories = useMemo(() => {
    return filterStoreCategories(categories, query, filter, cuisineQuery, restaurantCategory?.slug).slice(0, 180);
  }, [categories, cuisineQuery, filter, query, restaurantCategory?.slug]);

  const selectedBucket = selectedCategory ? categoryBucket(selectedCategory) : "";
  const shouldShowContext = selectedBucket === "food" || Boolean(cuisineQuery);

  useEffect(() => {
    if (!selectedProduct || !selectedCategory || !selectedPersona) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      box_product_slug: selectedProduct.slug,
      category_slug: selectedCategory.slug,
      persona_slug: selectedPersona.slug,
    });
    fetch(`/api/store/availability?${params.toString()}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: Availability) => setAvailability({ ...data, key: availabilityKey }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setAvailability({ ok: false, missing: ["availability check failed"], counts: {}, key: availabilityKey });
      })
    return () => controller.abort();
  }, [availabilityKey, selectedProduct, selectedCategory, selectedPersona]);

  function useCuisineAsRestaurant() {
    const cuisine = cuisineQuery ? titleCase(cuisineQuery) : contextDetail;
    if (cuisine) setContextDetail(cuisine);
    if (restaurantCategory) {
      setSelectedCategorySlug(restaurantCategory.slug);
      setFilter("food");
    }
  }

  if (!selectedProduct || !selectedCategory || !selectedPersona) {
    return (
      <div className="rounded-md border border-ink/10 bg-white p-8 text-center shadow-soft">
        Store setup is incomplete. Add at least one enabled product, category, and creator mode.
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
      <div className="grid min-w-0 gap-6">
        <section className="min-w-0 overflow-hidden rounded-md border border-ink/10 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">Step 1</p>
              <h2 className="mt-2 text-2xl font-semibold">Choose your private creative dossier.</h2>
            </div>
            <div className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink/55">Checkout requires login</div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {products.map((product) => {
              const selected = product.slug === selectedProduct.slug;
              const variant = productVariant(product);
              const tone = variant === "purple" ? "purple" : "red";
              return (
                <button
                  key={product.slug}
                  className={`group w-full min-w-0 overflow-hidden rounded-md border p-5 text-left transition hover:-translate-y-0.5 ${
                    selected ? "border-ink bg-ink text-white shadow-soft" : "border-ink/10 bg-[#fbfaf6] hover:border-ink/25"
                  }`}
                  type="button"
                  onClick={() => setSelectedProductSlug(product.slug)}
                >
                  <div className="grid gap-4 sm:grid-cols-[130px_1fr] sm:items-center">
                    <div className="min-w-0 rounded-md bg-white">
                      <CreativeDossierVisual variant={variant} itemCount={product.idea_count} size="sm" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className={`inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${selected ? "bg-white/10 text-white/70" : "bg-white text-ink/55"}`}>
                          <PremiumIcon icon={variant === "purple" ? Crown : Gem} size="sm" tone={tone} />
                          {productEyebrow(product)}
                        </div>
                        <span className={`grid h-7 w-7 place-items-center rounded-full border ${selected ? "border-white/30 bg-white text-ink" : "border-ink/15 text-transparent"}`}>
                          <Check className="h-4 w-4" />
                        </span>
                      </div>
                      <h3 className="mt-4 text-xl font-semibold">{productEyebrow(product)}</h3>
                      <p className={`mt-1 text-sm leading-6 ${selected ? "text-white/66" : "text-ink/60"}`}>{productDescription(product)}</p>
                      <div className={`mt-3 text-2xl font-semibold ${selected ? "text-white" : "text-ink"}`}>{money(product.price_usd_cents)}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-md border border-ink/10 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">Step 2</p>
          <h2 className="mt-2 text-2xl font-semibold">Select one purchase lane.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">This lane is locked to the dossier you buy. Future Store selections will not change secured or available dossiers already in your vault.</p>

          <div className="mt-5 rounded-md border border-ink/10 bg-[#fbfaf6] p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
              <input
                className="focus-ring w-full rounded-md border border-ink/15 bg-white py-3 pl-10 pr-3 text-sm"
                placeholder="Search yacht, yat, tekne, luxury travel, restaurant, beauty..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`focus-ring shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    filter === tab.key ? "border-ink bg-ink text-white" : "border-ink/10 bg-white text-ink/65 hover:border-ink/25"
                  }`}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {cuisineQuery ? (
              <div className="mt-4 rounded-md border border-[#8A4B1F]/20 bg-[#fff8ef] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm leading-6 text-ink/65">
                    Use Restaurant as the main lane and keep <span className="font-semibold text-ink">{titleCase(cuisineQuery)}</span> as the cuisine or concept detail.
                  </p>
                  <button className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="button" onClick={useCuisineAsRestaurant}>
                    Use Restaurant + {titleCase(cuisineQuery)}
                  </button>
                </div>
              </div>
            ) : null}

            {shouldShowContext ? (
              <label className="mt-4 grid gap-2 text-sm font-semibold">
                Cuisine or niche detail
                <input
                  className="focus-ring rounded-md border border-ink/15 bg-white px-3 py-3 font-normal"
                  value={contextDetail}
                  onChange={(event) => setContextDetail(event.target.value)}
                  placeholder="Turkish, Japanese, vegan tasting menu, hotel breakfast..."
                />
                <span className="text-xs font-normal leading-5 text-ink/50">This personalizes the purchase context. It does not create a separate category.</span>
              </label>
            ) : null}

            <div className="mt-5 grid max-h-[520px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCategories.map((category) => {
                const selected = category.slug === selectedCategory.slug;
                const visual = laneVisual(category);
                const Icon = visual.Icon;
                return (
                  <button
                    key={category.id}
                    className={`focus-ring rounded-md border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 ${
                      selected ? "border-teal ring-2 ring-teal/15" : "border-ink/10 hover:border-ink/25"
                    }`}
                    type="button"
                    onClick={() => setSelectedCategorySlug(category.slug)}
                  >
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${visual.tone}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold leading-5">{premiumCategoryLabel(category)}</h3>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ink/35">{visual.label}</p>
                        </div>
                      </div>
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${selected ? "border-teal bg-teal text-white" : "border-ink/15 text-transparent"}`}>
                        <Check className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink/60">{laneHint(category, contextDetail)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-md border border-ink/10 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">Step 3</p>
          <h2 className="mt-2 text-2xl font-semibold">Choose your creator mode.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">Your creator mode shapes the rhythm, visual grammar, audience promise, and strategic angle of every brief in this dossier.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {personas.map((persona) => {
              const selected = persona.slug === selectedPersona.slug;
              const visual = personaVisual(persona);
              const Icon = visual.Icon;
              return (
                <button
                  key={persona.id}
                  className={`focus-ring rounded-md border p-4 text-left transition hover:-translate-y-0.5 ${
                    selected ? "border-ink bg-ink text-white shadow-soft" : "border-ink/10 bg-[#fbfaf6] hover:border-ink/25"
                  }`}
                  type="button"
                  onClick={() => setSelectedPersonaSlug(persona.slug)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${selected ? "bg-white text-ink" : visual.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold">{persona.name}</h3>
                        <p className={`mt-1 text-[11px] uppercase tracking-[0.12em] ${selected ? "text-white/45" : "text-ink/35"}`}>{visual.label}</p>
                      </div>
                    </div>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${selected ? "border-white/30 bg-white text-ink" : "border-ink/15 text-transparent"}`}>
                      <Check className="h-4 w-4" />
                    </span>
                  </div>
                  <p className={`mt-3 text-sm leading-6 ${selected ? "text-white/66" : "text-ink/60"}`}>{personaHint(persona)}</p>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-md border border-ink/10 bg-white shadow-soft">
          <div className={`p-6 ${selectedVariant === "purple" ? "bg-[radial-gradient(circle_at_50%_0%,#F3E8FF_0%,#FFFFFF_48%,#F7F5EF_100%)]" : "bg-[radial-gradient(circle_at_50%_0%,#FFE6DD_0%,#FFFFFF_48%,#F7F5EF_100%)]"}`}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/55 shadow-sm">
              <PremiumIcon icon={selectedVariant === "purple" ? Crown : Gem} size="sm" tone={selectedVariant === "purple" ? "purple" : "red"} />
              {productEyebrow(selectedProduct)}
            </div>
            <CreativeDossierVisual variant={selectedVariant} itemCount={selectedProduct.idea_count} className="mt-4" />
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">{productEyebrow(selectedProduct)}</h2>
                <p className="mt-1 text-sm leading-6 text-ink/60">{productDescription(selectedProduct)}</p>
              </div>
              <div className="text-2xl font-semibold">{money(selectedProduct.price_usd_cents)}</div>
            </div>

            <div className="mt-5 grid gap-3 text-sm">
              <div className="rounded-md border border-ink/10 bg-paper p-3">
                <div className="font-semibold">Purchase lane</div>
                <div className="mt-1 text-ink/60">{selectedCategory.name}</div>
              </div>
              <div className="rounded-md border border-ink/10 bg-paper p-3">
                <div className="font-semibold">Creator mode</div>
                <div className="mt-1 text-ink/60">{selectedPersona.name}</div>
              </div>
              {contextDetail ? (
                <div className="rounded-md border border-ink/10 bg-paper p-3">
                  <div className="font-semibold">Context detail</div>
                  <div className="mt-1 text-ink/60">{contextDetail}</div>
                </div>
              ) : null}
            </div>

            <div className="mt-5 rounded-md border border-ink/10 bg-[#fbfaf6] p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <PackageCheck className="h-4 w-4 text-teal" />
                Availability
              </div>
              <p className="mt-1 text-ink/60">
                {checking ? "Checking this exact dossier match..." : availability?.ok ? "Available for this lane and creator mode." : "Temporarily unavailable for this match."}
              </p>
            </div>

            <div className="mt-5">
              <CheckoutButton
                boxProductSlug={selectedProduct.slug}
                categorySlug={selectedCategory.slug}
                personaSlug={selectedPersona.slug}
                contextDetail={contextDetail}
                disabled={checking || !availability?.ok}
                label={`Open secure checkout for ${productEyebrow(selectedProduct)}`}
              />
            </div>

            <div className="mt-5 grid gap-2 text-xs leading-5 text-ink/52">
              <div className="flex gap-2"><LockKeyhole className="mt-0.5 h-3.5 w-3.5" /> Your dossier enters Creator Vault secured after purchase.</div>
              <div className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5" /> Private card details stay inside your Creator Vault.</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}