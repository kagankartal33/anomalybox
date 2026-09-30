import assert from "node:assert/strict";
import {
  isQualificationGoldEligible,
  profileMatchesQualificationContract,
} from "../lib/generation/qualification";

const contract = {
  promptVersion: "prompt-v2",
  schemaVersion: 2,
  qualityGateVersion: "gate-v2",
};
const approvedProfile = {
  enabled: true,
  qualification_status: "approved",
  qualified_prompt_version: "prompt-v2",
  qualified_schema_version: 2,
  qualified_quality_gate_version: "gate-v2",
  qualification_eval_id: "eval-1",
};
assert.equal(profileMatchesQualificationContract(approvedProfile, contract), true);
assert.equal(profileMatchesQualificationContract({ ...approvedProfile, qualified_prompt_version: "prompt-v1" }, contract), false);
assert.equal(profileMatchesQualificationContract({ ...approvedProfile, qualified_quality_gate_version: "gate-v1" }, contract), false);
assert.equal(profileMatchesQualificationContract({ ...approvedProfile, enabled: false }, contract), false);

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