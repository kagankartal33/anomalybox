import assert from "node:assert/strict";
import fs from "node:fs";
import { automaticCard } from "./fixtures/automatic-card";
import { CARD_TRAINING_VERSION, CARD_LANE_LESSONS, CARD_WRITER_SYSTEM, CARD_CRITIC_SYSTEM, buildCardTrainingContext, cardDraftPrompt } from "../lib/generation/card-training";
import { CARD_DATASET_VERSION, cardTrainingSplit, cardTrainingTarget, compileCardTrainingDataset } from "../lib/generation/card-training-dataset";
import { evaluateCardTrainingSamples } from "../lib/generation/card-training-eval";
import { cardContentHash, CRITIC_CHECKS, SEMANTIC_DOCUMENT_VERSION } from "../lib/generation/automatic-policy";
import { PROMPT_VERSION } from "../lib/generation/contracts";
import { QUALITY_GATE_VERSION } from "../lib/idea-card/quality-v2-2";

const card = { ...structuredClone(automaticCard), presenceMode: "Calm Expert Editor" };
const context = { category: { slug: "beauty" }, persona: { slug: "luxury_editor" }, platform: "instagram_reels" };
const training = buildCardTrainingContext({ ...context,
  eval_cases: [{ input_brief: "HELDOUT_ANSWER" }], api_key: "SECRET_NOT_ALLOWED", raw_text: "COPIED_RAW_CORPUS",
  category_layer_policy: { required_layers: ["visible_comparison"], generator_instructions: "Emit legacy category_layer_pack SECRET_LEGACY", practical_effects: { api_key: "SECRET_METADATA" } },
  trend_signals: [{ signal: "Observe packing decisions", metadata: { authorization: "SECRET_METADATA" } }],
});
const encodedContext = JSON.stringify(training);
for (const secret of ["HELDOUT_ANSWER", "SECRET_NOT_ALLOWED", "COPIED_RAW_CORPUS", "SECRET_LEGACY", "SECRET_METADATA"]) assert.ok(!encodedContext.includes(secret));
assert.ok(encodedContext.includes("visible_comparison"));
assert.ok(!JSON.stringify(buildCardTrainingContext({ trend_signals: [{ signal: "sk-test123456789secret" }] })).includes("sk-test"));
assert.equal(buildCardTrainingContext({ category: { slug: "comedy" } }).lesson, CARD_LANE_LESSONS.entertainment_comedy);
assert.equal(buildCardTrainingContext({ category: { slug: "fitness" } }).lesson, CARD_LANE_LESSONS.fitness_wellness_safe);
assert.equal(new Set(Object.values(CARD_LANE_LESSONS).map(lesson => lesson.objectives.join(" "))).size, 5);
assert.ok(CARD_WRITER_SYSTEM.includes("quantities"));
assert.ok(CARD_CRITIC_SYSTEM.includes("continuity"));
assert.ok(JSON.stringify(buildCardTrainingContext({ trend_signals: Array(1000).fill({ signal: "x".repeat(10000) }) })).length < 6000);

const concept = { conceptId: "fixture", title: card.title, premise: card.conceptSummary, proofPlan: "Apply the samples and compare the visible finish in the same window light.", viewerTakeaway: card.viewerTakeaway,
  hookId: card.hookId, shootFormat: card.shootFormat, mechanismIds: ["visible_comparison"], riskNotes: [],
  runtimeProfile: "single_proof", proofBeatCount: 1, spokenWordTarget: 30, shotCount: 4, locationCount: 1, cameraSetupCount: 2, resetCount: 0 };
const record = {
  source: { id: "original-1", familyId: "family-1", origin: "synthetic", rights: "synthetic_original", language: "en", pipeline: "idea_card_only" },
  context, concept, card,
  verification: { cardHash: await cardContentHash(card), promptVersion: PROMPT_VERSION, qualityGateVersion: QUALITY_GATE_VERSION,
    generator: { provider: "fixture", model: "writer" },
    critic: { identity: { provider: "fixture", model: "critic" }, result: { decision: "pass", issueCodes: [], editInstructions: [], checks: Object.fromEntries(CRITIC_CHECKS.map(key => [key, "pass"])) } },
    semantic: { maxSimilarity: .1, model: "fixture-not-real-embedding", revision: "a".repeat(40), documentVersion: SEMANTIC_DOCUMENT_VERSION, scope: "global", corpusComplete: true } },
};
const compiled = await compileCardTrainingDataset([record]);
assert.equal(compiled.manifest.accepted_count, 1, JSON.stringify(compiled.manifest.rejected));
assert.equal(compiled.manifest.training_ready, false, "One synthetic fixture is not a training corpus");
assert.equal(compiled.manifest.model_qualified, false);
const row = Object.values(compiled.splits).flat()[0];
assert.equal(row.messages[0].content, CARD_WRITER_SYSTEM);
assert.equal(row.messages[1].content, cardDraftPrompt(buildCardTrainingContext(context), concept, card.durationSeconds));
const target = JSON.parse(row.messages[2].content);
assert.equal(target.steps[0].editNote, null);
assert.equal(target.productionEstimate, undefined);
assert.ok(target.whyItWorks && target.hookId && target.presenceMode && target.personaSlug);
assert.throws(() => cardTrainingTarget({ ...card, whyItWorks: undefined }));
assert.throws(() => cardTrainingTarget({ ...card, category_layer_pack: {} }));

for (const mutation of [
  { ...record, source: { ...record.source, pipeline: "seo_content" } },
  { ...record, source: { ...record.source, rights: "unknown" } },
  { ...record, source: { ...record.source, language: "tr" } },
  { ...record, source: { ...record.source, rights: "owned" } },
  { ...record, verification: { ...record.verification, promptVersion: "old-prompt" } },
  { ...record, verification: { ...record.verification, cardHash: "0".repeat(64) } },
  { ...record, verification: { ...record.verification, semantic: { ...record.verification.semantic, maxSimilarity: .8 } } },
  { ...record, verification: { ...record.verification, semantic: { ...record.verification.semantic, corpusComplete: false } } },
  { ...record, verification: { ...record.verification, critic: { ...record.verification.critic, identity: record.verification.generator } } },
  { ...record, context: { ...context, category: { slug: "travel" } } },
  { ...record, card: { ...card, category_layer_pack: {} } },
]) assert.equal((await compileCardTrainingDataset([mutation])).manifest.accepted_count, 0);

const duplicate = structuredClone(record);
duplicate.source.id = "original-2";
duplicate.card.id = "different-database-id";
const dedup = await compileCardTrainingDataset([duplicate, record]);
assert.equal(dedup.manifest.accepted_count, 1);
assert.ok(dedup.manifest.rejected.some(item => item.row === 1 && item.codes.includes("duplicate_content_or_actions")));
assert.deepEqual((await compileCardTrainingDataset([record, duplicate])).splits, dedup.splits, "Input order cannot change retained targets");
const retimed = structuredClone(duplicate);
retimed.card.durationSeconds = 21;
retimed.card.steps[3].endSecond = 21;
retimed.verification.cardHash = await cardContentHash(retimed.card);
assert.equal((await compileCardTrainingDataset([record, retimed])).manifest.accepted_count, 1, "Changing IDs or duration does not make a new training example");
for (let i = 0; i < 100; i++) assert.equal(await cardTrainingSplit(`family-${i}`), await cardTrainingSplit(`family-${i}`));

const expected = [{ ...row, meta: { ...row.meta, split: "test" as const } }];
const validSample = { source_id: row.meta.source_id, output: target };
const goodEval = evaluateCardTrainingSamples(expected, [validSample]);
assert.equal(goodEval.diagnostic_passed, true);
assert.equal(goodEval.model_qualified, false);
for (const samples of [[], [validSample, validSample], [{ source_id: "other", output: target }], [{ ...validSample, output: "{\"schemaVersion\":2" }], [{ ...validSample, output: { ...target, durationSeconds: 60 } }]]) assert.equal(evaluateCardTrainingSamples(expected, samples).diagnostic_passed, false);

const migration = fs.readFileSync("supabase/migrations/20260831150000_card_training_curriculum.sql", "utf8");
for (const value of [PROMPT_VERSION, "guard_automatic_generation_run", "automatic_card_evidence_valid", "qualify_idea_model_profile", "guard_automatic_inventory_publication"]) assert.ok(migration.includes(value));
assert.ok(!migration.includes("idea-card-premium-v2.3.1-automatic"), "No stale SQL prompt allowance");
const python = fs.readFileSync("tools/card_sft_data.py", "utf8");
for (const value of [CARD_DATASET_VERSION, CARD_TRAINING_VERSION, PROMPT_VERSION]) assert.ok(python.includes(value), "Python preflight contract must match TypeScript");
console.log("Card training: curriculum, context isolation, provenance, quality, dedup, frozen splits and actual-generation eval passed");