import assert from "node:assert/strict";
import { evaluateIdeaCardV22 } from "../lib/idea-card/quality-v2-2";

const baseCard = {
  id: "quality-v22-fixture",
  title: "Skincare Texture Proof Test",
  conceptSummary: "Compare two skincare textures in window light and reveal which finish stays smooth after application.",
  format: "Reels",
  category: "beauty",
  platform: "instagram_reels",
  audience: "Skincare buyers comparing finishes",
  durationSeconds: 20,
  difficulty: "easy",
  requiredItems: ["Mirror", "Two skincare samples", "Timer"],
  viewerTakeaway: "You can compare skincare texture and finish before choosing a sample.",
  whyItWorks: "A visible side-by-side texture test resolves the opening question.",
  hookId: "side_by_side_proof",
  shootFormat: "talking_head",
  personaSlug: "luxury_editor",
  overallProductionNotes: ["Use neutral window light", "Lock exposure before applying samples"],
  schemaVersion: 2,
  steps: [
    { id: "s1", order: 1, stage: "hook", startSecond: 0, endSecond: 4, purpose: "Open the texture question", goal: "Promise a visible comparison", action: "Hold both samples beside the mirror in a tight close-up", spokenLine: "Watch which texture stays smooth after this test.", shot: "Locked close-up", onScreenText: "Texture test" },
    { id: "s2", order: 2, stage: "context", startSecond: 4, endSecond: 8, purpose: "Set a fair comparison", goal: "Show equal sample amounts", action: "Place one measured drop of each sample on opposite hands", spokenLine: "I am using one drop on each side.", shot: "Overhead macro", onScreenText: "One drop each" },
    { id: "s3", order: 3, stage: "demonstration", startSecond: 8, endSecond: 15, purpose: "Capture visible proof", goal: "Compare absorption and finish", action: "Press both samples in, start the timer, then tilt hands toward the window", spokenLine: "Look at the finish after thirty seconds.", shot: "Macro push-in", onScreenText: "30 seconds" },
    { id: "s4", order: 4, stage: "takeaway", startSecond: 15, endSecond: 20, purpose: "Resolve the promise", goal: "Name the smoother skincare finish", action: "Point to the smoother side and show both textures side by side", spokenLine: "This side stays smoother without hiding the texture.", shot: "Medium close-up", onScreenText: "Smoother finish" },
  ],
};

const premium = evaluateIdeaCardV22(baseCard);
assert.equal(premium.decision, "approve");
assert.ok(premium.craftScore >= 88);

const generic = evaluateIdeaCardV22({ ...baseCard, category: "", personaSlug: "", steps: baseCard.steps.map((step) => ({ ...step, action: "Be energetic and make the scene engaging", shot: "Film this" })) });
assert.notEqual(generic.decision, "approve");
assert.ok(generic.issueCodes.includes("weak_physical_actions"));

const mismatch = evaluateIdeaCardV22({ ...baseCard, viewerTakeaway: "A packing checklist for a mountain trip.", steps: baseCard.steps.map((step, index) => index === 2 ? { ...step, purpose: "Tell a story", goal: "Keep talking", action: "Walk across the room", onScreenText: "" } : step) });
assert.ok(mismatch.issueCodes.includes("hook_payoff_mismatch") || mismatch.hardGateCodes.includes("missing_proof_beat"));

const duplicate = evaluateIdeaCardV22(baseCard, { semanticScore: 0.87, embeddingModel: "multilingual-minilm", embeddingModelVersion: "v1" });
assert.equal(duplicate.decision, "reject");
assert.ok(duplicate.hardGateCodes.includes("semantic_duplicate"));

const review = evaluateIdeaCardV22(baseCard, { semanticScore: 0.8 });
assert.equal(review.decision, "human_review_required");

const unsafe = evaluateIdeaCardV22({ ...baseCard, conceptSummary: "This guaranteed treatment cures acne with no side effects." });
assert.equal(unsafe.decision, "reject");
assert.ok(unsafe.hardGateCodes.includes("unsafe_or_unbounded_claim"));

console.log("quality-v2.2 fixtures passed");