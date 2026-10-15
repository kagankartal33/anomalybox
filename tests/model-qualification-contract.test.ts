import assert from "node:assert/strict";
import {
  isQualificationGoldEligible,
  profileMatchesQualificationContract,
  criticMatchesQualificationContract,
} from "../lib/generation/qualification";
import { GENERATION_PIPELINE_VERSION, modelContract } from "../lib/generation/automatic-policy";
import { CREATIVE_SCHEDULER_VERSION } from "../lib/generation/creative-taxonomy";
import { CONCEPT_RANKER_VERSION } from "../lib/generation/concept-ranking";
import { DURATION_PLANNER_VERSION } from "../lib/idea-card/duration-planner";

const contract = {
  promptVersion: "prompt-v2",
  schemaVersion: 2,
  qualityGateVersion: "gate-v2",
};
const approvedProfile = {
  enabled: true,
  qualification_status: "approved",
  qualification_metrics: { qualification_mode: "automatic-v3", pipeline_version: GENERATION_PIPELINE_VERSION, scheduler_version: CREATIVE_SCHEDULER_VERSION, concept_ranker_version: CONCEPT_RANKER_VERSION, duration_planner_version: DURATION_PLANNER_VERSION },
  qualified_prompt_version: "prompt-v2",
  qualified_schema_version: 2,
  qualified_quality_gate_version: "gate-v2",
  qualification_eval_id: "eval-1",
};
assert.equal(profileMatchesQualificationContract(approvedProfile, contract), true);
assert.equal(profileMatchesQualificationContract({ ...approvedProfile, qualified_prompt_version: "prompt-v1" }, contract), false);
assert.equal(profileMatchesQualificationContract({ ...approvedProfile, qualified_quality_gate_version: "gate-v1" }, contract), false);
assert.equal(profileMatchesQualificationContract({ ...approvedProfile, enabled: false }, contract), false);
assert.equal(profileMatchesQualificationContract({ ...approvedProfile, qualification_metrics: { ...approvedProfile.qualification_metrics, scheduler_version: "stale" } }, contract), false);

const critic = { id: "qualified-critic", profile_slug: "critic", enabled: true, provider: "provider-a", model: "critic-model" };
const qualifiedPair = { ...approvedProfile, provider: "provider-a", model: "writer-model", features: { critic_profile_slug: critic.profile_slug }, qualification_metrics: { ...approvedProfile.qualification_metrics, critic_profile_id: critic.id, critic_snapshot: modelContract(critic) } };
assert.equal(criticMatchesQualificationContract(qualifiedPair, critic), true);
assert.equal(criticMatchesQualificationContract(qualifiedPair, { ...critic, id: "replacement-critic" }), false, "Same slug and contract cannot substitute a different critic identity");
assert.equal(criticMatchesQualificationContract(qualifiedPair, { ...critic, model: "unqualified-model" }), false);
assert.equal(criticMatchesQualificationContract(qualifiedPair, { ...critic, profile_slug: "archived-critic" }), false, "A renamed critic cannot reactivate an old evaluation through its unchanged ID and model contract");
assert.equal(criticMatchesQualificationContract({ ...qualifiedPair, features: {} }, critic), false, "Missing configured critic alias fails closed");
assert.equal(criticMatchesQualificationContract(qualifiedPair, { ...critic, enabled: false }), false);
assert.equal(criticMatchesQualificationContract(approvedProfile, critic), false, "Missing critic qualification evidence fails closed");

const expected = {
  pilotCategories: ["beauty", "food"],
  runIds: new Set(["run-1"]),
  provider: "provider-a",
  model: "model-a",
  promptVersion: "prompt-v2",
};
const generated = {
  source: "generated",
  category_slug: "beauty",
  generation_run_id: "run-1",
  provider: "provider-a",
  model: "model-a",
  prompt_version: "prompt-v2",
};
assert.equal(isQualificationGoldEligible(generated, expected), true);
assert.equal(isQualificationGoldEligible({ ...generated, generation_run_id: "run-2" }, expected), false);
assert.equal(isQualificationGoldEligible({ ...generated, provider: "provider-b" }, expected), false);
assert.equal(isQualificationGoldEligible({ ...generated, prompt_version: "prompt-v1" }, expected), false);
assert.equal(isQualificationGoldEligible({ ...generated, category_slug: "unknown" }, expected), false);
assert.equal(isQualificationGoldEligible({ ...generated, source: "existing_stock", generation_run_id: null }, expected), true);
assert.equal(isQualificationGoldEligible({ ...generated, source: "manual" }, expected), false);

console.log("model qualification contract fixtures passed");
