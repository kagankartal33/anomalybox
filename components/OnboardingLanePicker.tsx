"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowUp,
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
  Film,
  Gem,
  GraduationCap,
  HeartHandshake,
  Palette,
  Radio,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";

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
    tier?: string;
  } | null;
};

type Props = {
  categories: CategoryOption[];
  personas: PersonaOption[];
  initialCategoryIds: string[];
  initialPersonaId: string;
  displayName: string;
  handle: string;
  niche: string;
  cuisineDetail: string;
};

type LaneCopy = {
  signalLabel: string;
  shortHint: string;
  matchReason: string;
  visualCue: string;
};

type Visual = {
  Icon: LucideIcon;
  label: string;
  tone: string;
};

const filterTabs = [
  { key: "all", label: "All" },
  { key: "creator", label: "Creator" },
  { key: "business", label: "Business" },
  { key: "beauty", label: "Beauty" },
  { key: "fashion", label: "Style" },
  { key: "food", label: "Food" },
  { key: "travel", label: "Travel" },
  { key: "education", label: "Learn" },
  { key: "entertainment", label: "Culture" },
  { key: "commerce", label: "Commerce" },
];

const cuisineTerms = [
  "american",
  "argentinian",
  "brazilian",
  "british",
  "caribbean",
  "chinese",
  "french",
  "greek",
  "indian",
  "italian",
  "japanese",
  "korean",
  "lebanese",
  "mediterranean",
  "mexican",
  "moroccan",
  "pakistani",
  "persian",
  "peruvian",
  "portuguese",
  "spanish",
  "thai",
  "turkish",
  "vietnamese",
  "south african",
  "middle eastern",
  "sri lankan",
];

function normalized(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function categoryText(category: CategoryOption) {
  return normalized(`${category.slug} ${category.name}`);
}

function cuisineFromQuery(query: string) {
  const text = normalized(query);
  if (!text) return "";
  return cuisineTerms.find((term) => text.includes(term)) ?? "";
}

function isCanonicalRestaurant(category: CategoryOption) {
  const slug = normalized(category.slug);
  const name = normalized(category.name);
  return slug === "restaurant" || name === "restaurant";
}

function isCuisineSpecificRestaurant(category: CategoryOption) {
  const slug = normalized(category.slug);
  const name = normalized(category.name);
  const text = categoryText(category);
  if (!text.includes("restaurant")) return false;

  return cuisineTerms.some((term) => {
    const restaurantName = `${term} restaurant`;
    return slug === restaurantName || name === restaurantName || text.includes(restaurantName);
  });
}

function categoryBucket(category: CategoryOption) {
  const text = categoryText(category);
  if (/beauty|makeup|skin|hair|salon|cosmetic|spa|nail|lash|brow|fragrance/.test(text)) return "beauty";
  if (/fashion|style|clothing|jewelry|watch|shoe|boutique|streetwear|luxury|outfit/.test(text)) return "fashion";
  if (/food|restaurant|cafe|bakery|coffee|pizza|kitchen|dessert|tea|recipe|cooking|dining|bar|sushi|brunch/.test(text)) return "food";
  if (/travel|hotel|tour|tourism|resort|city|museum|park|venue|nomad|rv|van life/.test(text)) return "travel";
  if (/fitness|sports|athlete|running|marathon|pilates|yoga|workout|wellness/.test(text)) return "lifestyle";
  if (/education|school|course|coach|training|author|book|tutorial|science|tech|learning/.test(text)) return "education";
  if (/entertainment|comedy|music|artist|theater|film|cinema|gaming|creator|podcast|dance/.test(text)) return "entertainment";
  if (/shop|store|commerce|product|retail|affiliate|market|supply|ecommerce|brand/.test(text)) return "commerce";
  if (category.family === "creator_content") return "creator";
  return category.family === "instagram_business" ? "business" : "creator";
}

function laneVisual(category?: CategoryOption | null): Visual {
  if (!category) return { Icon: Compass, label: "Lane", tone: "bg-ink text-white" };
  const text = categoryText(category);

  if (/coffee|cafe|espresso|roaster|tea/.test(text)) return { Icon: Coffee, label: "Cafe signal", tone: "bg-[#6B3F2A] text-white" };
  if (/bakery|dessert|cake|pastry|baking|chocolate|ice cream/.test(text)) return { Icon: CakeSlice, label: "Bakery signal", tone: "bg-[#A64B5B] text-white" };
  if (/restaurant|food|recipe|cooking|dining|pizza|sushi|brunch|kitchen|bar|tapas|street food/.test(text)) return { Icon: Utensils, label: "Food signal", tone: "bg-[#8A4B1F] text-white" };
  if (/makeup|beauty|skin|hair|salon|cosmetic|spa|nail|lash|brow|fragrance/.test(text)) return { Icon: Sparkles, label: "Beauty signal", tone: "bg-[#B42335] text-white" };
  if (/fashion|style|clothing|jewelry|watch|shoe|boutique|streetwear|luxury|outfit/.test(text)) return { Icon: Gem, label: "Style signal", tone: "bg-[#5B2A86] text-white" };
  if (/hotel|resort|travel|tour|tourism|city|museum|park|venue|nomad|rv|van life/.test(text)) return { Icon: Compass, label: "Place signal", tone: "bg-teal text-white" };
  if (/fitness|sports|athlete|running|marathon|pilates|yoga|workout|wellness/.test(text)) return { Icon: Activity, label: "Performance signal", tone: "bg-[#244D48] text-white" };
  if (/education|school|course|coach|training|tutorial|learning/.test(text)) return { Icon: GraduationCap, label: "Expert signal", tone: "bg-ink text-white" };
  if (/author|book|booktok|reading|writer|literary/.test(text)) return { Icon: BookOpen, label: "Reading signal", tone: "bg-[#3B3B5C] text-white" };
  if (/science|tech|ai|software|gadget|future/.test(text)) return { Icon: Cpu, label: "Explainer signal", tone: "bg-[#243B53] text-white" };
  if (/comedy|entertainment|film|cinema|theater|music|artist|gaming|podcast|dance/.test(text)) return { Icon: Clapperboard, label: "Culture signal", tone: "bg-[#7A2E52] text-white" };
  if (/shop|store|commerce|product|retail|affiliate|market|supply|ecommerce/.test(text)) return { Icon: ShoppingBag, label: "Commerce signal", tone: "bg-[#A52434] text-white" };
  if (category.family === "instagram_business") return { Icon: ShieldCheck, label: "Business signal", tone: "bg-[#243B53] text-white" };
  return { Icon: Camera, label: "Creator signal", tone: "bg-teal text-white" };
}

function laneCopy(category: CategoryOption, cuisineDetail = ""): LaneCopy {
  const text = categoryText(category);
  const cuisine = cuisineDetail.trim();

  if (/coffee|cafe|espresso|roaster|tea/.test(text)) {
    return {
      signalLabel: "Cafe atmosphere",
      shortHint: "Counter rituals, regular-customer moments, sensory close-ups.",
      matchReason: "Best when your content can sell mood, habit, taste, and a reason to visit.",
      visualCue: "Use steam, hands, table texture, barista movement, and a calm first-second object shot.",
    };
  }
  if (/bakery|dessert|cake|pastry|baking|chocolate|ice cream/.test(text)) {
    return {
      signalLabel: "Sweet proof",
      shortHint: "Texture reveals, batch moments, tasting payoffs, saveable cravings.",
      matchReason: "Works for creators who can make process and texture feel worth saving.",
      visualCue: "Lead with a cut, pull, glaze, dusting, box reveal, or first bite reaction.",
    };
  }
  if (/restaurant|food|recipe|cooking|dining|pizza|sushi|brunch|kitchen|bar|tapas|street food/.test(text)) {
    return {
      signalLabel: cuisine ? `${cuisine} concept` : "Restaurant concept",
      shortHint: "Menu logic, table moments, sensory proof, service details.",
      matchReason: cuisine
        ? `Keeps ${cuisine} as the concept detail while matching inventory to the broader food lane.`
        : "Best when the post can show taste, context, value, atmosphere, or a clear reason to choose the place.",
      visualCue: "Open with the plate, handoff, pour, sign, table arrival, or one decisive menu detail.",
    };
  }
  if (/makeup|beauty|skin|hair|salon|cosmetic|spa|nail|lash|brow|fragrance/.test(text)) {
    return {
      signalLabel: "Visual proof",
      shortHint: "Close-ups, routines, texture tests, transformation clarity.",
      matchReason: "Built for creators whose audience wants proof, taste, and a believable beauty decision.",
      visualCue: "Show product texture, face/hand motion, mirror framing, and the final look without over-selling.",
    };
  }
  if (/fashion|style|clothing|jewelry|watch|shoe|boutique|streetwear|luxury|outfit/.test(text)) {
    return {
      signalLabel: "Taste authority",
      shortHint: "Outfit logic, status cues, styling filters, saveable taste rules.",
      matchReason: "Fits creators whose audience follows for curation, taste shortcuts, and visual identity.",
      visualCue: "Use fabric movement, accessories, mirror checks, fit transitions, and one sharp styling rule.",
    };
  }
  if (/hotel|resort|travel|tour|tourism|city|museum|park|venue|nomad|rv|van life/.test(text)) {
    return {
      signalLabel: "Place narrative",
      shortHint: "Arrival hooks, route logic, room details, local proof.",
      matchReason: "Strong when your content can make a place feel chosen, useful, and emotionally specific.",
      visualCue: "Start with a door, map, keycard, view, route move, or location detail that invites curiosity.",
    };
  }
  if (/fitness|sports|athlete|running|marathon|pilates|yoga|workout|wellness/.test(text)) {
    return {
      signalLabel: "Performance clarity",
      shortHint: "Movement proof, routine structure, progress cues, form details.",
      matchReason: "Works for creators who can make effort feel measurable, repeatable, and motivating.",
      visualCue: "Use warm-up, grip, form, timer, sweat detail, or a clean before-session setup.",
    };
  }
  if (/author|book|booktok|reading|writer|literary/.test(text)) {
    return {
      signalLabel: "Narrative taste",
      shortHint: "Reading rituals, story promise, shelf signals, emotional payoff.",
      matchReason: "Matches creators whose audience wants identity, taste, and story-led recommendations.",
      visualCue: "Use page texture, desk light, annotation, shelf movement, or one concise story question.",
    };
  }
  if (/education|school|course|coach|training|tutorial|learning/.test(text)) {
    return {
      signalLabel: "Expert clarity",
      shortHint: "Frameworks, teachable saves, trust-building, quick proof.",
      matchReason: "Best when your audience expects useful structure, not vague inspiration.",
      visualCue: "Open with a whiteboard, note, screen, numbered filter, or one mistake your audience recognizes.",
    };
  }
  if (/science|tech|ai|software|gadget|future/.test(text)) {
    return {
      signalLabel: "Smart simplifier",
      shortHint: "Complex ideas translated into practical, visual decisions.",
      matchReason: "Fits creators who can make new tools, systems, or discoveries feel usable without hype.",
      visualCue: "Use a screen, object demo, diagram gesture, test result, or one clean comparison.",
    };
  }
  if (/comedy|entertainment|film|cinema|theater|music|artist|gaming|podcast|dance/.test(text)) {
    return {
      signalLabel: "Audience reaction",
      shortHint: "Character beats, timing, payoff, comment-first prompts.",
      matchReason: "Works when the post gives the audience a recognizable feeling to quote, argue with, or share.",
      visualCue: "Lead with a face beat, cut, prop, sound cue, split-screen, or a sharp setup/punch turn.",
    };
  }
  if (/shop|store|commerce|product|retail|affiliate|market|supply|ecommerce/.test(text)) {
    return {
      signalLabel: "Buyer confidence",
      shortHint: "Decision filters, product proof, sponsor-safe value, clear use cases.",
      matchReason: "Best when your audience needs help deciding without feeling pushed into an ad.",
      visualCue: "Use packaging, hand use, comparison, texture, fit, or one practical decision rule.",
    };
  }
  if (category.family === "instagram_business") {
    return {
      signalLabel: "Service positioning",
      shortHint: "Trust markers, process clarity, proof points, local relevance.",
      matchReason: "Fits business creators who need content that explains value without sounding generic.",
      visualCue: "Show the workspace, client moment, tool, finished result, or one trust-building detail.",
    };
  }
  return {
    signalLabel: "Creator lane",
    shortHint: "Audience identity, recurring format, and a clear reason to save.",
    matchReason: "Use this when your audience already connects you with this subject or content promise.",
    visualCue: "Open with the most recognizable object, location, expression, or decision in the lane.",
  };
}

function personaHint(persona: PersonaOption) {
  if (persona.description) return persona.description;
  const text = normalized(`${persona.slug} ${persona.name}`);
  if (text.includes("luxury")) return "For creators who make taste feel effortless, quiet, and expensive.";
  if (text.includes("relatable")) return "For creators who turn daily life into saved advice.";
  if (text.includes("expert")) return "For creators who earn trust through clear frameworks.";
  if (text.includes("beauty")) return "For creators who make visual proof and product context feel premium.";
  if (text.includes("product")) return "For creators who help audiences decide without sounding salesy.";
  if (text.includes("comedy")) return "For creators who make observation, timing, and audience comments do the work.";
  return "Shapes the voice, pacing, and execution style of every card.";
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
    cinematic_storyteller: { Icon: Film, label: "Cinematic arc", tone: "bg-[#3B3B5C] text-white" },
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

function personaAudiencePromise(persona: PersonaOption) {
  return persona.metadata?.audience_promise ?? "Shapes what your audience should feel, save, or answer after the post.";
}

function personaMechanics(persona: PersonaOption) {
  return (persona.metadata?.content_mechanics ?? persona.tags ?? []).slice(0, 4);
}

function personaVisualStyle(persona: PersonaOption) {
  return persona.metadata?.visual_style ?? "Premium pacing, clear framing, and creator-specific visual rhythm.";
}

function personaBestFor(persona: PersonaOption) {
  return (persona.metadata?.best_categories ?? []).slice(0, 4);
}

export function OnboardingLanePicker({
  categories,
  personas,
  initialCategoryIds,
  initialPersonaId,
  displayName,
  handle,
  niche,
  cuisineDetail: initialCuisineDetail,
}: Props) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initialCategoryIds.slice(0, 3));
  const [selectedPersonaId, setSelectedPersonaId] = useState(initialPersonaId);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [cuisineDetail, setCuisineDetail] = useState(initialCuisineDetail);

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const selectedPersona = personas.find((persona) => persona.id === selectedPersonaId);
  const selectedCategories = selectedCategoryIds
    .map((id) => categoryById.get(id))
    .filter((category): category is CategoryOption => Boolean(category));
  const hasFoodLane = selectedCategories.some((category) => categoryBucket(category) === "food");
  const cuisineQuery = cuisineFromQuery(query);
  const restaurantCategory = useMemo(
    () => categories.find(isCanonicalRestaurant) ?? categories.find((category) => categoryBucket(category) === "food" && categoryText(category).includes("restaurant")),
    [categories],
  );

  const filteredCategories = useMemo(() => {
    const needle = normalized(query.trim());
    return categories
      .filter((category) => {
        if (isCuisineSpecificRestaurant(category)) return false;
        const haystack = normalized(`${category.name} ${category.slug}`);
        const isCuisineRestaurantMatch = Boolean(cuisineQuery && restaurantCategory?.id === category.id);
        const matchesQuery = !needle || haystack.includes(needle) || isCuisineRestaurantMatch;
        const bucket = categoryBucket(category);
        const matchesFilter = filter === "all" || bucket === filter || isCuisineRestaurantMatch;
        return matchesQuery && matchesFilter;
      })
      .slice(0, 240);
  }, [categories, cuisineQuery, filter, query, restaurantCategory?.id]);

  function toggleCategory(id: string) {
    setSelectedCategoryIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  function makePrimary(id: string) {
    setSelectedCategoryIds((current) => [id, ...current.filter((item) => item !== id)].slice(0, 3));
  }

  function useCuisineAsRestaurant() {
    const cuisine = cuisineQuery ? titleCase(cuisineQuery) : cuisineDetail;
    if (cuisine) setCuisineDetail(cuisine);
    if (!restaurantCategory) return;
    setFilter("food");
    setSelectedCategoryIds((current) => {
      if (current.includes(restaurantCategory.id)) return [restaurantCategory.id, ...current.filter((id) => id !== restaurantCategory.id)].slice(0, 3);
      return [restaurantCategory.id, ...current].slice(0, 3);
    });
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold md:col-span-1">
          Display name
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-3 font-normal" name="display_name" defaultValue={displayName} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Instagram handle
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-3 font-normal" name="handle" defaultValue={handle} placeholder="@creator" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Niche note
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-3 font-normal" name="niche" defaultValue={niche} placeholder="beauty, luxury lifestyle, travel..." />
        </label>
      </div>

      <input type="hidden" name="category_id_1" value={selectedCategoryIds[0] ?? ""} />
      <input type="hidden" name="category_id_2" value={selectedCategoryIds[1] ?? ""} />
      <input type="hidden" name="category_id_3" value={selectedCategoryIds[2] ?? ""} />
      <input type="hidden" name="persona_id" value={selectedPersonaId} />
      <input type="hidden" name="cuisine_detail" value={hasFoodLane ? cuisineDetail : ""} />

      <section className="overflow-hidden rounded-md border border-ink/10 bg-[#fbfaf6]">
        <div className="border-b border-ink/10 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-xs font-semibold text-teal">
                <BadgeCheck className="h-3.5 w-3.5" />
                Lane matching profile
              </div>
              <h2 className="mt-3 text-2xl font-semibold">Choose the lanes your audience already recognizes you for.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
                Your primary lane powers new purchases. Supporting lanes help shape your creator profile, while briefs already secured in your vault keep their original match.
              </p>
            </div>
            <div className="rounded-md border border-ink/10 bg-paper px-4 py-3 text-sm">
              <span className="font-semibold">{selectedCategoryIds.length}/3</span>
              <span className="ml-1 text-ink/60">lanes selected</span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1.05fr_0.95fr_0.95fr]">
            {[0, 1, 2].map((index) => {
              const category = selectedCategories[index];
              const visual = laneVisual(category);
              const Icon = visual.Icon;
              const copy = category ? laneCopy(category, cuisineDetail) : null;
              return (
                <div key={index} className={`rounded-md border p-4 ${category ? "border-ink/10 bg-paper" : "border-dashed border-ink/15 bg-white"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${category ? visual.tone : "bg-mist text-ink/40"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">{index === 0 ? "Primary match" : `Support lane ${index + 1}`}</p>
                      <h3 className="mt-1 truncate font-semibold">{category?.name ?? "Choose a lane"}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink/60">
                        {copy?.matchReason ?? "Use this only if it truly reflects what your audience expects from you."}
                      </p>
                    </div>
                  </div>
                  {copy ? (
                    <div className="mt-3 rounded-md border border-ink/10 bg-white px-3 py-2 text-xs leading-5 text-ink/60">
                      <span className="font-semibold text-ink">Visual cue:</span> {copy.visualCue}
                    </div>
                  ) : null}
                  {category ? (
                    <div className="mt-3 flex gap-2">
                      {index !== 0 ? (
                        <button className="focus-ring inline-flex items-center gap-1 rounded-md border border-ink/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink/65 hover:bg-mist" type="button" onClick={() => makePrimary(category.id)}>
                          <ArrowUp className="h-3.5 w-3.5" />
                          Make primary
                        </button>
                      ) : null}
                      <button className="focus-ring inline-flex items-center gap-1 rounded-md border border-ink/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink/60 hover:bg-mist" type="button" onClick={() => toggleCategory(category.id)}>
                        <X className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-b border-ink/10 p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
            <input
              className="focus-ring w-full rounded-md border border-ink/15 bg-white py-3 pl-10 pr-3 text-sm"
              placeholder="Search beauty, travel, restaurant, fashion, education..."
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
                <div>
                  <p className="text-sm font-semibold text-ink">Use Restaurant as the main lane.</p>
                  <p className="mt-1 text-sm leading-6 text-ink/60">
                    Keep {titleCase(cuisineQuery)} as a cuisine or concept detail, so your creative brief still uses the broad food inventory while its guidance reflects the specific context.
                  </p>
                </div>
                <button className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="button" onClick={useCuisineAsRestaurant}>
                  Use Restaurant + {titleCase(cuisineQuery)}
                </button>
              </div>
            </div>
          ) : null}

          {hasFoodLane || cuisineQuery ? (
            <label className="mt-4 grid gap-2 text-sm font-semibold">
              Cuisine or concept detail
              <input
                className="focus-ring rounded-md border border-ink/15 bg-white px-3 py-3 font-normal"
                value={cuisineDetail}
                onChange={(event) => setCuisineDetail(event.target.value)}
                placeholder="Turkish, Japanese, Mexican, vegan tasting menu, hotel breakfast..."
              />
              <span className="text-xs font-normal leading-5 text-ink/60">
                This is saved as creator context. It does not create a separate stock category or change already delivered boxes.
              </span>
            </label>
          ) : null}
        </div>

        <div className="max-h-[620px] overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCategories.map((category) => {
              const selected = selectedCategoryIds.includes(category.id);
              const disabled = !selected && selectedCategoryIds.length >= 3;
              const selectedIndex = selectedCategoryIds.indexOf(category.id);
              const visual = laneVisual(category);
              const Icon = visual.Icon;
              const copy = laneCopy(category, cuisineDetail);
              return (
                <button
                  key={category.id}
                  className={`focus-ring rounded-md border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 ${
                    selected ? "border-teal ring-2 ring-teal/15" : "border-ink/10 hover:border-ink/25"
                  }`}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  disabled={disabled}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${visual.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-5">{category.name}</h3>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ink/60">
                          {copy.signalLabel}
                        </p>
                      </div>
                    </div>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${selected ? "border-teal bg-teal text-white" : "border-ink/15 text-transparent"}`}>
                      <Check className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/60">{copy.shortHint}</p>
                  {selected ? (
                    <div className="mt-3 inline-flex rounded-full bg-mist px-2.5 py-1 text-xs font-semibold text-ink/65">
                      {selectedIndex === 0 ? "Primary matching lane" : `Lane ${selectedIndex + 1}`}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
          {!filteredCategories.length ? (
            <div className="rounded-md border border-ink/10 bg-white p-8 text-center text-sm text-ink/60">
              No lane matched that search. Try a broader creator category.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink/60">Creator mode</p>
            <h2 className="mt-2 text-2xl font-semibold">Choose the mode your audience already recognizes you for.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
              This is how you talk and hold the camera. The briefs follow that.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f7f5ef] px-3 py-1 text-xs font-semibold text-ink/60">
            <Crown className="h-3.5 w-3.5" />
            {selectedPersona?.name ?? "Creator mode"}
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {personas.map((persona) => {
            const selected = selectedPersonaId === persona.id;
            const visual = personaVisual(persona);
            const Icon = visual.Icon;
            return (
              <button
                key={persona.id}
                className={`focus-ring rounded-md border p-4 text-left transition hover:-translate-y-0.5 ${
                  selected ? "border-ink bg-ink text-white shadow-soft" : "border-ink/10 bg-[#fbfaf6] hover:border-ink/25"
                }`}
                type="button"
                onClick={() => setSelectedPersonaId(persona.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span className={`grid h-8 w-8 place-items-center rounded-md ${selected ? "bg-white text-ink" : visual.tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <h3 className="font-semibold">{persona.name}</h3>
                      <p className={`mt-0.5 text-[11px] uppercase tracking-[0.12em] ${selected ? "text-white/45" : "text-ink/35"}`}>{visual.label}</p>
                    </span>
                  </span>
                  <span className={`grid h-6 w-6 place-items-center rounded-full border ${selected ? "border-white/30 bg-white text-ink" : "border-ink/15 text-transparent"}`}>
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className={`mt-2 text-sm leading-6 ${selected ? "text-white/70" : "text-ink/60"}`}>{personaHint(persona)}</p>
                <div className={`mt-4 rounded-md border p-3 text-xs leading-5 ${selected ? "border-white/15 bg-white/10 text-white/70" : "border-ink/10 bg-white text-ink/60"}`}>
                  <div className={`font-semibold ${selected ? "text-white" : "text-ink"}`}>Audience promise</div>
                  <p className="mt-1">{personaAudiencePromise(persona)}</p>
                  <div className={`mt-3 font-semibold ${selected ? "text-white" : "text-ink"}`}>Visual grammar</div>
                  <p className="mt-1">{personaVisualStyle(persona)}</p>
                  {personaMechanics(persona).length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {personaMechanics(persona).map((mechanic) => (
                        <span key={mechanic} className={`rounded-full px-2 py-1 ${selected ? "bg-white/10 text-white/75" : "bg-[#f7f5ef] text-ink/60"}`}>
                          {mechanic}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {personaBestFor(persona).length ? (
                    <p className="mt-3">
                      <span className={selected ? "text-white" : "text-ink"}>Best for:</span> {personaBestFor(persona).join(", ")}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="sticky bottom-4 z-10 rounded-md border border-ink/10 bg-white/95 p-3 shadow-soft backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <span className="font-semibold">{selectedCategoryIds.length}/3 lanes selected</span>
            <span className="ml-2 text-ink/60">Your creative brief will be matched to your lane, format, and audience promise.</span>
          </div>
          <button className="focus-ring rounded-md bg-ink px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40" type="submit" disabled={!selectedCategoryIds.length}>
            Save profile and continue to Store
          </button>
        </div>
      </div>
    </div>
  );
}
