"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { PremiumIcon } from "@/components/PremiumIcon";
import { CreativeDossierVisual, type CreativeDossierVariant } from "@/components/CreativeDossierVisual";
import { SampleBriefModal } from "@/components/SampleBriefModal";
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
  const slug = category.slug;
  if (slug === "beauty") return "Skin, product, and a test you can see in close-up.";
  if (slug === "fashion") return "Cut, fabric, and what to remove before you add anything.";
  if (slug === "travel") return "Light hour, route, and the place itself — not the lobby.";
  if (slug === "food") return contextDetail ? `Keep ${contextDetail} in the frame, not only in the caption.` : "Board, steam, menu, and why someone would book the table.";
  if (slug === "fitness_wellness_safe") return "One joint, one cue, no miracle body claim.";
  if (slug === "parenting_family") return "The parent process. No child face in a hard minute.";
  if (slug === "creator_education") return "One template or rule the viewer can copy onto paper.";
  if (slug === "entertainment_comedy") return "A procedure or rule to roast. Not a person.";
  if (slug === "thought_leadership") return "A dated number or failing cell, then the decision.";
  if (slug === "commerce_affiliate") return "A fail test on camera, then the honest limit.";
  if (slug === "luxury") return "Weight, grain, and silence. No price talk.";
  if (slug === "lifestyle") return "One daily object and the leak it stops.";
  const bucket = categoryBucket(category);
  if (bucket === "food") return contextDetail ? `Keep ${contextDetail} in the frame, not only in the caption.` : "Board, steam, menu, and why someone would book the table.";
  if (bucket === "beauty") return "Skin, product, and a test you can see in close-up.";
  if (bucket === "fashion") return "Cut, fabric, and what to remove before you add anything.";
  if (bucket === "travel") return "Light hour, route, and the place itself — not the lobby.";
  if (bucket === "education") return "One template or rule the viewer can copy onto paper.";
  if (bucket === "commerce") return "A fail test on camera, then the honest limit.";
  if (bucket === "entertainment") return "A procedure or rule to roast. Not a person.";
  return "Briefs written for this lane, not a generic prompt.";
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
  return persona.description ?? persona.metadata?.audience_promise ?? "How you talk, move, and hold the camera in this brief.";
}

function productVariant(product: ProductOption): CreativeDossierVariant {
  return product.slug.includes("1000") ? "purple" : "red";
}

function productEyebrow(product: ProductOption) {
  return product.slug.includes("1000") ? "SIGNATURE PURPLE BOX" : "Classic Red Box";
}

function productDescription(product: ProductOption) {
  if (typeof product.metadata?.short_description === "string") return product.metadata.short_description;
  if (product.slug.includes("1000")) return "Five shoot briefs with deeper scene flow and evidence structure for this lane and mode.";
  return "Two shoot briefs for the lane and creator mode you pick.";
}

export function StoreConfigurator({
  products,
  categories,
  personas,
  initialProductSlug,
  initialCategorySlug,
  initialPersonaSlug,
  initialContextDetail,
  initialGrid = {},
}: {
  products: ProductOption[];
  categories: CategoryOption[];
  personas: PersonaOption[];
  initialProductSlug: string;
  initialCategorySlug: string;
  initialPersonaSlug: string;
  initialContextDetail: string;
  initialGrid?: Record<string, number>;
}) {
  const searchParams = useSearchParams();
  const boxParam = searchParams.get("box") ?? "";
  const categoryParam = searchParams.get("category") ?? "";
  const personaParam = searchParams.get("persona") ?? "";
  const detailParam = (searchParams.get("detail") ?? "").slice(0, 160);
  const checkoutParam = searchParams.get("checkout") === "1";

  const [selectedProductSlug, setSelectedProductSlug] = useState(() => {
    if (boxParam && products.some((product) => product.slug === boxParam)) return boxParam;
    return initialProductSlug;
  });
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(() => {
    if (categoryParam && categories.some((item) => item.slug === categoryParam)) return categoryParam;
    return initialCategorySlug;
  });
  const [selectedPersonaSlug, setSelectedPersonaSlug] = useState(() => {
    if (personaParam && personas.some((item) => item.slug === personaParam)) return personaParam;
    return initialPersonaSlug;
  });
  const [contextDetail, setContextDetail] = useState(() => {
    if (detailParam) return detailParam;
    return initialContextDetail;
  });
  const [checkoutResume] = useState(checkoutParam);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [availability, setAvailability] = useState<AvailabilityState | null>(null);
  const [grid, setGrid] = useState<Record<string, number>>(initialGrid);
  const [gridNeeded, setGridNeeded] = useState(2);
  const [gridLoaded, setGridLoaded] = useState(Object.keys(initialGrid).length > 0);

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

  const neededHigh = Number(selectedProduct?.idea_count ?? (Object.keys(initialGrid).length ? Number(selectedProduct?.idea_count ?? 2) : gridNeeded));

  function cellKey(categorySlug: string, personaSlug: string) {
    return `${categorySlug}:${personaSlug}`;
  }

  function cellCount(categorySlug: string, personaSlug: string) {
    const value = grid[cellKey(categorySlug, personaSlug)];
    return typeof value === "number" ? value : null;
  }

  useEffect(() => {
    if (Object.keys(initialGrid).length || !selectedProduct) return;
    const controller = new AbortController();
    fetch(`/api/store/availability-grid?box_product_slug=${encodeURIComponent(selectedProduct.slug)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { needed_high?: number; cells?: Array<{ category_slug: string; persona_slug: string; high_count: number }> }) => {
        const next: Record<string, number> = {};
        for (const cell of data.cells ?? []) next[cellKey(cell.category_slug, cell.persona_slug)] = Number(cell.high_count || 0);
        setGrid(next);
        if (Number(data.needed_high)) setGridNeeded(Number(data.needed_high));
        setGridLoaded(true);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setGrid({});
        setGridLoaded(true);
      });
    return () => controller.abort();
  }, [initialGrid, selectedProduct]);

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
    <div className="grid min-w-0 gap-8">
      {checkoutResume ? (
        <div className="rounded-md border border-teal/20 bg-teal/10 p-4 text-sm leading-6 text-ink/70">
          Your creative brief selection is still here. Sign-in is complete, so you can review the match and open secure checkout.
        </div>
      ) : null}
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
      <div className="grid min-w-0 gap-6">
        <section className="min-w-0 overflow-hidden rounded-md border border-ink/10 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">Step 1</p>
              <h2 className="mt-2 text-2xl font-semibold">Choose your package.</h2>
            </div>
            <SampleBriefModal triggerVariant="badge" triggerLabel="Inspect Sample Brief" />
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">Step 2</p>
              <h2 className="mt-2 text-2xl font-semibold">Choose your purchase lane.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">Search by handle, niche, or topic. The brief pool matches this choice.</p>
            </div>
            <div className="text-xs font-semibold text-ink/60">
              {filteredCategories.length} {filteredCategories.length === 1 ? "lane" : "lanes"}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input
                aria-label="Filter creator lanes"
                className="focus-ring w-full rounded-md border border-ink/15 bg-white py-2.5 pl-9 pr-8 text-sm placeholder:text-ink/40"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by topic, handle, or style (e.g. coffee, fashion, tech)..."
                type="search"
                value={query}
              />
              {query ? (
                <button
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                  onClick={() => setQuery("")}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Lane families">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={filter === tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filter === tab.key
                      ? "bg-ink text-white"
                      : "bg-[#f4f2eb] text-ink/60 hover:bg-ink/10 hover:text-ink"
                  }`}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
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
              <span className="text-xs font-normal leading-5 text-ink/60">This stays as a note on the order. It does not become its own lane.</span>
            </label>
          ) : null}

          <div className="mt-5">
            <div className="grid max-h-[380px] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredCategories.length === 0 ? (
                <div className="col-span-full py-8 text-center text-sm text-ink/60">
                  No lanes match &ldquo;{query}&rdquo;. Try another search term or browse the tabs above.
                </div>
              ) : (
                filteredCategories.map((category) => {
                  const selected = category.slug === selectedCategory.slug;
                  const visual = laneVisual(category);
                  const Icon = visual.Icon;
                  const stockCount = cellCount(category.slug, selectedPersona.slug);
                  const known = typeof stockCount === "number";
                  const inStock = known ? stockCount >= neededHigh : true;
                  return (
                    <button
                      key={category.id}
                      className={`focus-ring rounded-md border p-3 text-left transition hover:-translate-y-0.5 ${
                        selected ? "border-ink bg-ink text-white shadow-soft" : "border-ink/10 bg-[#fbfaf6] hover:border-ink/25"
                      } ${!inStock && !selected ? "opacity-70" : ""}`}
                      type="button"
                      onClick={() => setSelectedCategorySlug(category.slug)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${selected ? "bg-white text-ink" : visual.tone}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">{premiumCategoryLabel(category)}</h3>
                            <p className={`mt-0.5 text-[11px] uppercase tracking-[0.12em] ${selected ? "text-white/45" : "text-ink/35"}`}>{visual.label}</p>
                          </div>
                        </div>
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${selected ? "border-white/30 bg-white text-ink" : "border-ink/15 text-transparent"}`}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <p className={`mt-2 text-xs leading-relaxed line-clamp-2 ${selected ? "text-white/65" : "text-ink/60"}`}>
                        {laneHint(category, contextDetail)}
                      </p>
                      <p className={`mt-2 text-xs font-semibold uppercase tracking-[0.12em] ${selected ? "text-white/45" : !gridLoaded ? "text-ink/40" : inStock ? "text-teal" : "text-coral"}`}>
                        {!gridLoaded
                          ? "Checking stock"
                          : known
                            ? inStock
                              ? "In stock for this lane"
                              : "No unused briefs for this lane"
                            : "Select to confirm stock"}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-md border border-ink/10 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">Step 3</p>
          <h2 className="mt-2 text-2xl font-semibold">Choose your creator mode.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">Creator mode is how you talk and hold the camera. The briefs follow that, not a generic host voice.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {personas.map((persona) => {
              const selected = persona.slug === selectedPersona.slug;
              const visual = personaVisual(persona);
              const Icon = visual.Icon;
              const stockCount = cellCount(selectedCategory.slug, persona.slug);
              const known = typeof stockCount === "number";
              const inStock = known ? stockCount >= neededHigh : true;
              return (
                <button
                  key={persona.id}
                  className={`focus-ring rounded-md border p-4 text-left transition hover:-translate-y-0.5 ${
                    selected ? "border-ink bg-ink text-white shadow-soft" : "border-ink/10 bg-[#fbfaf6] hover:border-ink/25"
                  } ${!inStock && !selected ? "opacity-70" : ""}`}
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
                  <p className={`mt-2 text-xs font-semibold uppercase tracking-[0.12em] ${selected ? "text-white/45" : !gridLoaded ? "text-ink/40" : inStock ? "text-teal" : "text-coral"}`}>
                    {!gridLoaded
                      ? "Checking stock"
                      : known
                        ? inStock
                          ? "In stock for this lane"
                          : "No unused briefs for this lane"
                        : "Select to confirm stock"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <aside id="store-checkout-panel" className="scroll-mt-24 min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-md border border-ink/10 bg-white shadow-soft">
          <div className={`p-6 ${selectedVariant === "purple" ? "bg-[radial-gradient(circle_at_50%_0%,#F3E8FF_0%,#FFFFFF_48%,#F7F5EF_100%)]" : "bg-[radial-gradient(circle_at_50%_0%,#FFE6DD_0%,#FFFFFF_48%,#F7F5EF_100%)]"}`}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/60 shadow-sm">
              <PremiumIcon icon={selectedVariant === "purple" ? Crown : Gem} size="sm" tone={selectedVariant === "purple" ? "purple" : "red"} />
              {productEyebrow(selectedProduct)}
            </div>
            <CreativeDossierVisual variant={selectedVariant} itemCount={selectedProduct.idea_count} className="mt-4" />
          </div>
          <div className="p-6">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{productEyebrow(selectedProduct)}</h2>
                <p className="mt-1 text-sm leading-6 text-ink/60">{productDescription(selectedProduct)}</p>
              </div>
              <div className="text-2xl font-semibold">{money(selectedProduct.price_usd_cents)}</div>
            </div>

            <div className="mt-5 grid gap-3 text-sm">
              <div className="rounded-md border border-ink/10 bg-paper p-3">
                <div className="font-semibold">Purchase lane</div>
                <div className="mt-1 text-ink/60">{premiumCategoryLabel(selectedCategory)}</div>
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
                {checking
                  ? "Checking this exact lane and creator mode..."
                  : availability?.ok
                    ? "Enough unused high-quality briefs for this lane and creator mode."
                    : "This lane and creator mode do not have enough unused briefs. Checkout stays closed."}
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

            <div className="mt-3 flex justify-center">
              <SampleBriefModal
                triggerVariant="link"
                triggerLabel="Preview sample brief format"
                triggerClassName="text-xs font-semibold text-ink/70 hover:text-black underline underline-offset-4 transition inline-flex items-center gap-1.5"
              />
            </div>

            {/* Atelier Guarantees & Objection Handling */}
            <div className="mt-5 rounded-lg border border-ink/10 bg-[#FAF9F5] p-3.5 text-xs text-ink/70 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-plum-deep" />
                <div>
                  <strong className="text-ink">Weak Card Guarantee:</strong> If any brief doesn&apos;t fit your creator voice, flag it in Creator Vault for a replacement.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
                <div>
                  <strong className="text-ink">Solo Mobile Ready:</strong> Framed for 1-person phone shooting. No expensive studio crew needed.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <div>
                  <strong className="text-ink">Instant Vault Delivery:</strong> Digital brief card unlocks securely in your account immediately after payment.
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-xs leading-5 text-ink/52">
              <div className="flex gap-2"><LockKeyhole className="mt-0.5 h-3.5 w-3.5" /> Your digital creative brief is delivered securely to Creator Vault after purchase.</div>
              <div className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5" /> Private brief details stay inside your Creator Vault.</div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    {/* Mobile Floating Action Dock (visible only on < lg screens) */}
    <div className="sticky bottom-4 z-30 lg:hidden">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-[#141414]/95 p-4 text-white shadow-2xl backdrop-blur-md">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-bold text-white/80">
              {productEyebrow(selectedProduct)}
            </span>
            <span className="tabular-nums text-sm font-bold text-white">
              {money(selectedProduct.price_usd_cents)}
            </span>
          </div>
          <div className="mt-0.5 truncate text-[11px] text-white/50">
            {premiumCategoryLabel(selectedCategory)} • {selectedPersona.name}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const panel = document.getElementById("store-checkout-panel");
            panel?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-bold text-ink hover:bg-white/90 active:scale-95 transition shadow-md"
        >
          Checkout →
        </button>
      </div>
    </div>
    </div>
  );
}

