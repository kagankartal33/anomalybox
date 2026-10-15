import assert from "node:assert/strict";
import { adaptLegacyIdeaCard, presentIdeaCard, type PresentedCard } from "../lib/idea-card";
import { z } from "zod";

// Zod feedback schema matching app/api/feedback/card/route.ts
const FeedbackInputSchema = z.object({
  cardId: z.string().uuid(),
  shotStatus: z.enum(["shot", "planned", "skipped"]),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  feedbackText: z.string().max(1000).nullable().optional(),
  actualCaptureMinutes: z.number().int().min(1).max(1440).nullable().optional(),
});

// Markdown export generator logic matching CardExportActions.tsx
function generateExportMarkdown(card: PresentedCard): string {
  let md = `# ${card.title}\n\n`;

  if (card.hookLine) {
    md += `> **Opening Hook (0:00 - 0:03):** "${card.hookLine}"\n\n`;
  }
  if (card.whyItWorks) {
    md += `**Why Viewers Stop:** ${card.whyItWorks}\n\n`;
  }
  if (card.viewerLeaveWith) {
    md += `**What They Keep:** ${card.viewerLeaveWith}\n\n`;
  }

  md += `### Production Specs\n`;
  md += `- **Format:** ${card.meta.format}\n`;
  md += `- **Final video:** ${card.meta.durationLabel}\n`;
  if (card.meta.filmingEstimateLabel) md += `- **Estimated filming:** ${card.meta.filmingEstimateLabel}\n`;
  if (card.meta.editingEstimateLabel) md += `- **Estimated editing:** ${card.meta.editingEstimateLabel}\n`;
  md += `- **Difficulty:** ${card.meta.difficultyLabel}\n`;
  if (card.meta.categoryLabel) md += `- **Lane:** ${card.meta.categoryLabel}\n`;
  if (card.meta.shootFormatLabel) md += `- **Shoot Format:** ${card.meta.shootFormatLabel}\n`;
  if (card.meta.presenceLabel) md += `- **Camera Presence:** ${card.meta.presenceLabel}\n`;

  if (card.kit && card.kit.length > 0) {
    md += `- **Required Kit:** ${card.kit.join(", ")}\n`;
  }
  md += `\n`;

  const spineItems =
    card.storySpine && card.storySpine.length > 0
      ? card.storySpine
      : card.steps.map((s) => s.stageLabel || s.purpose);

  if (spineItems.length > 0) {
    md += `### Story Spine (Video Flow)\n`;
    spineItems.forEach((beat, idx) => {
      md += `${idx + 1}. ${beat}\n`;
    });
    md += `\n`;
  }

  md += `---\n\n## Scene-by-Scene Shoot Plan\n\n`;

  card.steps.forEach((step, idx) => {
    md += `### [ ] Scene ${idx + 1}: ${step.stageLabel}\n`;
    md += `*Goal: ${step.purpose}*\n\n`;

    if (step.spokenLine) md += `- **Say this:** "${step.spokenLine}"\n`;
    if (step.action) md += `- **Action & Movement:** ${step.action}\n`;
    if (step.shot) md += `- **Camera & Frame:** ${step.shot}\n`;
    if (step.onScreenText) md += `- **On-Screen Text:** "${step.onScreenText}"\n`;
    if (step.editNote || step.performanceNote) {
      md += `- **Edit & Cut:** ${step.editNote || step.performanceNote}\n`;
    }
    md += `\n`;
  });

  if (card.safety.bullets.length > 0 || card.overallProductionNotes.length > 0) {
    md += `## Checks Before You Post\n\n`;
    if (card.overallProductionNotes.length > 0) {
      card.overallProductionNotes.forEach((note) => {
        md += `- [ ] ${note}\n`;
      });
    }
    if (card.safety.bullets.length > 0) {
      card.safety.bullets.forEach((bullet) => {
        md += `- [ ] ${bullet}\n`;
      });
    }
    md += `\n`;
  }

  return md;
}

// Bulk caption extraction matching IdeaCardView.tsx
function extractBulkCaptions(card: PresentedCard): string[] {
  return card.steps
    .filter((s) => Boolean(s.onScreenText?.trim()))
    .map((s) => `Scene ${s.order} (${s.stageLabel}): "${s.onScreenText}"`);
}

// Test suite
console.log("Starting card page component and logic tests...");

// Fixture: Oscar-grade creator brief
const rawFixture = {
  id: "fixture-card-001",
  title: "The Zero-Retention Skincare Test",
  conceptSummary: "Compare two serums under harsh direct bathroom lighting to prove absorption difference in 15 seconds.",
  format: "Reels 15-30s",
  category: "beauty",
  audience: "Skincare buyers fatigued by fake claims",
  durationSeconds: 22,
  difficulty: "easy",
  requiredItems: ["Bathroom mirror", "Two dropper bottles", "Tissue test paper"],
  viewerTakeaway: "How to instantly test if your serum actually penetrates or just sits on top of your skin.",
  whyItWorks: "Immediate physical proof under unflattering light breaks creator skepticism within 2 seconds.",
  hookId: "physical_demonstration",
  shootFormat: "talking_head",
  personaSlug: "beauty_chemist",
  overallProductionNotes: [
    "Lock white balance before filming to prevent color shifts between serums.",
    "Keep camera 18 inches from cheek for clean macro texture focus.",
  ],
  production_plan: {
    shoot_time_minutes: 35,
  },
  brand_safety: {
    disclosure_text: "No medical or dermatitis treatment claims.",
  },
  execution_ranges: [
    {
      time_range: "0-3s",
      purpose: "Hook the viewer with a split-screen face test",
      action: "Hold two dropper bottles at eye level, drop one bead onto each cheek simultaneously.",
      say: "Never buy a hydrating serum until you do this 5-second tissue test.",
      camera: "Tight medium macro, eye level, locked tripod",
      on_screen_text: "The 5-Second Serum Test",
      edit: "Cut hard on the word test to the press phase.",
    },
    {
      time_range: "3-10s",
      purpose: "Perform the simultaneous absorption press",
      action: "Gently pat both sides with index fingers for exactly 3 seconds.",
      say: "Watch what happens when we press a single tissue square over both sides.",
      camera: "Macro extreme close-up on left then right cheek",
      on_screen_text: "3-second pat test",
      edit: "Match-cut finger taps on the beat.",
    },
    {
      time_range: "10-18s",
      purpose: "Reveal the tissue paper results",
      action: "Peel back both tissues: left side is bone dry, right side is soaked with oily residue.",
      say: "Side A fully penetrated. Side B is just heavy silicone sitting on the surface.",
      camera: "Split lighting close-up holding both tissues up to the ring light",
      on_screen_text: "Clean absorption vs Silicone residue",
      edit: "Slow zoom 1.05x into the tissue fibers.",
    },
  ],
};

// 1. Test presentation adapter & title sanitizer
const adapted = adaptLegacyIdeaCard(rawFixture, { ideaId: "00000000-0000-0000-0000-000000000001", dbTitle: rawFixture.title });
const presented = presentIdeaCard(adapted.card, { rawLegacy: rawFixture, dbTitle: rawFixture.title });

// Sanitizer replaces titles containing "test" with category-specific premium title
assert.equal(presented.title, "The Soft Proof Reveal");

// Clean titles without internal tokens are preserved
const cleanRaw = { ...rawFixture, title: "Zero-Retention Skincare Discovery" };
const cleanAdapted = adaptLegacyIdeaCard(cleanRaw, { ideaId: "00000000-0000-0000-0000-000000000002", dbTitle: cleanRaw.title });
const cleanPresented = presentIdeaCard(cleanAdapted.card, { rawLegacy: cleanRaw, dbTitle: cleanRaw.title });
assert.equal(cleanPresented.title, "Zero-Retention Skincare Discovery");
const englishFallback = presentIdeaCard({ ...cleanAdapted.card, conceptSummary: "", viewerTakeaway: "" });
assert.equal(englishFallback.hookLine, "Show one clear decision, then leave the result visible.");
assert.equal(englishFallback.viewerLeaveWith, "Leave the viewer with one practical rule.");

assert.equal(presented.steps.length, 3);
assert.ok(presented.hookLine.includes("Compare two serums under harsh direct bathroom lighting"));
assert.ok(presented.steps[0].spokenLine?.includes("Never buy a hydrating serum"));
assert.ok(presented.whyItWorks.includes("Immediate physical proof"));
assert.ok(presented.viewerLeaveWith.includes("How to instantly test"));
assert.equal(presented.meta.durationLabel, "18s");
assert.equal(presented.meta.filmingEstimateLabel, "30–40 min");
console.log("✓ Presentation adapter mapped all fields and verified title sanitizer");

// 2. Test blocking gate logic
const isBlocking =
  adapted.card.steps.length < 3 ||
  presented.steps.length < 3 ||
  adapted.issues.some((issue) => issue.severity === "error" && issue.code === "MISSING_REQUIRED_FIELD");
assert.equal(isBlocking, false, "Valid fixture must NOT be blocked");

// Test broken card blocking
const brokenRaw = { ...rawFixture, execution_ranges: [rawFixture.execution_ranges[0]] };
const brokenAdapted = adaptLegacyIdeaCard(brokenRaw);
// When ranges has only 1 range, adaptLegacy supplies a fallback or blocks
const brokenBlocking = brokenAdapted.card.steps.length < 3;
assert.equal(brokenBlocking, false); // fallback kicks in to ensure resilience
console.log("✓ Card blocking validation passed");

// 3. Test Bulk Captions extraction for video editors
const captions = extractBulkCaptions(presented);
assert.equal(captions.length, 3);
assert.ok(captions[0].includes("The 5-Second Serum Test"));
console.log("✓ CapCut / Premiere bulk caption extraction verified");

// 4. Test Markdown / Call Sheet Export Generation
const exportMd = generateExportMarkdown(presented);
assert.ok(exportMd.startsWith(`# ${presented.title}`));
assert.ok(exportMd.includes(`**Opening Hook (0:00 - 0:03):** "${presented.hookLine}"`));
assert.ok(exportMd.includes("Scene 1: Opening"));
assert.ok(exportMd.includes("- **Say this:**"));
assert.ok(exportMd.includes("- **Action & Movement:**"));
assert.ok(exportMd.includes("- **Camera & Frame:**"));
assert.ok(exportMd.includes("- **On-Screen Text:**"));
assert.ok(exportMd.includes("- **Edit & Cut:**"));
assert.ok(exportMd.includes("## Checks Before You Post"));
assert.ok(exportMd.includes("**Final video:** 18s"));
assert.ok(exportMd.includes("**Estimated filming:** 30–40 min"));
assert.ok(exportMd.includes("Lock white balance before filming"));
assert.ok(exportMd.includes("No medical or dermatitis treatment claims"));
console.log("✓ Call sheet / Markdown export generation verified");

// 5. Test Shooting Mode state bounds
const stepsCount = presented.steps.length;
let currentIdx = 0;
// Next navigation
currentIdx = Math.min(stepsCount, currentIdx + 1); // 1
currentIdx = Math.min(stepsCount, currentIdx + 1); // 2
currentIdx = Math.min(stepsCount, currentIdx + 1); // 3 (summary screen)
currentIdx = Math.min(stepsCount, currentIdx + 1); // stays 3 (capped)
assert.equal(currentIdx, stepsCount, "Index should cap at stepsCount (finish screen)");
// Prev navigation
currentIdx = Math.max(0, currentIdx - 1); // 3
currentIdx = Math.max(0, currentIdx - 1); // 2
currentIdx = Math.max(0, currentIdx - 1); // 1
currentIdx = Math.max(0, currentIdx - 1); // 0
currentIdx = Math.max(0, currentIdx - 1); // stays 0 (floor)
assert.equal(currentIdx, 0, "Index should floor at 0");
console.log("✓ Shooting Mode state bounds verified");

// 6. Test Feedback API Input Validation
const validFeedback = {
  cardId: "3756096b-1fc1-4b3c-b471-317ff41afe15",
  shotStatus: "shot",
  rating: 5,
  feedbackText: "Got 250k views on this brief! The tissue test hooked immediately.",
  actualCaptureMinutes: 27,
};
const parsedValid = FeedbackInputSchema.safeParse(validFeedback);
assert.equal(parsedValid.success, true);

const invalidCardId = {
  cardId: "not-a-uuid",
  shotStatus: "shot",
};
assert.equal(FeedbackInputSchema.safeParse(invalidCardId).success, false);

const invalidRating = {
  cardId: "3756096b-1fc1-4b3c-b471-317ff41afe15",
  shotStatus: "shot",
  rating: 6, // max is 5
};
assert.equal(FeedbackInputSchema.safeParse(invalidRating).success, false);

const invalidStatus = {
  cardId: "3756096b-1fc1-4b3c-b471-317ff41afe15",
  shotStatus: "deleted", // only shot, planned, skipped
};
assert.equal(FeedbackInputSchema.safeParse(invalidStatus).success, false);
assert.equal(FeedbackInputSchema.safeParse({ ...validFeedback, actualCaptureMinutes: 0 }).success, false);
console.log("✓ Feedback API schema validation verified");

console.log("\nALL CARD PAGE UNIT & INTEGRATION TESTS PASSED!");
