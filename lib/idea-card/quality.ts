import {
  FACELESS_FORMATS,
  TALKING_FORMATS,
  parseCreatorMode,
  parsePurchaseLane,
} from "@/lib/algorithmic-reason/compatibility";
import { evaluateHookFit } from "@/lib/algorithmic-reason/fit";
import { getHookById } from "@/lib/algorithmic-reason/taxonomy";
import { GENERIC_CTA_PHRASES, META_DIALOGUE_PHRASES } from "./banned-phrases";
import {
  RESIDUE_ISSUE_CODES,
  residueIssueCode,
  scanIdeaCardResidue,
  scanTextResidue,
} from "./ai-residue";
import { jaccardSimilarity, stripOuterQuotes, wordCount } from "./text";
import type { IdeaCard, QualityIssue } from "./types";
export {
  evaluateIdeaCardV22,
  QUALITY_GATE_VERSION,
  type CraftDimensions,
  type QualityDecision,
  type QualityV22Options,
  type QualityV22Result,
} from "./quality-v2-2";

export { BANNED_VAGUE_PHRASES } from "./banned-phrases";
export { scanIdeaCardResidue, scanTextResidue } from "./ai-residue";

function push(
  issues: QualityIssue[],
  code: string,
  severity: QualityIssue["severity"],
  path: string,
  message: string,
  suggestion?: string,
) {
  issues.push({ code, severity, path, message, suggestion });
}

/** Any AI residue is a hard error — must not ship to creators. */
function scanBanned(text: string, path: string, issues: QualityIssue[]) {
  const hits = scanTextResidue(text);
  for (const hit of hits) {
    if (!hit.blocking) continue;
    push(
      issues,
      residueIssueCode(hit.kind),
      "error",
      path,
      `AI residue (${hit.kind}): “${hit.match}”.`,
      "Rewrite with a concrete, filmable action or result. No LLM style words, templates, or empty polish.",
    );
  }
}

function checkDuplicatePair(
  issues: QualityIssue[],
  a: string | undefined,
  b: string | undefined,
  pathA: string,
  pathB: string,
) {
  if (!a || !b) return;
  if (a.length < 12 || b.length < 12) return;
  const similarity = jaccardSimilarity(a, b);
  if (similarity >= 0.88) {
    push(issues, "DUPLICATE_FIELD_TEXT", "error", pathA, `Near-identical text also appears at ${pathB}.`, "Give each field a different job.");
  } else if (similarity >= 0.72) {
    push(issues, "NEAR_DUPLICATE_FIELD_TEXT", "warning", pathA, `Text overlaps heavily with ${pathB}.`);
  }
}

function hasActionVerb(text: string): boolean {
  return /\b(hold|place|show|cut|pour|cap|look|point|remove|open|close|walk|turn|lift|set|tap|press|wipe|stir|tilt|frame|step|sit|stand|pick|put|pull|push|write|draw|swipe|scroll|check|count|sort|tut|koy|göster|goster|kes|dök|dok|bak|çevir|cevir|kaldır|kaldir|sil|kaydır|kaydir|aç|ac|kapa|bas|sil|sür|sur|yaklaştır|yaklastir)\b/i.test(
    text,
  );
}

const LAZY_VIBE = [
  "be energetic",
  "act natural",
  "enerjik ol",
  "heyecanlı anlat",
  "heyecanli anlat",
  "doğal ol",
  "dogal ol",
  "gülümse ve geç",
];

const GENERIC_CAMERA = [
  "medium shot",
  "wide shot",
  "film this",
  "show on camera",
  "kamerayı aç",
  "kamerayi ac",
];

export type QualityMode = "render" | "publish";

export function validateIdeaCardQuality(
  card: IdeaCard,
  options?: { mode?: QualityMode },
): QualityIssue[] {
  const issues: QualityIssue[] = [];
  if (!Array.isArray(card.steps)) {
    card.steps = [];
  }

  if (!card.title || card.title.length < 2) {
    push(issues, "MISSING_REQUIRED_FIELD", "error", "title", "Title is required.");
  }
  if (!card.conceptSummary || wordCount(card.conceptSummary) < 6) {
    push(issues, "MISSING_REQUIRED_FIELD", "error", "conceptSummary", "Concept summary is too short.");
  }
  if (!card.viewerTakeaway || wordCount(card.viewerTakeaway) < 4) {
    push(issues, "MISSING_REQUIRED_FIELD", "error", "viewerTakeaway", "Viewer takeaway is required.");
  }
  if (card.steps.length < 3) {
    push(issues, "MISSING_REQUIRED_FIELD", "error", "steps", "At least 3 steps are required.");
  }
  if (card.steps.length > 8) {
    push(issues, "INVALID_STAGE", "warning", "steps", "More than 8 steps may overwhelm the creator.");
  }

  scanBanned(card.title, "title", issues);
  scanBanned(card.conceptSummary, "conceptSummary", issues);
  scanBanned(card.viewerTakeaway, "viewerTakeaway", issues);
  if (card.whyItWorks) scanBanned(card.whyItWorks, "whyItWorks", issues);
  if (card.audience) scanBanned(card.audience, "audience", issues);
  for (const [index, item] of (card.requiredItems ?? []).entries()) {
    scanBanned(item, `requiredItems.${index}`, issues);
  }
  for (const [index, note] of (card.overallProductionNotes ?? []).entries()) {
    scanBanned(note, `overallProductionNotes.${index}`, issues);
  }

  const sorted = [...(card.steps ?? [])].sort((a, b) => a.order - b.order);
  if (sorted[0] && sorted[0].startSecond !== 0) {
    push(issues, "INVALID_TIME_RANGE", "error", "steps.0.startSecond", "First step must start at 0 seconds.");
  }

  for (let i = 0; i < sorted.length; i += 1) {
    const step = sorted[i];
    const path = `steps.${i}`;
    if (step.endSecond <= step.startSecond) {
      push(issues, "INVALID_TIME_RANGE", "error", `${path}.endSecond`, "endSecond must be greater than startSecond.");
    }
    if (step.order !== i + 1) {
      push(issues, "INVALID_STAGE", "warning", `${path}.order`, `Expected order ${i + 1}.`);
    }
    const next = sorted[i + 1];
    if (next && step.endSecond !== next.startSecond) {
      if (step.endSecond > next.startSecond) {
        push(issues, "TIMELINE_OVERLAP", "error", `${path}.endSecond`, "Steps overlap.");
      } else {
        push(issues, "TIMELINE_GAP", "error", `${path}.endSecond`, "Timeline has a gap before the next step.");
      }
    }

    if (!step.purpose || !step.goal || !step.action) {
      push(issues, "MISSING_REQUIRED_FIELD", "error", path, "Step requires purpose, goal, and action.");
    }

    checkDuplicatePair(issues, step.action, step.spokenLine, `${path}.action`, `${path}.spokenLine`);
    checkDuplicatePair(issues, step.purpose, step.goal, `${path}.purpose`, `${path}.goal`);
    checkDuplicatePair(issues, step.action, step.performanceNote, `${path}.action`, `${path}.performanceNote`);
    checkDuplicatePair(issues, step.shot, step.editNote, `${path}.shot`, `${path}.editNote`);

    if (step.action && !hasActionVerb(step.action) && wordCount(step.action) >= 4) {
      push(
        issues,
        "WEAK_ACTION",
        "warning",
        `${path}.action`,
        "Action should describe a physical move (hold, place, show, cut…).",
      );
    }

    if (step.spokenLine) {
      const spoken = stripOuterQuotes(step.spokenLine);
      const lower = spoken.toLowerCase();
      if (wordCount(spoken) > 30) {
        push(issues, "SPOKEN_LINE_TOO_LONG", "warning", `${path}.spokenLine`, "Spoken line is long for a short-form Reel.");
      }
      for (const meta of META_DIALOGUE_PHRASES) {
        if (lower.includes(meta)) {
          push(issues, "META_LANGUAGE_IN_DIALOGUE", "error", `${path}.spokenLine`, `Dialogue contains instruction language: “${meta}”.`);
        }
      }
      scanBanned(spoken, `${path}.spokenLine`, issues);
    }

    if (step.onScreenText && wordCount(step.onScreenText) > 10) {
      push(issues, "ON_SCREEN_TEXT_TOO_LONG", "warning", `${path}.onScreenText`, "On-screen text should stay short (2–8 words).");
    }

    if ((step.stage === "cta" || step.stage === "takeaway") && step.spokenLine) {
      const lower = stripOuterQuotes(step.spokenLine).toLowerCase();
      for (const generic of GENERIC_CTA_PHRASES) {
        if (lower.includes(generic)) {
          push(issues, "GENERIC_CTA", "error", `${path}.spokenLine`, "CTA is generic; tie it to what was demonstrated.");
        }
      }
    }

    scanBanned(step.purpose, `${path}.purpose`, issues);
    scanBanned(step.goal, `${path}.goal`, issues);
    scanBanned(step.action, `${path}.action`, issues);
    if (step.shot) scanBanned(step.shot, `${path}.shot`, issues);
    if (step.performanceNote) scanBanned(step.performanceNote, `${path}.performanceNote`, issues);
    if (step.editNote) scanBanned(step.editNote, `${path}.editNote`, issues);
  }

  if (!card.steps.some((s) => Boolean(s.shot?.trim()))) {
    push(issues, "MISSING_CAMERA_DIRECTION", "warning", "steps", "At least one step should include camera/shot framing.");
  }
  if (!card.steps.some((s) => Boolean(s.performanceNote?.trim()))) {
    push(issues, "MISSING_PERFORMANCE_DIRECTION", "warning", "steps", "Include creator vibe/body language direction for natural delivery.");
  }

  const publish = options?.mode === "publish";
  const algoSeverity: QualityIssue["severity"] = publish ? "error" : "warning";

  const whyItWorks = card.whyItWorks
    ?? (card as Record<string, unknown>).why_it_works as string | undefined
    ?? (card as Record<string, unknown>).why_it_can_work as string | undefined;

  if (!whyItWorks || whyItWorks.trim().length < 20) {
    push(
      issues,
      "MISSING_ALGORITHMIC_REASON",
      algoSeverity,
      "whyItWorks",
      "Card is missing a substantive Algorithmic Reason (whyItWorks).",
      "Write 1–3 sentences that say why a viewer saves or shares this, tied to a named hook.",
    );
  } else if (!card.hookId) {
    const KNOWN_TRIGGERS = [
      "cognitive dissonance", "bilişsel çelişki", "zeigarnik", "açık döngü", "open loop",
      "loss aversion", "kayıp korkusu", "prediction error", "tahmin hatası",
      "mirror neuron", "ayna nöron", "social proof", "sosyal kanıt",
      "authority", "otorite", "scarcity", "kıtlık", "anchoring", "çapa",
      "information gap", "bilgi boşluğu", "pattern interrupt", "desen kırılımı",
      "kaydet", "save", "paylaş", "share",
    ];
    const lower = whyItWorks.toLowerCase();
    if (!KNOWN_TRIGGERS.some((t) => lower.includes(t))) {
      push(
        issues,
        "GENERIC_ALGORITHMIC_REASON",
        algoSeverity,
        "whyItWorks",
        "Algorithmic Reason is generic and has no hookId.",
        "Set hookId to a taxonomy hook and explain the save/share reason in plain language.",
      );
    }
  }

  if (card.hookId) {
    const hook = getHookById(card.hookId);
    if (!hook) {
      push(issues, "UNKNOWN_OR_UNFIT_HOOK", algoSeverity, "hookId", `Unknown hookId: ${card.hookId}.`);
    } else {
      const fit = evaluateHookFit(card.hookId, {
        lane: parsePurchaseLane(card.category),
        mode: parseCreatorMode(card.shootFormat),
        persona: undefined,
      });
      if (!fit.ok) {
        push(
          issues,
          "UNKNOWN_OR_UNFIT_HOOK",
          algoSeverity,
          "hookId",
          fit.reasons.join(" "),
        );
      }
    }
  } else if (publish) {
    push(issues, "UNKNOWN_OR_UNFIT_HOOK", "error", "hookId", "Publish requires hookId from the 62-hook taxonomy.");
  }

  const shootFormat = parseCreatorMode(card.shootFormat);
  if (publish && !shootFormat) {
    push(issues, "MISSING_SHOOT_FORMAT", "error", "shootFormat", "Publish requires a shootFormat (one of 8 creator modes).");
  }

  const hasProof = card.steps.some((s) => s.stage === "demonstration" || /kanıt|proof|test|göster/i.test(`${s.purpose} ${s.action}`));
  if (!hasProof) {
    push(issues, "MISSING_PROOF_SCENE", algoSeverity, "steps", "Card has no proof/demonstration beat.");
  }

  const talking = !shootFormat || TALKING_FORMATS.includes(shootFormat);
  const silent = shootFormat ? FACELESS_FORMATS.includes(shootFormat) : false;
  if (talking && !silent && !card.steps.some((s) => Boolean(s.spokenLine?.trim()))) {
    push(issues, "MISSING_SPOKEN_LINE", algoSeverity, "steps", "Talking formats need at least one spokenLine.");
  }

  const shotTexts = card.steps.map((s) => s.shot ?? "").join(" ").toLowerCase();
  if (card.steps.some((s) => Boolean(s.shot?.trim())) && GENERIC_CAMERA.some((p) => shotTexts.includes(p))) {
    push(issues, "GENERIC_CAMERA", algoSeverity, "steps.*.shot", "Camera direction is generic.");
  }

  const vibeTexts = card.steps.map((s) => s.performanceNote ?? "").join(" ").toLowerCase();
  if (LAZY_VIBE.some((p) => vibeTexts.includes(p))) {
    push(issues, "LAZY_VIBE", algoSeverity, "steps.*.performanceNote", "Performance note uses a lazy vibe phrase.");
  }

  for (let i = 0; i < card.steps.length; i += 1) {
    const text = card.steps[i].onScreenText ?? "";
    if (wordCount(text) > 10) {
      push(issues, "TEXT_SAFE_OVERFLOW", "warning", `steps.${i}.onScreenText`, "On-screen text may overflow the 900×1400 safe zone.");
    }
  }

  const talkingHead = shootFormat === "talking_head" || !shootFormat;
  const hasCameraProximity = /\b(eye.?level|göz.?hiza|yakın.?plan|close.?up|medium.?close|bust|göğüs|0\.5\s?m|50\s?cm|orta.?yakın)\b/i.test(shotTexts);
  if (talkingHead && !hasCameraProximity && card.steps.some((s) => Boolean(s.shot?.trim()))) {
    push(
      issues,
      "MISSING_CAMERA_PROXIMITY",
      "warning",
      "steps.*.shot",
      "Talking-head card has no eye-level or close-up framing.",
    );
  }

  const finalStep = sorted.at(-1);
  if (finalStep && finalStep.endSecond !== card.durationSeconds) {
    push(issues, "DURATION_MISMATCH", "error", "durationSeconds", "durationSeconds must equal the final step end time.");
  }

  return issues;
}

export function hasBlockingQualityIssues(issues: QualityIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}

export type ScoreResult = {
  score: number;
  band: "low" | "high";
  redGatesPassed: boolean;
  redGateFailureReasons: string[];
  breakdown: {
    fieldCompleteness: number; // 0-25
    timelineQuality: number; // 0-20
    languageQuality: number; // 0-25
    patternDepth: number; // 0-30
  };
};

/**
 * Deterministic quality scoring & Red Gate validation for Schema v2 IdeaCards.
 * Any AI residue (vague phrase, LLM style-word, template, leak, fake certainty, workslop)
 * fails the red gate. Zero tolerance.
 */
export function scoreIdeaCard(card: IdeaCard): ScoreResult {
  const issues = validateIdeaCardQuality(card, { mode: "publish" });
  const redGateFailureReasons: string[] = [];

  const blockingIssues = issues.filter((i) => i.severity === "error");
  if (blockingIssues.length > 0) {
    for (const issue of blockingIssues) {
      redGateFailureReasons.push(`[Structural Error] ${issue.message} (${issue.path})`);
    }
  }

  const residueIssues = issues.filter((i) =>
    (RESIDUE_ISSUE_CODES as readonly string[]).includes(i.code),
  );
  if (residueIssues.length > 0) {
    const sample = residueIssues
      .slice(0, 4)
      .map((issue) => `${issue.code}@${issue.path}`)
      .join(", ");
    redGateFailureReasons.push(
      `[Anti-AI Gate] Card contains ${residueIssues.length} AI-residue hit(s): ${sample}.`,
    );
  }

  // Belt-and-braces: scan the whole card even if a field was missed above.
  const extraResidue = scanIdeaCardResidue(card).filter((hit) => hit.blocking);
  if (extraResidue.length > residueIssues.length) {
    redGateFailureReasons.push(
      `[Anti-AI Gate] Extra residue on ${extraResidue.length} field(s) after quality scan.`,
    );
  }

  const sortedSteps = [...card.steps].sort((a, b) => a.order - b.order);
  if (sortedSteps[0] && sortedSteps[0].stage !== "hook") {
    redGateFailureReasons.push("[Promise Gate] First step must be explicit 'hook' stage.");
  }

  const redGatesPassed = redGateFailureReasons.length === 0;

  let completeness = 10;
  if (card.audience) completeness += 2;
  if (card.platform) completeness += 2;
  if (card.requiredItems && card.requiredItems.length >= 2) completeness += 3;
  if (card.overallProductionNotes && card.overallProductionNotes.length >= 2) completeness += 3;
  if (card.steps.some((s) => Boolean(s.spokenLine))) completeness += 1;
  if (card.steps.some((s) => Boolean(s.shot))) completeness += 1;
  if (card.steps.some((s) => Boolean(s.onScreenText))) completeness += 1;
  if (card.steps.some((s) => Boolean(s.performanceNote))) completeness += 1;
  if (card.steps.some((s) => Boolean(s.editNote))) completeness += 1;
  const fieldCompleteness = Math.min(25, completeness);

  let timeline = 10;
  if (card.durationSeconds >= 12 && card.durationSeconds <= 45) timeline += 5;
  if (card.steps.length >= 4 && card.steps.length <= 6) timeline += 5;
  const timelineQuality = Math.min(20, timeline);

  let language = 25;
  language -= residueIssues.length * 5;
  language -= issues.filter((i) => i.code === "GENERIC_CTA").length * 4;
  language -= issues.filter((i) => i.code.includes("DUPLICATE")).length * 3;
  language -= issues.filter((i) => i.code === "META_LANGUAGE_IN_DIALOGUE").length * 5;
  const languageQuality = Math.max(0, Math.min(25, language));

  // Pattern depth: stages + content heuristics (not labels alone)
  let pattern = 8;
  const stagesPresent = new Set(card.steps.map((s) => s.stage));
  if (stagesPresent.has("hook")) pattern += 4;
  if (stagesPresent.has("context")) pattern += 3;
  if (stagesPresent.has("demonstration")) pattern += 5;
  if (stagesPresent.has("takeaway") || stagesPresent.has("cta")) pattern += 4;
  const spokenBeats = card.steps.filter((s) => s.spokenLine && wordCount(s.spokenLine) >= 4).length;
  if (spokenBeats >= 2) pattern += 3;
  const actionBeats = card.steps.filter((s) => s.action && hasActionVerb(s.action)).length;
  if (actionBeats >= 2) pattern += 3;
  const patternDepth = Math.min(30, pattern);

  let rawScore = fieldCompleteness + timelineQuality + languageQuality + patternDepth;
  if (card.hookId && getHookById(card.hookId)) rawScore += 4;
  if (card.whyItWorks && card.whyItWorks.trim().length >= 20) rawScore += 4;
  if (card.shootFormat && parseCreatorMode(card.shootFormat)) rawScore += 2;
  if (!redGatesPassed) {
    rawScore = Math.min(rawScore, 50);
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  const band: "low" | "high" = redGatesPassed && finalScore >= 80 ? "high" : "low";

  return {
    score: finalScore,
    band,
    redGatesPassed,
    redGateFailureReasons,
    breakdown: {
      fieldCompleteness,
      timelineQuality,
      languageQuality,
      patternDepth,
    },
  };
}
