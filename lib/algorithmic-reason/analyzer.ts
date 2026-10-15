import {
  parseCreatorMode,
  parseCreatorPersona,
  parsePurchaseLane,
} from "./compatibility";
import { evaluateHookFit, recommendHooks } from "./fit";
import {
  ALL_HOOKS,
  HOOK_CATEGORY_LABELS,
  SIGNAL_LABELS,
  TRIGGER_LABELS,
  getHookById,
} from "./taxonomy";
import type {
  AlgorithmicInsight,
  AlgorithmicSignalType,
  CreatorMode,
  CreatorPersona,
  HookAnalysisResult,
  HookTypeDefinition,
  NeurocognitiveTriggerType,
  PurchaseLane,
} from "./types";

export interface CardInput {
  title?: string;
  conceptSummary?: string;
  hookLine?: string;
  whyItWorks?: string;
  viewerTakeaway?: string;
  category?: string;
  personaSlug?: string;
  shootFormat?: string;
  presenceMode?: string;
  hookId?: string;
  steps?: Array<{
    action?: string;
    spokenLine?: string;
    shot?: string;
    purpose?: string;
  }>;
}

const TRIGGER_PATTERNS: Array<{ trigger: NeurocognitiveTriggerType; keywords: string[] }> = [
  { trigger: "anterior_cingulate_cortex", keywords: ["bilişsel çelişki", "cognitive dissonance", "acc", "anterior cingulate", "çelişki", "ters köşe", "zıt iddia", "ezber bozan"] },
  { trigger: "reward_prediction_error", keywords: ["tahmin hatası", "prediction error", "dopamin", "beklenmedik", "sürpriz"] },
  { trigger: "information_gap", keywords: ["bilgi boşluğu", "information gap", "merak dürtüsü", "merak boşluğu"] },
  { trigger: "zeigarnik_effect", keywords: ["zeigarnik", "açık döngü", "open loop", "yarım kalan", "cliffhanger"] },
  { trigger: "mirror_neuron_system", keywords: ["ayna nöron", "mirror neuron", "parasosyal", "göz teması", "yakın plan"] },
  { trigger: "loss_aversion", keywords: ["kayıp korkusu", "loss aversion", "amigdala", "bütçe kaçağı"] },
  { trigger: "social_proof", keywords: ["sosyal kanıt", "social proof"] },
  { trigger: "authority_bias", keywords: ["otorite", "authority", "uzman"] },
  { trigger: "scarcity_heuristic", keywords: ["kıtlık", "scarcity", "zaman penceresi", "altın saat"] },
  { trigger: "anchoring_bias", keywords: ["çapa", "anchoring", "fiyat karşılaştırma"] },
  { trigger: "von_restorff_effect", keywords: ["von restorff", "izolasyon", "ayrışma", "sessiz açılış"] },
  { trigger: "cocktail_party_effect", keywords: ["kokteyl partisi", "cocktail party"] },
  { trigger: "negativity_bias", keywords: ["negatiflik", "negativity bias", "acı nokta"] },
  { trigger: "endowment_effect", keywords: ["sahiplik", "endowment"] },
  { trigger: "ikea_effect", keywords: ["ikea etkisi", "emek değeri", "boşluk doldurma"] },
  { trigger: "pratfall_effect", keywords: ["pratfall", "sevimli kusur", "itiraf"] },
  { trigger: "unity_identity", keywords: ["birlik", "unity", "biz vs onlar"] },
  { trigger: "default_mode_suppression", keywords: ["dmn bastırma", "görev modu", "desen kırılımı"] },
];

const SIGNAL_PATTERNS: Array<{ signal: AlgorithmicSignalType; keywords: string[] }> = [
  { signal: "save_rate", keywords: ["kaydet", "save", "şablon", "formül", "karar matrisi", "kontrol listesi"] },
  { signal: "dm_share", keywords: ["paylaş", "share", "dm", "arkadaşına gönder", "ortak acı"] },
  { signal: "completion_rate", keywords: ["tamamlama", "completion", "açık döngü", "in medias res"] },
  { signal: "watch_time", keywords: ["izlenme süresi", "watch time", "retention", "bilişsel çelişki"] },
  { signal: "loop_replay", keywords: ["döngü", "loop", "tekrar izleme"] },
  { signal: "comment_depth", keywords: ["yorum", "comment", "tartışma", "tarafını seç"] },
  { signal: "profile_visit", keywords: ["profil ziyareti", "profile visit"] },
];

function contextFrom(card: CardInput): {
  lane?: PurchaseLane;
  mode?: CreatorMode;
  persona?: CreatorPersona;
} {
  return {
    lane: parsePurchaseLane(card.category),
    mode: parseCreatorMode(card.shootFormat),
    persona: parseCreatorPersona(card.presenceMode) ?? parseCreatorPersona(card.personaSlug),
  };
}

export function analyzeCardHook(card: CardInput): HookAnalysisResult {
  const combinedText = [
    card.title ?? "",
    card.conceptSummary ?? "",
    card.hookLine ?? "",
    card.whyItWorks ?? "",
    card.viewerTakeaway ?? "",
    ...(card.steps ?? []).map(
      (s) => `${s.action ?? ""} ${s.spokenLine ?? ""} ${s.shot ?? ""} ${s.purpose ?? ""}`,
    ),
  ]
    .join(" ")
    .toLowerCase();

  const ctx = contextFrom(card);
  const detectedTriggers: NeurocognitiveTriggerType[] = [];
  for (const { trigger, keywords } of TRIGGER_PATTERNS) {
    if (keywords.some((k) => combinedText.includes(k))) detectedTriggers.push(trigger);
  }

  const detectedSignals: AlgorithmicSignalType[] = [];
  for (const { signal, keywords } of SIGNAL_PATTERNS) {
    if (keywords.some((k) => combinedText.includes(k))) detectedSignals.push(signal);
  }

  const declared = card.hookId ? getHookById(card.hookId) : undefined;
  let bestHook: HookTypeDefinition | undefined = declared;
  let bestScore = declared ? 12 : 0;

  if (!declared) {
    for (const hook of ALL_HOOKS) {
      let score = 0;
      for (const kw of hook.keywords) {
        if (combinedText.includes(kw.toLowerCase())) score += 3;
      }
      if (detectedTriggers.includes(hook.primaryCognitiveTrigger)) score += 2;
      if (detectedSignals.includes(hook.targetSignal)) score += 1;
      if (
        combinedText.includes(hook.nameTr.toLowerCase()) ||
        combinedText.includes(hook.nameEn.toLowerCase())
      ) {
        score += 5;
      }
      if (score >= 3) {
        score += hookFitsSafe(hook, ctx);
      }
      if (score > bestScore) {
        bestScore = score;
        bestHook = hook;
      }
    }
  }

  const fit = bestHook
    ? evaluateHookFit(bestHook.id, ctx)
    : { ok: true, score: 0, reasons: [] as string[], hook: undefined };

  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!card.whyItWorks || card.whyItWorks.trim().length < 20) {
    issues.push("Algoritmik Neden (whyItWorks) metni eksik veya çok kısa.");
  }

  if (!bestHook || bestScore < 3) {
    bestHook = undefined;
    issues.push("Güvenilir bir kanca türü tespit edilemedi.");
    const suggested = recommendHooks({ ...ctx, limit: 3 });
    if (suggested.length) {
      recommendations.push(
        `Uyumlu kancalar: ${suggested.map((h) => `${h.nameTr} (${h.id})`).join(", ")}`,
      );
    }
  } else if (!fit.ok) {
    issues.push(...fit.reasons);
    const suggested = recommendHooks({ ...ctx, limit: 3 });
    if (suggested.length) {
      recommendations.push(
        `Bu lane/format için: ${suggested.map((h) => h.nameTr).join(", ")}`,
      );
    }
  }

  const confidence = bestHook ? Math.min(1, Number((bestScore / 14).toFixed(2))) : 0;

  return {
    detectedHook: bestHook,
    confidence,
    detectedTriggers,
    detectedSignals,
    detectedClusters: [],
    issues,
    recommendations,
    fitScore: fit.score,
  };
}

function hookFitsSafe(
  hook: HookTypeDefinition,
  ctx: { lane?: PurchaseLane; mode?: CreatorMode; persona?: CreatorPersona },
): number {
  return evaluateHookFit(hook.id, ctx).score;
}

export function buildAlgorithmicInsight(
  whyItWorksRaw: string | undefined | null,
  cardContext?: CardInput,
): AlgorithmicInsight {
  const text = (whyItWorksRaw ?? "").trim();
  const analysis = analyzeCardHook({
    whyItWorks: text,
    ...cardContext,
  });

  const hook = analysis.detectedHook;
  const isValid = text.length >= 20 && Boolean(hook) && analysis.confidence >= 0.2;
  const scoreBonus = isValid ? (analysis.confidence >= 0.6 ? 10 : 5) : 0;

  return {
    hookTypeId: hook?.id,
    hookCode: hook?.code,
    hookNameTr: hook?.nameTr,
    hookNameEn: hook?.nameEn,
    category: hook?.category,
    categoryLabelTr: hook ? HOOK_CATEGORY_LABELS[hook.category] : undefined,
    cognitiveTrigger: hook?.primaryCognitiveTrigger,
    cognitiveTriggerLabelTr: hook ? TRIGGER_LABELS[hook.primaryCognitiveTrigger] : undefined,
    targetSignal: hook?.targetSignal,
    targetSignalLabelTr: hook ? SIGNAL_LABELS[hook.targetSignal] : undefined,
    fullReasonText: text,
    isAlgorithmicReasonValid: isValid,
    scoreBonus,
    fitScore: analysis.fitScore,
    recommendations: analysis.recommendations,
  };
}
