import type {
  CreatorMode,
  CreatorPersona,
  HookTypeDefinition,
  PurchaseLane,
} from "./types";

export const PURCHASE_LANES: PurchaseLane[] = [
  "beauty",
  "fashion",
  "commerce_affiliate",
  "creator_education",
  "entertainment_comedy",
  "fitness_wellness_safe",
  "food",
  "lifestyle",
  "luxury",
  "parenting_family",
  "thought_leadership",
  "travel",
];

export const CREATOR_MODES: CreatorMode[] = [
  "talking_head",
  "voiceover",
  "hands_only",
  "pov",
  "screen_recording",
  "object_led",
  "text_led",
  "interview",
];

export const CREATOR_PERSONAS: CreatorPersona[] = [
  "editorial_insider",
  "calm_expert_editor",
  "relatable_confidant",
  "high_status_minimalist",
  "faceless_curator",
  "busy_founder_creator",
];

export const PURCHASE_LANE_LABELS: Record<PurchaseLane, string> = {
  beauty: "Beauty",
  fashion: "Fashion",
  commerce_affiliate: "Commerce & Affiliate",
  creator_education: "Creator Education",
  entertainment_comedy: "Entertainment Comedy",
  fitness_wellness_safe: "Fitness & Wellness Safe",
  food: "Food",
  lifestyle: "Lifestyle",
  luxury: "Luxury",
  parenting_family: "Parenting & Family",
  thought_leadership: "Thought Leadership",
  travel: "Travel",
};

export const CREATOR_MODE_LABELS: Record<CreatorMode, string> = {
  talking_head: "Talking Head",
  voiceover: "Voiceover",
  hands_only: "Hands-Only",
  pov: "POV",
  screen_recording: "Screen Recording",
  object_led: "Object-Led",
  text_led: "Text-Led",
  interview: "Interview",
};

export const CREATOR_PERSONA_LABELS: Record<CreatorPersona, string> = {
  editorial_insider: "Editorial Insider",
  calm_expert_editor: "Calm Expert Editor",
  relatable_confidant: "Relatable Confidant",
  high_status_minimalist: "High-Status Minimalist",
  faceless_curator: "Faceless Curator",
  busy_founder_creator: "Busy Founder Creator",
};

export const FACE_ON_PERSONAS: CreatorPersona[] = [
  "editorial_insider",
  "calm_expert_editor",
  "relatable_confidant",
  "high_status_minimalist",
  "busy_founder_creator",
];

export const FACELESS_FORMATS: CreatorMode[] = [
  "hands_only",
  "object_led",
  "text_led",
  "voiceover",
];

export const TALKING_FORMATS: CreatorMode[] = ["talking_head", "interview", "pov"];

/** Gemini lane matrix: top hooks + proof + claim boundary. */
export const LANE_MATRIX: Record<
  PurchaseLane,
  { topHookIds: string[]; proofDeviceTr: string; claimBoundaryTr: string }
> = {
  beauty: {
    topHookIds: ["macro_tactile_zoom", "contrarian_flip", "transformation_cut"],
    proofDeviceTr: "Klinik doku / ayna testi",
    claimBoundaryTr: "No treatment or clinical-result claim. Show texture and application only.",
  },
  fashion: {
    topHookIds: ["subtraction_taste", "contrarian_flip", "quiet_luxury_indicator"],
    proofDeviceTr: "Astar ve dikiş payı",
    claimBoundaryTr: "Proof is cut, fabric, and silhouette — not a brand promise.",
  },
  commerce_affiliate: {
    topHookIds: ["exclusion_filter", "decision_matrix", "incomplete_test"],
    proofDeviceTr: "Yan yana stres testi",
    claimBoundaryTr: "Disclose sponsors. No sales claim without wear or use proof.",
  },
  creator_education: {
    topHookIds: ["fill_in_the_blank", "reverse_prescription", "screenshot_frame"],
    proofDeviceTr: "Not defteri / tek sayfa formül",
    claimBoundaryTr: "No growth promise. One usable template and a clear limit.",
  },
  entertainment_comedy: {
    topHookIds: ["deadpan_calm", "painful_irony", "in_group_boundary"],
    proofDeviceTr: "Absürt prosedür / bürokratik onay formu",
    claimBoundaryTr: "Target the system, rule, or habit — not a person or protected identity.",
  },
  fitness_wellness_safe: {
    topHookIds: ["reverse_prescription", "normalization_relief", "time_sink"],
    proofDeviceTr: "Form düzeltme açısı / hareket mekaniği",
    claimBoundaryTr: "No medical claim or extreme transformation. Proof is form and tempo.",
  },
  food: {
    topHookIds: ["tactile_snap", "forbidden_knowledge", "exclusion_filter"],
    proofDeviceTr: "Kesme tahtası / çıtırlık sesi",
    claimBoundaryTr: "No health miracle. Proof is cooking, texture, and ingredients.",
  },
  lifestyle: {
    topHookIds: ["micro_silence_drop", "painful_irony", "opportunity_cost_mirror"],
    proofDeviceTr: "Zaman günlüğü / masa düzeni",
    claimBoundaryTr: "No life-coaching promise. One concrete routine as proof.",
  },
  luxury: {
    topHookIds: ["quiet_luxury_indicator", "subtraction_taste", "decision_standard"],
    proofDeviceTr: "Malzeme ağırlığı / akustik tokluk",
    claimBoundaryTr: "No price talk. Proof is material, weight, and quiet.",
  },
  parenting_family: {
    topHookIds: ["shared_pain", "normalization_relief", "regret_filter"],
    proofDeviceTr: "Gerçek günlük kriz anı",
    claimBoundaryTr: "No child shaming or distress on camera. Parent process and limits only.",
  },
  thought_leadership: {
    topHookIds: ["false_enemy", "expensive_lesson", "silent_budget_leak"],
    proofDeviceTr: "Dashboard / ciro veya karar kaydı",
    claimBoundaryTr: "No invented figures. Claim plus proof, then stop.",
  },
  travel: {
    topHookIds: ["golden_window", "forbidden_knowledge", "pov_scenario"],
    proofDeviceTr: "Harita koordinatı / ışık saati",
    claimBoundaryTr: "No hotel praise. Proof is time, light, and route.",
  },
};

export const MODE_MATRIX: Record<
  CreatorMode,
  { setupTr: string; bestHookIds: string[]; decayFixTr: string }
> = {
  talking_head: {
    setupTr: "0.5m göz hizası, yumuşak dolgu ışığı, göğüs planı.",
    bestHookIds: ["reverse_prescription", "quotation_anchor", "proximity_lean"],
    decayFixTr: "Her 4 sn bir %110 zoom veya kanıt kesmesi.",
  },
  voiceover: {
    setupTr: "Arka planda 3–5 sn ritimli kanıt b-roll.",
    bestHookIds: ["in_medias_res", "reverse_engineering", "transformation_cut"],
    decayFixTr: "Konuşma ile b-roll ritmini kilitle; boş talking-head yok.",
  },
  hands_only: {
    setupTr: "45° masa üstü / top-down, kristal odak.",
    bestHookIds: ["physical_subtraction", "macro_tactile_zoom", "tactile_snap"],
    decayFixTr: "El çıkar, nesne durur, ses net kalır.",
  },
  pov: {
    setupTr: "Göğüs/kafa monteli veya tek el göz hizası.",
    bestHookIds: ["pov_scenario", "live_test"],
    decayFixTr: "Sarsıntıyı kıs; ilk 2 sn yön net olsun.",
  },
  screen_recording: {
    setupTr: "Temiz UI, %120 zoom, sarı işaretçi.",
    bestHookIds: ["screenshot_frame", "fill_in_the_blank", "decision_matrix"],
    decayFixTr: "İmleç her iddiayı işaretler; boş masaüstü yok.",
  },
  object_led: {
    setupTr: "Tek odak nesnesi, döner tabla veya el teması.",
    bestHookIds: ["micro_mystery", "quiet_luxury_indicator"],
    decayFixTr: "Nesne kadrajı terk etmez; kesme nesneye bağlı.",
  },
  text_led: {
    setupTr: "900×1400 safe zone içinde kalın tipografi, sessiz açılış.",
    bestHookIds: ["text_first_silent_hook"],
    decayFixTr: "Yazı 1.5 sn tutulur; UI kör bölgesine binmez.",
  },
  interview: {
    setupTr: "A-Cam / B-Cam, hızlı paslaşma.",
    bestHookIds: ["polarizing_dichotomy", "uncomfortable_question"],
    decayFixTr: "Cevap 4 sn içinde; boş kafa sallama yok.",
  },
};

export const PERSONA_DIRECTION: Record<
  CreatorPersona,
  { vibeTr: string; personaSlugs: string[] }
> = {
  editorial_insider: {
    vibeTr: "Cerrah titizliği, analitik bakış, net diksiyon.",
    personaSlugs: ["luxury_editor"],
  },
  calm_expert_editor: {
    vibeTr: "Telaşsız mentor, adım adım karar matrisi, hafif tebessüm.",
    personaSlugs: ["expert_guide", "creator_teacher", "credible_infotainer"],
  },
  relatable_confidant: {
    vibeTr: "0.4m yakın plan, sırdaş fısıltı, ortak acı.",
    personaSlugs: ["relatable_lifestyle", "authentic_storyteller", "family_creator"],
  },
  high_status_minimalist: {
    vibeTr: "Quiet luxury, dik omuz, az kelime, tavizsiz seçim.",
    personaSlugs: ["luxury_editor", "style_strategist"],
  },
  faceless_curator: {
    vibeTr: "Makro doku, metin açılış, kusursuz b-roll, kristal ortam sesi.",
    personaSlugs: [],
  },
  busy_founder_creator: {
    vibeTr: "Hızlı giriş, somut veri ekranı, ROI netliği.",
    personaSlugs: ["founder_operator"],
  },
};

export const PRESENCE_FROM_PERSONA_SLUG: Record<string, CreatorPersona> = {
  luxury_editor: "editorial_insider",
  style_strategist: "high_status_minimalist",
  expert_guide: "calm_expert_editor",
  creator_teacher: "calm_expert_editor",
  credible_infotainer: "calm_expert_editor",
  relatable_lifestyle: "relatable_confidant",
  authentic_storyteller: "relatable_confidant",
  family_creator: "relatable_confidant",
  founder_operator: "busy_founder_creator",
};

export function presenceFromPersonaSlug(slug: string | undefined | null): CreatorPersona | undefined {
  if (!slug) return undefined;
  return PRESENCE_FROM_PERSONA_SLUG[slug.trim().toLowerCase()];
}

export function parsePurchaseLane(value: string | undefined | null): PurchaseLane | undefined {
  if (!value) return undefined;
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, PurchaseLane> = {
    comedy: "entertainment_comedy",
    entertainment: "entertainment_comedy",
    fitness: "fitness_wellness_safe",
    wellness: "fitness_wellness_safe",
    parenting: "parenting_family",
    family: "parenting_family",
    leadership: "thought_leadership",
    commerce: "commerce_affiliate",
    affiliate: "commerce_affiliate",
    education: "creator_education",
  };
  if ((PURCHASE_LANES as string[]).includes(key)) return key as PurchaseLane;
  return aliases[key];
}

export function parseCreatorMode(value: string | undefined | null): CreatorMode | undefined {
  if (!value) return undefined;
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, CreatorMode> = {
    talkinghead: "talking_head",
    "talking head": "talking_head",
    hands: "hands_only",
    screen: "screen_recording",
    object: "object_led",
    text: "text_led",
    typographic: "text_led",
    dialogue: "interview",
  };
  if ((CREATOR_MODES as string[]).includes(key)) return key as CreatorMode;
  return aliases[key];
}

export function parseCreatorPersona(value: string | undefined | null): CreatorPersona | undefined {
  if (!value) return undefined;
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, CreatorPersona> = {
    editorial: "editorial_insider",
    "editorial insider": "editorial_insider",
    calm_expert: "calm_expert_editor",
    relatable: "relatable_confidant",
    high_status: "high_status_minimalist",
    faceless: "faceless_curator",
    busy_founder: "busy_founder_creator",
    founder: "busy_founder_creator",
  };
  if ((CREATOR_PERSONAS as string[]).includes(key)) return key as CreatorPersona;
  return aliases[key] ?? presenceFromPersonaSlug(key);
}

type CompatOverride = {
  lanes?: PurchaseLane[];
  modes?: CreatorMode[];
  personas?: CreatorPersona[];
  proofDeviceTr?: string;
  claimBoundaryTr?: string;
};

const HOOK_COMPAT: Record<string, CompatOverride> = {
  reverse_prescription: {
    lanes: PURCHASE_LANES.filter((l) => l !== "entertainment_comedy"),
    modes: ["talking_head", "interview", "voiceover"],
    personas: FACE_ON_PERSONAS,
  },
  contrarian_flip: {
    lanes: ["beauty", "fashion", "creator_education", "fitness_wellness_safe", "commerce_affiliate"],
    modes: ["talking_head", "object_led", "hands_only"],
    personas: ["editorial_insider", "calm_expert_editor", "high_status_minimalist"],
  },
  painful_irony: {
    lanes: ["entertainment_comedy", "lifestyle", "parenting_family"],
    modes: ["talking_head", "pov"],
    personas: ["relatable_confidant"],
  },
  false_enemy: {
    lanes: ["thought_leadership", "creator_education", "commerce_affiliate"],
    modes: ["talking_head", "screen_recording", "interview"],
    personas: ["busy_founder_creator", "calm_expert_editor"],
  },
  macro_tactile_zoom: {
    lanes: ["beauty", "food", "luxury", "fashion"],
    modes: ["hands_only", "object_led"],
    personas: ["faceless_curator", "editorial_insider", "high_status_minimalist"],
    proofDeviceTr: "Makro doku / temas",
  },
  transformation_cut: {
    lanes: ["beauty", "fashion", "fitness_wellness_safe"],
    modes: ["talking_head", "voiceover", "object_led"],
    personas: FACE_ON_PERSONAS,
  },
  subtraction_taste: {
    lanes: ["fashion", "luxury", "lifestyle"],
    modes: ["talking_head", "object_led"],
    personas: ["high_status_minimalist", "editorial_insider"],
  },
  quiet_luxury_indicator: {
    lanes: ["luxury", "fashion", "travel"],
    modes: ["object_led", "talking_head", "hands_only"],
    personas: ["high_status_minimalist", "editorial_insider", "faceless_curator"],
  },
  decision_standard: {
    lanes: ["luxury", "fashion", "thought_leadership"],
    modes: ["talking_head", "screen_recording"],
    personas: ["high_status_minimalist", "busy_founder_creator"],
  },
  in_group_boundary: {
    lanes: ["entertainment_comedy", "lifestyle"],
    modes: ["talking_head", "interview"],
    personas: ["relatable_confidant"],
  },
  micro_silence_drop: {
    lanes: ["lifestyle", "luxury", "beauty"],
    modes: ["talking_head", "object_led", "text_led"],
    personas: ["high_status_minimalist", "editorial_insider", "faceless_curator"],
  },
  tactile_snap: {
    lanes: ["food", "beauty", "luxury"],
    modes: ["hands_only", "object_led", "voiceover"],
    personas: ["faceless_curator", "editorial_insider"],
  },
  deadpan_calm: {
    lanes: ["entertainment_comedy", "lifestyle"],
    modes: ["talking_head", "pov"],
    personas: ["relatable_confidant", "editorial_insider"],
  },
  exclusion_filter: {
    lanes: ["commerce_affiliate", "food", "beauty", "fashion"],
    modes: ["talking_head", "hands_only", "object_led"],
    personas: ["calm_expert_editor", "editorial_insider"],
  },
  golden_window: {
    lanes: ["travel", "lifestyle", "food"],
    modes: ["pov", "voiceover", "talking_head"],
    personas: ["editorial_insider", "faceless_curator"],
  },
  screenshot_frame: {
    lanes: ["creator_education", "thought_leadership", "commerce_affiliate"],
    modes: ["screen_recording", "talking_head"],
    personas: ["calm_expert_editor", "busy_founder_creator"],
  },
  fill_in_the_blank: {
    lanes: ["creator_education", "thought_leadership", "fitness_wellness_safe"],
    modes: ["screen_recording", "talking_head", "text_led"],
    personas: ["calm_expert_editor", "busy_founder_creator"],
  },
  decision_matrix: {
    lanes: ["commerce_affiliate", "creator_education", "thought_leadership"],
    modes: ["screen_recording", "talking_head"],
    personas: ["calm_expert_editor", "busy_founder_creator"],
  },
  incomplete_test: {
    lanes: ["commerce_affiliate", "beauty", "food"],
    modes: ["hands_only", "talking_head", "object_led"],
    personas: ["editorial_insider", "calm_expert_editor"],
  },
  silent_budget_leak: {
    lanes: ["thought_leadership", "commerce_affiliate", "lifestyle"],
    modes: ["screen_recording", "talking_head"],
    personas: ["busy_founder_creator", "calm_expert_editor"],
  },
  time_sink: {
    lanes: ["fitness_wellness_safe", "lifestyle", "creator_education"],
    modes: ["talking_head", "screen_recording"],
    personas: ["calm_expert_editor", "relatable_confidant"],
  },
  regret_filter: {
    lanes: ["parenting_family", "lifestyle", "fitness_wellness_safe"],
    modes: ["talking_head", "pov"],
    personas: ["relatable_confidant"],
  },
  opportunity_cost_mirror: {
    lanes: ["lifestyle", "thought_leadership", "creator_education"],
    modes: ["talking_head", "screen_recording"],
    personas: ["busy_founder_creator", "calm_expert_editor"],
  },
  expensive_lesson: {
    lanes: ["thought_leadership", "creator_education", "commerce_affiliate"],
    modes: ["talking_head", "interview"],
    personas: ["busy_founder_creator", "calm_expert_editor"],
  },
  forbidden_knowledge: {
    lanes: ["food", "travel", "beauty", "creator_education"],
    modes: ["talking_head", "voiceover", "hands_only"],
    personas: FACE_ON_PERSONAS,
  },
  uncomfortable_question: {
    lanes: ["thought_leadership", "entertainment_comedy", "lifestyle"],
    modes: ["interview", "talking_head"],
    personas: ["editorial_insider", "busy_founder_creator"],
  },
  polarizing_dichotomy: {
    lanes: ["entertainment_comedy", "fashion", "thought_leadership"],
    modes: ["interview", "talking_head", "text_led"],
    personas: ["editorial_insider", "relatable_confidant"],
  },
  shared_pain: {
    lanes: ["parenting_family", "lifestyle", "fitness_wellness_safe"],
    modes: ["talking_head", "pov"],
    personas: ["relatable_confidant"],
  },
  pov_scenario: {
    lanes: ["travel", "parenting_family", "lifestyle", "entertainment_comedy"],
    modes: ["pov", "talking_head"],
    personas: ["relatable_confidant", "faceless_curator"],
  },
  normalization_relief: {
    lanes: ["parenting_family", "fitness_wellness_safe", "lifestyle"],
    modes: ["talking_head", "pov"],
    personas: ["relatable_confidant", "calm_expert_editor"],
  },
  text_first_silent_hook: {
    lanes: PURCHASE_LANES,
    modes: ["text_led", "voiceover"],
    personas: ["faceless_curator", "high_status_minimalist", "busy_founder_creator"],
  },
  proximity_lean: {
    modes: ["talking_head", "pov", "interview"],
    personas: FACE_ON_PERSONAS,
  },
  live_test: {
    lanes: ["commerce_affiliate", "beauty", "food", "fitness_wellness_safe"],
    modes: ["pov", "hands_only", "talking_head"],
  },
  micro_mystery: {
    modes: ["object_led", "hands_only", "text_led"],
    personas: ["faceless_curator", "editorial_insider", "high_status_minimalist"],
  },
  physical_subtraction: {
    lanes: ["beauty", "fashion", "food", "commerce_affiliate"],
    modes: ["hands_only", "object_led"],
    personas: ["faceless_curator", "editorial_insider"],
  },
  in_medias_res: {
    modes: ["voiceover", "pov", "talking_head"],
  },
  reverse_engineering: {
    lanes: ["creator_education", "thought_leadership", "commerce_affiliate", "beauty"],
    modes: ["voiceover", "screen_recording", "talking_head"],
    personas: ["calm_expert_editor", "busy_founder_creator"],
  },
  quotation_anchor: {
    modes: ["talking_head", "interview", "screen_recording"],
    personas: ["calm_expert_editor", "editorial_insider", "busy_founder_creator"],
  },
  result_then_rewind: {
    lanes: PURCHASE_LANES,
    modes: ["voiceover", "hands_only", "pov", "object_led"],
    personas: CREATOR_PERSONAS,
  },
  frame_expansion_reveal: {
    lanes: ["beauty", "fashion", "food", "lifestyle", "luxury", "travel"],
    modes: ["voiceover", "pov", "object_led"],
    personas: ["editorial_insider", "high_status_minimalist", "faceless_curator"],
  },
  sound_before_source: {
    lanes: ["beauty", "fashion", "entertainment_comedy", "food", "lifestyle", "luxury", "travel"],
    modes: ["voiceover", "hands_only", "pov", "object_led"],
    personas: ["editorial_insider", "relatable_confidant", "high_status_minimalist", "faceless_curator"],
  },
  visible_constraint: {
    lanes: PURCHASE_LANES,
    modes: CREATOR_MODES,
    personas: CREATOR_PERSONAS,
  },
};

export type RawHookDefinition = Omit<
  HookTypeDefinition,
  "compatibleLanes" | "compatibleModes" | "compatiblePersonas" | "proofDeviceTr" | "claimBoundaryTr"
>;

function defaultModesFor(id: string): CreatorMode[] {
  if (id.includes("text") || id === "text_first_silent_hook") return ["text_led", "voiceover"];
  if (id.includes("screenshot") || id.includes("dashboard") || id.includes("matrix")) {
    return ["screen_recording", "talking_head"];
  }
  return ["talking_head", "voiceover", "interview"];
}

export function enrichHooks(raw: RawHookDefinition[]): HookTypeDefinition[] {
  return raw.map((hook) => {
    const override = HOOK_COMPAT[hook.id] ?? {};
    const laneHints = PURCHASE_LANES.filter((lane) => LANE_MATRIX[lane].topHookIds.includes(hook.id));
    return {
      ...hook,
      compatibleLanes: override.lanes ?? (laneHints.length ? laneHints : [...PURCHASE_LANES]),
      compatibleModes: override.modes ?? defaultModesFor(hook.id),
      compatiblePersonas: override.personas ?? [...CREATOR_PERSONAS],
      proofDeviceTr: override.proofDeviceTr,
      claimBoundaryTr: override.claimBoundaryTr,
    };
  });
}

export function hookFits(hook: HookTypeDefinition, ctx: {
  lane?: PurchaseLane;
  mode?: CreatorMode;
  persona?: CreatorPersona;
}): { ok: boolean; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  if (ctx.lane) {
    if (hook.compatibleLanes.includes(ctx.lane)) score += 4;
    else reasons.push(`Hook ${hook.id} does not fit lane ${ctx.lane}.`);
    if (LANE_MATRIX[ctx.lane].topHookIds.includes(hook.id)) score += 3;
  }
  if (ctx.mode) {
    if (hook.compatibleModes.includes(ctx.mode)) score += 3;
    else reasons.push(`Hook ${hook.id} does not fit shoot format ${ctx.mode}.`);
  }
  if (ctx.persona) {
    if (hook.compatiblePersonas.includes(ctx.persona)) score += 2;
    else reasons.push(`Hook ${hook.id} does not fit presence ${ctx.persona}.`);
  }
  return { ok: reasons.length === 0, score, reasons };
}
