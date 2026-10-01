import type { IdeaCard } from "../../lib/idea-card/types";
import type { CreativeRecipe } from "../../lib/generation/creative-taxonomy";

export const automaticRecipe: CreativeRecipe = {
  taxonomyVersion: "creative-taxonomy-v1",
  genreId: "controlled_comparison",
  hookTypeId: "visible_constraint",
  hookDeliveryId: "visual_action",
  promiseTypeId: "compare_choices",
  emotionArcId: "curiosity_to_clarity",
  vibePresetId: "clean_editorial",
  proofDeviceId: "controlled_side_by_side",
  payoffTypeId: "side_by_side_decision",
  audienceActionId: "save_reference",
  shootFormat: "talking_head",
  presenceMode: "editorial_insider",
};

export const automaticConcept = {
  conceptId: "texture-proof",
  title: "Skincare Texture Proof Test",
  premise: "Compare two skincare textures under the same light and reveal the visible finish.",
  recipe: automaticRecipe,
  hookId: automaticRecipe.hookTypeId,
  shootFormat: automaticRecipe.shootFormat,
  firstFramePlan: "Hold both skincare samples beside the mirror in a locked close-up.",
  soundPlan: "Use clean natural speech with quiet room tone and audible product handling.",
  emotionBeatPlan: { opening: "curiosity about the two textures", middle: "clarity through equal application", payoff: "clarity from the visible side-by-side finish" },
  proofPlan: "Apply equal drops and compare both finishes in the same locked exposure.",
  viewerTakeaway: "Compare visible texture and finish before choosing a sample.",
  mechanismIds: ["visible_constraint", "controlled_side_by_side"],
  riskNotes: [],
  runtimeProfile: "single_proof" as const,
  proofBeatCount: 1,
  spokenWordTarget: 35,
  shotCount: 4,
  locationCount: 1,
  cameraSetupCount: 2,
  resetCount: 0,
};

export const automaticCard: IdeaCard = {
  id: "automatic-fixture", title: "Skincare Texture Proof Test", schemaVersion: 2,
  conceptSummary: "Compare two skincare textures in window light and reveal which finish stays smooth after application.",
  viewerTakeaway: "Compare the visible skincare texture and finish before choosing a sample.",
  format: "Reels", platform: "instagram_reels", category: "beauty", personaSlug: "luxury_editor",
  audience: "Skincare buyers comparing finishes", durationSeconds: 20, difficulty: "easy",
  requiredItems: ["Mirror", "Two skincare samples"], hookId: automaticRecipe.hookTypeId, shootFormat: automaticRecipe.shootFormat, presenceMode: automaticRecipe.presenceMode,
  whyItWorks: "A side-by-side texture comparison resolves the opening question.",
  overallProductionNotes: [
    "Shoot original footage vertically in 9:16 and lock exposure in neutral window light.",
    "Keep text, hands, and the visible comparison within the Reels safe zone.",
  ],
  steps: [
    { id: "s1", order: 1, stage: "hook", startSecond: 0, endSecond: 4, purpose: "Open the texture question", goal: "Promise a visible comparison", action: "Hold both skincare samples beside the mirror", spokenLine: "Watch how these textures look in daylight.", shot: "Locked close-up", onScreenText: "Texture comparison", editNote: "Hold the first frame long enough to see both samples.", performanceNote: "Use a calm, curious delivery." },
    { id: "s2", order: 2, stage: "context", startSecond: 4, endSecond: 8, purpose: "Set a fair comparison", goal: "Show equal quantities", action: "Place one measured drop of each sample on opposite hands", spokenLine: "One drop on each side.", shot: "Overhead macro", onScreenText: "Equal amounts", editNote: "Cut only after both drops are visible.", performanceNote: "Keep the explanation precise." },
    { id: "s3", order: 3, stage: "demonstration", startSecond: 8, endSecond: 15, purpose: "Show the visible texture", goal: "Compare the two finishes", action: "Apply both samples and tilt both hands toward the window to compare their finishes", spokenLine: "Look at the finish in the same light.", shot: "Locked macro", onScreenText: "Same light", editNote: "Keep exposure and framing unchanged.", performanceNote: "Pause while the finishes are visible." },
    { id: "s4", order: 4, stage: "takeaway", startSecond: 15, endSecond: 20, purpose: "Resolve the comparison", goal: "Identify the smoother skincare texture", action: "Point to the smoother side and show both textures side by side", spokenLine: "This side looks smoother in this light.", shot: "Medium close-up", onScreenText: "Visible texture", editNote: "End on the complete side-by-side result.", performanceNote: "State only the visible observation." },
  ],
};