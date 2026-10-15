import { enrichAlgorithmicFields, getHookById, parseCreatorMode, parseCreatorPersona } from "@/lib/algorithmic-reason";
import { displayCardTitle } from "@/lib/card-display";
import { normalizeCardExecution } from "@/lib/card-sections";
import { mapLegacyStage } from "./stages";
import { jaccardSimilarity, normalizeText, stripOuterQuotes, uniqueStrings } from "./text";
import { parseTimeRange, parseTimeToSeconds } from "./time";
import type { AdaptResult, IdeaCard, IdeaCardDifficulty, IdeaCardProductionEstimate, IdeaCardStep, QualityIssue } from "./types";
import { hasBlockingQualityIssues, validateIdeaCardQuality } from "./quality";
import { firstResidueMatch, stripResidue } from "./ai-residue";

function applyAlgorithmicEnrichment(card: IdeaCard): IdeaCard {
  const enriched = enrichAlgorithmicFields({
    category: card.category,
    personaSlug: card.personaSlug,
    shootFormat: card.shootFormat,
    presenceMode: card.presenceMode,
    hookId: card.hookId,
    whyItWorks: card.whyItWorks,
    title: card.title,
    conceptSummary: card.conceptSummary,
    viewerTakeaway: card.viewerTakeaway,
    steps: card.steps,
  });
  return {
    ...card,
    hookId: (card.hookId && getHookById(card.hookId)?.id) || enriched.hookId,
    shootFormat: parseCreatorMode(card.shootFormat) || enriched.shootFormat,
    presenceMode: parseCreatorPersona(card.presenceMode) || enriched.presenceMode,
    whyItWorks: card.whyItWorks || enriched.whyItWorks,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isV2Card(value: unknown): boolean {
  const record = asRecord(value);
  return Boolean(
    record?.schemaVersion === 2 &&
      Array.isArray(record.steps) &&
      (record.steps as unknown[]).length >= 3,
  );
}

function difficultyFrom(value: unknown): IdeaCardDifficulty {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("advanced") || text.includes("hard")) return "advanced";
  if (text.includes("medium") || text.includes("moderate")) return "medium";
  return "easy";
}

function legacyProductionEstimate(card: Record<string, unknown>): IdeaCardProductionEstimate | undefined {
  const production = asRecord(card.production_plan);
  const rawMinutes = Number(production?.shoot_time_minutes ?? card.shoot_time_minutes);
  if (!Number.isFinite(rawMinutes) || rawMinutes <= 0) return undefined;
  const rounded = Math.max(5, Math.round(rawMinutes / 5) * 5);
  return {
    captureMinutesLow: Math.max(5, rounded - 5),
    captureMinutesHigh: rounded + 5,
    confidence: "low",
    version: "legacy-shoot-time-v1",
  };
}

function cleanOptional(value: unknown): string | undefined {
  const text = normalizeText(value);
  if (!text) return undefined;
  return stripOuterQuotes(text);
}

function repairTimeline(steps: IdeaCardStep[]): IdeaCardStep[] {
  if (!steps.length) return steps;

  const sorted = [...steps].sort((a, b) => a.startSecond - b.startSecond || a.order - b.order);
  let cursor = 0;

  return sorted.map((step, index) => {
    let start = Math.max(0, step.startSecond);
    let end = step.endSecond;

    if (index === 0) start = 0;
    if (start < cursor) start = cursor;
    if (end <= start) end = start + Math.max(3, step.endSecond - step.startSecond || 5);
    cursor = end;

    return {
      ...step,
      order: index + 1,
      startSecond: start,
      endSecond: end,
      id: step.id || `step-${index + 1}`,
    };
  });
}

function stepFromLegacyBeat(
  beat: Record<string, unknown>,
  index: number,
  total: number,
  cardId: string,
): IdeaCardStep | null {
  const range =
    parseTimeRange(beat.time_range ?? beat.timeRange ?? beat.second ?? beat.time, 5) ??
    {
      start: parseTimeToSeconds(beat.start ?? beat.startSecond) ?? index * 5,
      end: parseTimeToSeconds(beat.end ?? beat.endSecond) ?? index * 5 + 5,
    };

  const purpose =
    cleanOptional(beat.purpose) ||
    cleanOptional(beat.goal) ||
    cleanOptional(beat.title) ||
    cleanOptional(beat.beat) ||
    `Step ${index + 1}`;

  const action =
    cleanOptional(beat.primary_action) ||
    cleanOptional(beat.action) ||
    cleanOptional(beat.shoot_direction) ||
    cleanOptional(beat.what_to_do) ||
    cleanOptional(beat.whatToDo) ||
    purpose;

  let goal =
    cleanOptional(beat.goal) ||
    cleanOptional(beat.viewer_goal) ||
    undefined;
  // purpose vs goal must not be identical when both shown (Anomaly Box brief spec §12.1)
  if (!goal || goal.toLowerCase() === purpose.toLowerCase()) {
    goal = `Make sure the viewer understands this step before the next cut.`;
  }
  if (goal.toLowerCase() === action.toLowerCase()) {
    goal = `Keep the viewer focused on the point of this step.`;
  }

  // Prefer explicit spoken lines over long voiceover that often clones action copy.
  const spokenCandidates = [
    cleanOptional(beat.spoken_line),
    cleanOptional(beat.spokenLine),
    cleanOptional(beat.say),
    cleanOptional(beat.voiceLine),
    Array.isArray(beat.spoken_lines) ? cleanOptional(beat.spoken_lines[0]) : undefined,
    cleanOptional(beat.voiceover),
  ].filter(Boolean) as string[];

  let spoken: string | undefined = spokenCandidates[0];

  const shot =
    cleanOptional(beat.shot) ||
    cleanOptional(beat.camera) ||
    cleanOptional(beat.camera_direction) ||
    cleanOptional(beat.cameraShot);

  const onScreen =
    cleanOptional(beat.on_screen_text) ||
    cleanOptional(beat.onScreenText) ||
    cleanOptional(beat.overlay);

  const editNote =
    cleanOptional(beat.edit_move) ||
    cleanOptional(beat.edit) ||
    cleanOptional(beat.edit_direction) ||
    cleanOptional(beat.editNote);

  let performance =
    cleanOptional(beat.pose_camera_note) ||
    cleanOptional(beat.pose) ||
    cleanOptional(beat.performance_note) ||
    cleanOptional(beat.performanceNote);

  const stage = mapLegacyStage(beat.stage ?? beat.purpose ?? beat.beat, index, total);

  let finalAction = action.length >= 6 ? action : `Show ${action} clearly on camera.`;
  let finalPurpose = purpose.length >= 6 ? purpose : `${purpose} for the viewer.`;
  let finalGoal = goal.length >= 6 ? goal : `Keep this step clear before the next cut.`;

  // Soft-clean banned phrases at adapt time so UI has less poison to strip.
  const scrub = (value: string | undefined) => {
    if (!value) return undefined;
    if (!firstResidueMatch(value)) return value;
    const stripped = stripResidue(value);
    return stripped.length >= 6 ? stripped : undefined;
  };
  finalAction = scrub(finalAction) || finalAction;
  finalPurpose = scrub(finalPurpose) || finalPurpose;
  finalGoal = scrub(finalGoal) || finalGoal;
  spoken = scrub(spoken);
  performance = scrub(performance);

  // One field, one job: never keep near-identical Action and Say this.
  if (spoken && jaccardSimilarity(finalAction, spoken) >= 0.72) {
    // Prefer keeping physical action; drop dialogue clone.
    // If spoken looks more like dialogue (quotes / first person) keep spoken and soften action uniqueness.
    const looksSpoken = /\b(I|I'm|we|you|watch|save|look)\b/i.test(spoken) || spoken.length < finalAction.length;
    if (looksSpoken) {
      // keep spoken; leave action as physical instruction when possible
      if (jaccardSimilarity(finalAction, spoken) >= 0.88) {
        finalAction = `Show this beat clearly on camera.`;
      }
    } else {
      spoken = undefined;
    }
  }
  if (performance && jaccardSimilarity(finalAction, performance) >= 0.72) {
    performance = undefined;
  }
  if (jaccardSimilarity(finalPurpose, finalGoal) >= 0.88) {
    finalGoal = `Finish this beat so the next cut has a clear setup.`;
  }

  return {
    id: cleanOptional(beat.id) || `${cardId}-step-${index + 1}`,
    order: index + 1,
    stage,
    customStageLabel: stage === "custom" ? cleanOptional(beat.customStageLabel ?? beat.stage_label) : undefined,
    startSecond: range.start,
    endSecond: range.end > range.start ? range.end : range.start + 5,
    purpose: finalPurpose,
    goal: finalGoal,
    action: finalAction,
    spokenLine: spoken,
    shot: scrub(shot) || shot,
    onScreenText: scrub(onScreen) || onScreen,
    editNote: scrub(editNote) || editNote,
    performanceNote: performance,
  };
}

function collectLegacySteps(card: Record<string, unknown>, cardId: string): IdeaCardStep[] {
  const steps: IdeaCardStep[] = [];

  // Prefer the project's existing execution normalizer (beats / ranges from scene_script, shot_list, etc.)
  try {
    const execution = normalizeCardExecution(card);
    if (execution.execution_ranges.length >= 3) {
      const mapped = execution.execution_ranges.map((range, index) =>
        stepFromLegacyBeat(
          {
            id: `${cardId}-step-${index + 1}`,
            start: range.start,
            end: range.end,
            time_range: range.time_range,
            purpose: range.purpose,
            goal: range.purpose,
            primary_action: range.action || range.shoot_direction || range.shoot_summary,
            voiceover: range.say || range.spoken_line,
            shot: range.camera || range.camera_direction,
            on_screen_text: range.on_screen_text,
            edit_move: range.edit || range.edit_direction,
            pose: range.pose_micro_behavior,
          },
          index,
          execution.execution_ranges.length,
          cardId,
        ),
      );
      const valid = mapped.filter(Boolean) as IdeaCardStep[];
      if (valid.length >= 3) return repairTimeline(valid);
    }

    if (execution.beats.length >= 3) {
      const mapped = execution.beats.map((beat, index) =>
        stepFromLegacyBeat(
          {
            id: `${cardId}-step-${index + 1}`,
            start: beat.start,
            end: beat.end,
            time_range: beat.time_range,
            purpose: beat.purpose,
            primary_action: beat.primary_action,
            voiceover: beat.voiceover,
            shot: beat.shot,
            on_screen_text: beat.on_screen_text,
            edit_move: beat.edit_move,
            pose_camera_note: beat.pose_camera_note,
          },
          index,
          execution.beats.length,
          cardId,
        ),
      );
      const valid = mapped.filter(Boolean) as IdeaCardStep[];
      if (valid.length >= 3) return repairTimeline(valid);
    }
  } catch {
    // Fall through to raw field scanning
  }

  // Raw field scanning for non-standard payloads
  const sources: unknown[][] = [
    asArray(card.execution_beats),
    asArray(card.execution_ranges),
    asArray(asRecord(card.video_blueprint)?.beats),
    asArray(card.scene_script),
    asArray(card.shot_list),
    asArray(card.steps),
  ];

  for (const source of sources) {
    if (!source.length) continue;
    const mapped = source
      .map((item, index) => {
        const beat = asRecord(item);
        if (!beat) return null;
        return stepFromLegacyBeat(beat, index, source.length, cardId);
      })
      .filter(Boolean) as IdeaCardStep[];

    if (mapped.length >= 3) {
      return repairTimeline(mapped);
    }
    if (mapped.length && mapped.length > steps.length) {
      steps.splice(0, steps.length, ...mapped);
    }
  }

  // Build minimal 3-step fallback from summary fields so old thin cards still render.
  if (steps.length < 3) {
    const summary = asRecord(card.idea_summary);
    const blueprint = asRecord(card.video_blueprint);
    const premise =
      cleanOptional(summary?.premise) ||
      cleanOptional(card.one_sentence_premise) ||
      "Show one clear decision the viewer can follow.";
    const opening = cleanOptional(blueprint?.opening_visual) || "Open with the strongest visual result.";
    const payoff = cleanOptional(blueprint?.payoff_visual) || "End with a clear next action for the viewer.";

    return repairTimeline([
      {
        id: `${cardId}-step-1`,
        order: 1,
        stage: "hook",
        startSecond: 0,
        endSecond: 5,
        purpose: "Show the result and create curiosity.",
        goal: "İzleyiciyi net bir sonuçla durdur.",
        action: opening,
      },
      {
        id: `${cardId}-step-2`,
        order: 2,
        stage: "demonstration",
        startSecond: 5,
        endSecond: 20,
        purpose: "Asıl detayı veya kararı göster.",
        goal: "İzleyici neyin önemli olduğunu anlasın.",
        action: premise,
      },
      {
        id: `${cardId}-step-3`,
        order: 3,
        stage: "cta",
        startSecond: 20,
        endSecond: 28,
        purpose: "Net bir sonuç ve sonraki adımla kapat.",
        goal: "İzleyicide tek kullanılabilir sonuç bırak.",
        action: payoff,
      },
    ]);
  }

  return repairTimeline(steps);
}

function requiredItemsFrom(card: Record<string, unknown>): string[] {
  const production = asRecord(card.production_plan) || asRecord(card.production_notes);
  const fromPlan = uniqueStrings([
    ...asArray(production?.equipment).map((item) => String(item)),
    ...asArray(production?.required_items).map((item) => String(item)),
    ...asArray(card.required_items).map((item) => String(item)),
    ...asArray(card.requiredItems).map((item) => String(item)),
  ]);
  return fromPlan.slice(0, 12);
}

function conceptFrom(card: Record<string, unknown>): string {
  const summary = asRecord(card.idea_summary);
  return (
    cleanOptional(summary?.creator_takeaway) ||
    cleanOptional(summary?.premise) ||
    cleanOptional(card.one_sentence_premise) ||
    cleanOptional(card.concept) ||
    cleanOptional(card.conceptSummary) ||
    "Show one specific decision so the viewer knows exactly what to do next."
  );
}

function whyFrom(card: Record<string, unknown>): string | undefined {
  const direct = cleanOptional(card.whyItWorks) || cleanOptional(card.why_it_works);
  if (direct) return direct;
  const pack = asRecord(card.why_it_can_work);
  if (!pack) return undefined;
  const parts = [pack.save_trigger, pack.share_trigger, pack.trust_trigger, pack.cognitive_trigger]
    .map((item) => cleanOptional(item))
    .filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}

function takeawayFrom(card: Record<string, unknown>, concept: string): string {
  const summary = asRecord(card.idea_summary);
  const strategic = asRecord(card.strategic_value);
  return (
    cleanOptional(card.viewerTakeaway) ||
    cleanOptional(card.viewer_takeaway) ||
    cleanOptional(summary?.audience_aftertaste) ||
    cleanOptional(strategic?.audience_aftertaste) ||
    cleanOptional(card.brand_lift_statement) ||
    (concept.length <= 140 ? concept : `${concept.slice(0, 120).trim()}…`)
  );
}

/**
 * Adapt any stored idea_cards.card JSON into IdeaCard schemaVersion 2.
 * Never throws for historical cards — returns a safe compatibility view.
 */
export function adaptLegacyIdeaCard(input: unknown, options?: { ideaId?: string; dbTitle?: string | null }): AdaptResult {
  const issues: QualityIssue[] = [];
  const root = asRecord(input) ?? {};
  const ideaId = options?.ideaId || cleanOptional(root.id) || cleanOptional(root.idea_id) || "idea-card";
  const legacy = !isV2Card(root);

  if (isV2Card(root)) {
    const candidate = applyAlgorithmicEnrichment(root as unknown as IdeaCard);
    const quality = validateIdeaCardQuality(candidate);
    issues.push(...quality);
    if (!hasBlockingQualityIssues(quality)) {
      return { card: { ...candidate, schemaVersion: 2 }, issues, legacy: false };
    }
    // Fall through and re-adapt if v2 is broken
    issues.push({
      code: "UNSUPPORTED_SCHEMA_VERSION",
      severity: "warning",
      path: "schemaVersion",
      message: "Stored v2 card failed validation; rebuilt from available fields.",
    });
  }

  const steps = collectLegacySteps(root, ideaId);
  const repaired = repairTimeline(steps);
  const durationSeconds = repaired.length ? repaired[repaired.length - 1].endSecond : 28;
  const conceptSummary = conceptFrom(root);
  const title = displayCardTitle(root, options?.dbTitle) || cleanOptional(root.title) || "Creator card";
  const format =
    cleanOptional(root.format) ||
    cleanOptional(asRecord(root.video_blueprint)?.format) ||
    cleanOptional(asRecord(root.production_plan)?.format) ||
    "Talking demonstration";
  const category =
    cleanOptional(root.category) ||
    cleanOptional(root.category_name) ||
    cleanOptional(root.lane) ||
    "Creator";

  const card: IdeaCard = {
    id: ideaId,
    title,
    conceptSummary: conceptSummary.length >= 12 ? conceptSummary : `${conceptSummary} Make the next action obvious.`,
    format,
    category,
    platform: cleanOptional(root.platform) || "Instagram Reels",
    audience: cleanOptional(root.audience) || cleanOptional(asRecord(root.strategic_value)?.audience),
    durationSeconds,
    difficulty: difficultyFrom(root.difficulty ?? asRecord(root.production_plan)?.difficulty),
    requiredItems: requiredItemsFrom(root),
    viewerTakeaway: takeawayFrom(root, conceptSummary),
    whyItWorks: whyFrom(root),
    hookId: cleanOptional(root.hookId) || cleanOptional(root.hook_id),
    shootFormat: cleanOptional(root.shootFormat) || cleanOptional(root.shoot_format) || cleanOptional(root.creator_mode),
    presenceMode:
      cleanOptional(root.presenceMode)
      || cleanOptional(asRecord(root.creator_presence_mode)?.mode),
    personaSlug:
      cleanOptional(root.personaSlug)
      || cleanOptional(root.persona_slug)
      || (Array.isArray(root.persona_tags) ? cleanOptional(root.persona_tags[0]) : undefined),
    productionEstimate: legacyProductionEstimate(root),
    steps: repaired,
    overallProductionNotes: uniqueStrings([
      cleanOptional(asRecord(root.production_notes)?.note),
      ...asArray(root.overallProductionNotes).map((item) => String(item)),
      ...asArray(asRecord(root.editing_notes)).map((item) => String(item)),
    ]).slice(0, 8),
    schemaVersion: 2,
  };

  if (legacy) {
    issues.push({
      code: "UNSUPPORTED_SCHEMA_VERSION",
      severity: "warning",
      path: "schemaVersion",
      message: "Legacy card adapted to schemaVersion 2 for rendering.",
    });
  }

  const enriched = applyAlgorithmicEnrichment(card);
  issues.push(...validateIdeaCardQuality(enriched));
  return { card: enriched, issues, legacy };
}
