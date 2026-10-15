import { buildAlgorithmicInsight, formatPresenceLabel, formatShootLabel } from "@/lib/algorithmic-reason";
import { displayCardTitle } from "@/lib/card-display";
import { containsGenericCta, containsMetaDialogue } from "./banned-phrases";
import { firstResidueMatch, stripResidue } from "./ai-residue";
import { jaccardSimilarity, stripOuterQuotes, wordCount } from "./text";
import type { IdeaCard, IdeaCardStep } from "./types";
import { stageLabel } from "./stages";

export type PresentedStep = {
  id: string;
  order: number;
  stageLabel: string;
  startSecond: number;
  endSecond: number;
  purpose: string;
  goal?: string;
  action?: string;
  spokenLine?: string;
  shot?: string;
  onScreenText?: string;
  editNote?: string;
  performanceNote?: string;
};

export type PresentedCard = {
  id: string;
  title: string;
  hookLine: string;
  whyItWorks: string;
  viewerLeaveWith: string;
  storySpine: string[];
  steps: PresentedStep[];
  kit: string[];
  meta: {
    format: string;
    durationLabel: string;
    filmingEstimateLabel?: string;
    editingEstimateLabel?: string;
    difficultyLabel: string;
    platformLabel?: string;
    categoryLabel?: string;
    shootFormatLabel?: string;
    presenceLabel?: string;
  };
  safety: {
    summary: string | null;
    bullets: string[];
  };
  overallProductionNotes: string[];
  algorithmicInsight?: import("@/lib/algorithmic-reason").AlgorithmicInsight;
  shootFormat?: string;
  presenceMode?: string;
  /** True if presentation had to drop toxic or cloned fields */
  sanitized: boolean;
};

function clampWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function humanizeLabel(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const map: Record<string, string> = {
    instagram_reels: "Instagram Reels",
    instagram_stories: "Instagram Stories",
    tiktok: "TikTok",
    youtube_shorts: "YouTube Shorts",
    reels_30_45: "Reels · 30–45s",
    reels: "Reels",
  };
  const key = value.trim().toLowerCase();
  if (map[key]) return map[key];
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function cleanDisplayText(value: string | undefined | null, minWords = 2): string | undefined {
  if (!value) return undefined;
  let text = stripOuterQuotes(String(value).trim());
  if (!text) return undefined;
  if (firstResidueMatch(text) || containsMetaDialogue(text)) {
    text = stripResidue(text);
  }
  // Drop residual meta fragments after strip
  if (containsMetaDialogue(text) || firstResidueMatch(text)) return undefined;
  if (wordCount(text) < minWords) return undefined;
  return text;
}

function extractWhyItWorks(raw: Record<string, unknown> | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  // 1. Direct why_it_works string or object
  const whyDirect = raw.why_it_works;
  if (typeof whyDirect === "string") {
    const cleaned = cleanDisplayText(whyDirect, 4);
    if (cleaned) return clampWords(cleaned, 48);
  }
  if (whyDirect && typeof whyDirect === "object" && !Array.isArray(whyDirect)) {
    const record = whyDirect as Record<string, unknown>;
    const parts = [record.share_trigger, record.save_trigger, record.trust_trigger, record.cognitive_trigger]
      .map((part) => cleanDisplayText(typeof part === "string" ? part : "", 4))
      .filter(Boolean) as string[];
    if (parts.length) return clampWords(parts.join(" · "), 48);
  }

  // 2. Legacy why_it_can_work
  const why = raw.why_it_can_work;
  if (why && typeof why === "object" && !Array.isArray(why)) {
    const record = why as Record<string, unknown>;
    const parts = [record.share_trigger, record.save_trigger, record.trust_trigger]
      .map((part) => cleanDisplayText(typeof part === "string" ? part : "", 4))
      .filter(Boolean) as string[];
    if (parts.length) return clampWords(parts[0]!, 40);
  }
  if (typeof why === "string") {
    const cleaned = cleanDisplayText(why, 4);
    if (cleaned) return clampWords(cleaned, 40);
  }
  return fallback;
}

function extractSafety(raw: Record<string, unknown> | null | undefined): PresentedCard["safety"] {
  if (!raw) return { summary: null, bullets: [] };
  const safety =
    raw.brand_safety && typeof raw.brand_safety === "object" && !Array.isArray(raw.brand_safety)
      ? (raw.brand_safety as Record<string, unknown>)
      : null;
  if (!safety) return { summary: null, bullets: [] };

  const summary =
    cleanDisplayText(typeof safety.claim_boundary === "string" ? safety.claim_boundary : null, 4) ||
    cleanDisplayText(typeof safety.safer_alternative_phrase === "string" ? safety.safer_alternative_phrase : null, 3) ||
    null;

  const bullets: string[] = [];
  if (typeof safety.disclosure_text === "string") {
    const d = cleanDisplayText(safety.disclosure_text, 3);
    if (d) bullets.push(d);
  }
  if (typeof safety.evidence_note === "string") {
    const e = cleanDisplayText(safety.evidence_note, 3);
    if (e) bullets.push(e);
  }
  if (Array.isArray(safety.do_not_say)) {
    const banned = safety.do_not_say
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .slice(0, 3);
    if (banned.length) bullets.push(`Do not say: ${banned.join("; ")}.`);
  }

  return { summary, bullets: bullets.slice(0, 3) };
}

function presentStep(step: IdeaCardStep): { step: PresentedStep; sanitized: boolean } {
  let sanitized = false;
  let purpose = cleanDisplayText(step.purpose, 2) || `Step ${step.order}`;
  let goal = cleanDisplayText(step.goal, 2);
  let action = cleanDisplayText(step.action, 2);
  let spokenLine = cleanDisplayText(step.spokenLine, 2);
  let shot = cleanDisplayText(step.shot, 2);
  let onScreenText = cleanDisplayText(step.onScreenText, 1);
  const editNote = cleanDisplayText(step.editNote, 2);
  let performanceNote = cleanDisplayText(step.performanceNote, 2);

  if (step.purpose && !cleanDisplayText(step.purpose, 2)) sanitized = true;
  if (step.action && !action) sanitized = true;
  if (step.spokenLine && !spokenLine) sanitized = true;

  // One field, one job: drop spoken if it clones action
  if (action && spokenLine && jaccardSimilarity(action, spokenLine) >= 0.72) {
    spokenLine = undefined;
    sanitized = true;
  }
  // Drop performance if it clones action
  if (action && performanceNote && jaccardSimilarity(action, performanceNote) >= 0.72) {
    performanceNote = undefined;
    sanitized = true;
  }
  // Drop goal if it clones purpose
  if (goal && purpose && jaccardSimilarity(goal, purpose) >= 0.88) {
    goal = undefined;
    sanitized = true;
  }
  // Generic CTA soft-hide for display
  if (spokenLine && containsGenericCta(spokenLine) && (step.stage === "cta" || step.stage === "takeaway")) {
    // Keep only if it still has specific content after common CTA stems — otherwise drop
    const stripped = spokenLine
      .replace(/what do you think\??/gi, "")
      .replace(/comment below\.?/gi, "")
      .replace(/follow for more\.?/gi, "")
      .trim();
    if (wordCount(stripped) < 4) {
      spokenLine = undefined;
      sanitized = true;
    }
  }

  purpose = clampWords(purpose, 16);
  if (goal) goal = clampWords(goal, 22);
  if (action) action = clampWords(action, 28);
  if (spokenLine) spokenLine = clampWords(stripOuterQuotes(spokenLine), 24);
  if (shot) shot = clampWords(shot, 22);
  if (onScreenText) onScreenText = clampWords(onScreenText, 8);

  return {
    sanitized,
    step: {
      id: step.id,
      order: step.order,
      stageLabel: stageLabel(step.stage, step.customStageLabel),
      startSecond: step.startSecond,
      endSecond: step.endSecond,
      purpose,
      goal,
      action,
      spokenLine,
      shot,
      onScreenText,
      editNote: editNote ? clampWords(editNote, 20) : undefined,
      performanceNote: performanceNote ? clampWords(performanceNote, 18) : undefined,
    },
  };
}

/**
 * Build creator-facing presentation from a validated/adapted IdeaCard.
 * Sanitizes banned language and field clones so the site never shows toxic template copy.
 */
export function presentIdeaCard(
  card: IdeaCard,
  options?: {
    rawLegacy?: Record<string, unknown> | null;
    dbTitle?: string | null;
  },
): PresentedCard {
  let sanitized = false;
  const title =
    displayCardTitle(
      {
        title: card.title,
        concept: card.conceptSummary,
        format: card.format,
        category: card.category,
      },
      options?.dbTitle || card.title,
    ) || card.title;

  const hookRaw = cleanDisplayText(card.conceptSummary, 4) || "Show one clear decision, then leave the result visible.";
  if (firstResidueMatch(card.conceptSummary || "")) sanitized = true;
  const hookLine = clampWords(hookRaw, 40);

  const whyFromCard = cleanDisplayText(card.whyItWorks, 4);
  const whyItWorks = whyFromCard
    ? clampWords(whyFromCard, 48)
    : extractWhyItWorks(options?.rawLegacy ?? null, "");

  const takeaway =
    cleanDisplayText(card.viewerTakeaway, 3) || "Leave the viewer with one practical rule.";
  if (firstResidueMatch(card.viewerTakeaway || "")) sanitized = true;

  const presentedSteps: PresentedStep[] = [];
  for (const step of [...(card.steps ?? [])].sort((a, b) => a.order - b.order)) {
    const result = presentStep(step);
    if (result.sanitized) sanitized = true;
    // Require purpose + (action or spoken or shot) to show a usable step
    if (!result.step.action && !result.step.spokenLine && !result.step.shot) {
      // keep purpose-only for flow map
    }
    presentedSteps.push(result.step);
  }

  const storySpine = presentedSteps
    .slice(0, 5)
    .map((step) => clampWords(step.purpose, 8))
    .filter(Boolean);

  const notes = (card.overallProductionNotes || [])
    .map((note) => cleanDisplayText(note, 3))
    .filter(Boolean) as string[];
  if ((card.overallProductionNotes || []).length !== notes.length) sanitized = true;

  const kit = (card.requiredItems || [])
    .map((item) => cleanDisplayText(item, 1))
    .filter(Boolean) as string[];

  const difficultyMap: Record<string, string> = {
    easy: "Easy",
    medium: "Medium",
    advanced: "Advanced",
  };
  const difficultyLabel = difficultyMap[card.difficulty] ?? card.difficulty;
  const productionEstimate = card.productionEstimate;
  const validCaptureEstimate = productionEstimate
    && Number.isInteger(productionEstimate.captureMinutesLow)
    && Number.isInteger(productionEstimate.captureMinutesHigh)
    && productionEstimate.captureMinutesLow > 0
    && productionEstimate.captureMinutesHigh >= productionEstimate.captureMinutesLow;
  const filmingEstimateLabel = validCaptureEstimate
    ? `${productionEstimate.captureMinutesLow}–${productionEstimate.captureMinutesHigh} min`
    : undefined;
  const editingEstimateLabel = validCaptureEstimate
    && productionEstimate.editMinutesLow !== undefined
    && productionEstimate.editMinutesHigh !== undefined
    && Number.isInteger(productionEstimate.editMinutesLow)
    && Number.isInteger(productionEstimate.editMinutesHigh)
    && productionEstimate.editMinutesLow > 0
    && productionEstimate.editMinutesHigh >= productionEstimate.editMinutesLow
    ? `${productionEstimate.editMinutesLow}–${productionEstimate.editMinutesHigh} min`
    : undefined;

  const algorithmicInsight = whyItWorks
    ? buildAlgorithmicInsight(whyItWorks, {
        title,
        conceptSummary: hookLine,
        viewerTakeaway: takeaway,
        category: card.category,
        personaSlug: card.personaSlug,
        shootFormat: card.shootFormat,
        presenceMode: card.presenceMode,
        hookId: card.hookId,
        steps: card.steps,
      })
    : undefined;

  return {
    id: card.id,
    title,
    hookLine,
    whyItWorks,
    viewerLeaveWith: clampWords(takeaway, 28),
    storySpine: storySpine.length >= 3 ? storySpine : storySpine,
    steps: presentedSteps,
    kit,
    meta: {
      format: humanizeLabel(card.format) || card.format,
      durationLabel: `${card.durationSeconds}s`,
      filmingEstimateLabel,
      editingEstimateLabel,
      difficultyLabel,
      platformLabel: humanizeLabel(card.platform),
      categoryLabel: humanizeLabel(card.category),
      shootFormatLabel: formatShootLabel(card.shootFormat),
      presenceLabel: formatPresenceLabel(card.presenceMode),
    },
    safety: extractSafety(options?.rawLegacy ?? null),
    overallProductionNotes: notes,
    algorithmicInsight,
    shootFormat: card.shootFormat,
    presenceMode: card.presenceMode,
    sanitized,
  };
}
