import type { IdeaCard } from "../../lib/idea-card/types";

export const automaticCard: IdeaCard = {
  id: "automatic-fixture", title: "Skincare Texture Proof Test", schemaVersion: 2,
  conceptSummary: "Compare two skincare textures in window light and reveal which finish stays smooth after application.",
  viewerTakeaway: "Compare the visible skincare texture and finish before choosing a sample.",
  format: "Reels", platform: "instagram_reels", category: "beauty", personaSlug: "luxury_editor",
  audience: "Skincare buyers comparing finishes", durationSeconds: 20, difficulty: "easy",
  requiredItems: ["Mirror", "Two skincare samples"], hookId: "side_by_side_proof", shootFormat: "talking_head",
  whyItWorks: "A side-by-side texture comparison resolves the opening question.",
  overallProductionNotes: ["Lock exposure in neutral window light."],
  steps: [
    { id: "s1", order: 1, stage: "hook", startSecond: 0, endSecond: 4, purpose: "Open the texture question", goal: "Promise a visible comparison", action: "Hold both skincare samples beside the mirror", spokenLine: "Watch how these textures look in daylight.", shot: "Locked close-up", onScreenText: "Texture comparison" },
    { id: "s2", order: 2, stage: "context", startSecond: 4, endSecond: 8, purpose: "Set a fair comparison", goal: "Show equal quantities", action: "Place one measured drop of each sample on opposite hands", spokenLine: "One drop on each side.", shot: "Overhead macro", onScreenText: "Equal amounts" },
    { id: "s3", order: 3, stage: "demonstration", startSecond: 8, endSecond: 15, purpose: "Show the visible texture", goal: "Compare the two finishes", action: "Apply both samples and tilt both hands toward the window to compare their finishes", spokenLine: "Look at the finish in the same light.", shot: "Locked macro", onScreenText: "Same light" },
    { id: "s4", order: 4, stage: "takeaway", startSecond: 15, endSecond: 20, purpose: "Resolve the comparison", goal: "Identify the smoother skincare texture", action: "Point to the smoother side and show both textures side by side", spokenLine: "This side looks smoother in this light.", shot: "Medium close-up", onScreenText: "Visible texture" },
  ],
};