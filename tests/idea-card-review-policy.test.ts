import assert from "node:assert/strict";
import {
  candidateStatusForQualityDecision,
  resolveQualityDecision,
  schemaV2BrandSafetyScore,
} from "../lib/idea-card/review-policy";

assert.equal(
  schemaV2BrandSafetyScore({ flagCount: 0, severity: "clear", categoryRiskLevel: "low" }),
  100,
  "a clean schema-v2 card must not fail because it omits legacy brand_safety fields",
);
assert.ok(
  schemaV2BrandSafetyScore({ flagCount: 2, severity: "refine", categoryRiskLevel: "low" }) < 70,
  "multiple classifier findings must materially lower brand safety",
);
assert.equal(resolveQualityDecision("approve", false), "approve");
assert.equal(resolveQualityDecision("approve", true), "human_review_required");
assert.equal(resolveQualityDecision("refine", true), "human_review_required");
assert.equal(resolveQualityDecision("reject", true), "reject");
assert.equal(candidateStatusForQualityDecision("approve"), "ready");
assert.equal(candidateStatusForQualityDecision("human_review_required"), "human_review_required");

console.log("idea-card review policy fixtures passed");