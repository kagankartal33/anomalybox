import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { automaticCard, automaticConcept } from "./fixtures/automatic-card";
import { CARD_TRAINING_VERSION, CARD_LANE_LESSONS, CARD_WRITER_SYSTEM, CARD_CRITIC_SYSTEM, buildCardTrainingContext, cardDraftPrompt } from "../lib/generation/card-training";
import { CARD_DATASET_VERSION, cardTrainingSplit, cardTrainingTarget, compileCardTrainingDataset } from "../lib/generation/card-training-dataset";
import { evaluateCardTrainingSamples } from "../lib/generation/card-training-eval";
import { cardContentHash, CRITIC_CHECKS, SEMANTIC_DOCUMENT_VERSION, semanticDocument, sha256 } from "../lib/generation/automatic-policy";
import { PROMPT_VERSION } from "../lib/generation/contracts";
import { QUALITY_GATE_VERSION } from "../lib/idea-card/quality-v2-2";

const card = structuredClone(automaticCard);
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
assert.equal(new Set(Object.values(CARD_LANE_LESSONS).map(lesson => lesson.objectives.join(" "))).size, 12);
assert.ok(CARD_WRITER_SYSTEM.includes("quantities"));
assert.ok(CARD_CRITIC_SYSTEM.includes("continuity"));
assert.ok(JSON.stringify(buildCardTrainingContext({ trend_signals: Array(1000).fill({ signal: "x".repeat(10000) }) })).length < 6000);

const concept = structuredClone(automaticConcept);
const record = {
  source: { id: "original-1", familyId: "family-1", origin: "synthetic", rights: "synthetic_original", language: "en", pipeline: "idea_card_only" },
  context, concept, card,
  verification: { cardHash: await cardContentHash(card), promptVersion: PROMPT_VERSION, qualityGateVersion: QUALITY_GATE_VERSION,
    generator: { provider: "fixture", model: "writer" },
    critic: { identity: { provider: "fixture", model: "critic" }, result: { decision: "pass", issueCodes: [], editInstructions: [], checks: Object.fromEntries(CRITIC_CHECKS.map(key => [key, "pass"])) } },
    semantic: { maxSimilarity: .1, sourceTextHash: await sha256(semanticDocument(card)), model: "fixture-not-real-embedding", revision: "a".repeat(40), documentVersion: SEMANTIC_DOCUMENT_VERSION, scope: "global", corpusComplete: true } },
};
const compiled = await compileCardTrainingDataset([record]);
assert.equal(compiled.manifest.accepted_count, 1, JSON.stringify(compiled.manifest.rejected));
assert.equal(compiled.manifest.training_ready, false, "One synthetic fixture is not a training corpus");
assert.equal(compiled.manifest.model_qualified, false);
const row = Object.values(compiled.splits).flat()[0];
assert.equal(row.messages[0].content, CARD_WRITER_SYSTEM);
assert.equal(row.messages[1].content, cardDraftPrompt(buildCardTrainingContext(context), concept, card.durationSeconds));
const target = JSON.parse(row.messages[2].content);
assert.equal(target.steps[0].editNote, card.steps[0].editNote);
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
  { ...record, verification: { ...record.verification, semantic: { ...record.verification.semantic, sourceTextHash: "0".repeat(64) } } },
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

const migration = fs.readFileSync("supabase/migrations/20260831150000_card_training_curriculum.sql", "utf8")
  + fs.readFileSync("supabase/migrations/20260901090000_professional_card_generation_v3.sql", "utf8");
for (const value of [PROMPT_VERSION, "guard_automatic_generation_run", "automatic_card_evidence_valid", "qualify_idea_model_profile", "guard_automatic_inventory_publication"]) assert.ok(migration.includes(value));
assert.ok(!migration.includes("idea-card-premium-v2.3.1-automatic"), "No stale SQL prompt allowance");
const python = fs.readFileSync("tools/card_sft_data.py", "utf8");
for (const value of [CARD_DATASET_VERSION, CARD_TRAINING_VERSION, PROMPT_VERSION]) assert.ok(python.includes(value), "Python preflight contract must match TypeScript");

const tempRoot = fs.realpathSync(os.tmpdir());
const temporary = fs.mkdtempSync(path.join(tempRoot, "viralbox-training-test-"));
try {
  const source = path.join(temporary, "verified-fixture.jsonl"), output = path.join(temporary, "export");
  const testRecord = structuredClone(record);
  for (let i = 0; ; i++) {
    if (await cardTrainingSplit(`test-family-${i}`) === "test") { testRecord.source.familyId = `test-family-${i}`; break; }
  }
  fs.writeFileSync(source, JSON.stringify(testRecord) + "\n");
  const cli = path.resolve("node_modules/tsx/dist/cli.mjs");
  const buildArgs = [cli, "tools/build-card-training.ts", "--input", source, "--out", output];
  let result = spawnSync(process.execPath, buildArgs, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).accepted_count, 1);
  result = spawnSync(process.execPath, buildArgs, { encoding: "utf8" });
  assert.equal(result.status, 1, "Replaying an export must not overwrite existing data");
  const generated = path.join(temporary, "generations.jsonl");
  fs.writeFileSync(generated, JSON.stringify(validSample) + "\n");
  result = spawnSync(process.execPath, [cli, "tools/eval-card-training.ts", "--dataset", output, "--samples", generated], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).model_qualified, false);
  fs.appendFileSync(path.join(output, "test.jsonl"), "\n");
  result = spawnSync(process.execPath, [cli, "tools/eval-card-training.ts", "--dataset", output, "--samples", generated], { encoding: "utf8" });
  assert.equal(result.status, 1, "Frozen test tampering must fail before evaluation");
  // Restore only this test-owned fixture byte, not arbitrary user data.
  const testFile = path.join(output, "test.jsonl");
  fs.writeFileSync(testFile, fs.readFileSync(testFile, "utf8").slice(0, -1));
  if (process.argv.includes("--tokenizer-smoke")) {
    const smoke = [
      "import sys,re,json",
      "from pathlib import Path",
      "sys.path.insert(0, 'tools')",
      "from card_sft_data import configure_training_cache,load_verified_dataset,encode_response_only",
      "configure_training_cache(Path('.cache/card-training'))",
      "from huggingface_hub import try_to_load_from_cache",
      "from transformers import AutoTokenizer",
      "cached = try_to_load_from_cache('Qwen/Qwen2.5-1.5B-Instruct', 'tokenizer_config.json')",
      "revision = re.search(r'snapshots[/\\\\]([a-f0-9]{40})', str(cached)).group(1)",
      "tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen2.5-1.5B-Instruct', revision=revision, trust_remote_code=False, local_files_only=True)",
      "_,splits = load_verified_dataset(Path(sys.argv[1]), require_ready=False)",
      "encoded = encode_response_only(splits['test'][0], tokenizer, 4096)",
      "masked = sum(label == -100 for label in encoded['labels'])",
      "assert 0 < masked < len(encoded['input_ids'])",
      "print(json.dumps({'cached_tokenizer_revision':revision,'full_sequence_tokens':len(encoded['input_ids']),'masked_prompt_tokens':masked,'assistant_tokens':len(encoded['input_ids'])-masked,'gpu_training':False}))",
    ].join("\n");
    const smokeResult = spawnSync("python", ["-c", smoke, output], { encoding: "utf8", timeout: 120000 });
    assert.equal(smokeResult.status, 0, smokeResult.stderr);
    console.log(smokeResult.stdout.trim());
  }
} finally {
  assert.equal(path.dirname(temporary), tempRoot);
  assert.ok(path.basename(temporary).startsWith("viralbox-training-test-"));
  fs.rmSync(temporary, { recursive: true });
}
console.log("Card training: curriculum, context isolation, provenance, quality, dedup, frozen splits and actual-generation eval passed");
