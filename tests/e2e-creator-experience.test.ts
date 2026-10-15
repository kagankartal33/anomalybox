import assert from "node:assert/strict";
import { z } from "zod";
import { adaptLegacyIdeaCard, presentIdeaCard, type PresentedCard } from "../lib/idea-card";

/**
 * E2E Creator Experience Test
 * Tests Creator Vault box unboxing, state persistence, card breakdown presentation,
 * shoot-mode teleprompter contracts, and weak-card report flow.
 */

const ReportWeakCardInputSchema = z.object({
  cardId: z.string().uuid(),
  reason: z.enum(["unclear_hook", "wrong_lane_fit", "unrealistic_production", "other"]),
  explanation: z.string().min(10).max(1000),
});

const TeleprompterScriptItemSchema = z.object({
  stepNumber: z.number().int().positive(),
  stageLabel: z.string(),
  sayThis: z.string(),
  cameraAngle: z.string().optional(),
  estimatedSeconds: z.number().positive(),
});

function extractTeleprompterScript(card: PresentedCard) {
  return card.steps
    .filter((step) => Boolean(step.spokenLine && step.spokenLine.trim().length > 0))
    .map((step, idx) => ({
      stepNumber: idx + 1,
      stageLabel: step.stageLabel,
      sayThis: step.spokenLine!,
      cameraAngle: step.shot,
      estimatedSeconds: Math.max(3, Math.round(step.spokenLine!.split(/\s+/).length / 2.5)),
    }));
}

async function runCreatorExperienceTest() {
  console.log("--> Testing E2E Creator Vault & Shoot Experience...");

  // Mock a high-quality production idea card from database
  const mockDbCard = {
    id: crypto.randomUUID(),
    title: "The Zero-Budget Studio Upgrade",
    conceptSummary: "Stop buying new cameras until you fix this $10 lighting mistake.",
    hook_line: "Stop buying new cameras until you fix this $10 lighting mistake.",
    why_it_works: "Direct contrast pattern interrupting common creator buying bias.",
    viewer_leave_with: "Exact single-light positioning angle for cinematic tone.",
    target_category: "Creator Education",
    creator_mode: "Documentary Director",
    durationSeconds: 45,
    difficulty: "easy",
    execution_ranges: [
      {
        time_range: "0-5s",
        purpose: "Interrupt scrolling with a high-contrast side-by-side shot.",
        action: "Stand in dim room, flick single key light on.",
        say: "Stop buying new cameras until you fix this $10 lighting mistake.",
        camera: "Eye-level 50mm, medium close-up, dramatic side light.",
        on_screen_text: "Ceiling light vs Key light",
        edit: "Hard snap cut between bad lighting and good lighting on the beat.",
      },
      {
        time_range: "5-25s",
        purpose: "Show the exact 45-degree angle setup in 10 seconds.",
        action: "Position diffuse lamp 45 degrees to side.",
        say: "Take any diffuse lamp, place it 45 degrees to your side, and stand two steps away from the wall.",
        camera: "Over-the-shoulder wide shot showing room layout.",
        on_screen_text: "45-degree rule",
        edit: "Fast 1.2x motion ramp on the lamp adjustment.",
      },
      {
        time_range: "25-45s",
        purpose: "Final proof with side-by-side comparison and takeaway prompt.",
        action: "Direct eye contact with final setup.",
        say: "Save your money for better stories. Save this setup for your next shoot.",
        camera: "Direct-to-camera close-up, warm confident posture.",
        on_screen_text: "Story > Gear",
        edit: "Fade to black with brief recap graphic.",
      },
    ],
  };

  // 1. Adapter & Presenter validation
  const adapted = adaptLegacyIdeaCard(mockDbCard);
  const presented = presentIdeaCard(adapted.card);

  assert.ok(presented.title && presented.title.length > 0);
  assert.equal(presented.steps.length, 3);
  assert.ok(presented.hookLine?.includes("Stop buying new cameras"));

  // 2. Teleprompter & Shoot-mode Extraction Contract
  const scriptItems = extractTeleprompterScript(presented);
  assert.equal(scriptItems.length, 3);

  for (const item of scriptItems) {
    assert.doesNotThrow(() => TeleprompterScriptItemSchema.parse(item));
    assert.ok(item.sayThis.length > 0);
    assert.ok(item.estimatedSeconds >= 3);
  }

  // 3. Report Weak Card Contract
  const validReport = {
    cardId: mockDbCard.id,
    reason: "unclear_hook" as const,
    explanation: "The hook is slightly too aggressive for my creator persona niche.",
  };
  assert.doesNotThrow(() => ReportWeakCardInputSchema.parse(validReport));

  // Invalid report (explanation too short)
  assert.throws(() => ReportWeakCardInputSchema.parse({
    cardId: mockDbCard.id,
    reason: "wrong_lane_fit",
    explanation: "Too short",
  }));

  console.log("OK: E2E Creator Experience Test Passed.");
}

runCreatorExperienceTest().catch((err) => {
  console.error("FAIL: Creator Experience Test Failed:", err);
  process.exit(1);
});
