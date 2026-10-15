/**
 * Unit checks for the idea-card AI-residue detector.
 * Run: npx tsx tests/ai-residue.test.ts
 */
import assert from "node:assert/strict";
import {
  firstResidueMatch,
  scanIdeaCardResidue,
  scanTextResidue,
  stripResidue,
} from "../lib/idea-card/ai-residue";
import { scoreIdeaCard, type IdeaCard } from "../lib/idea-card";

function kinds(text: string) {
  return scanTextResidue(text).map((hit) => hit.kind);
}

// Clean shoot language must stay clean — including "deliver" (must not match "delve").
assert.equal(firstResidueMatch("Hold the pipette to the window and wait 12 seconds."), null);
assert.equal(firstResidueMatch("Deliver the serum onto the wrist, then cap the bottle."), null);
assert.equal(firstResidueMatch("Hold the map at the 6:40 stair and keep the clock in frame."), null);

// Kobak / Gray excess style-words
assert.ok(kinds("We meticulously delve into the blend.").includes("llm_style_word"));
assert.ok(kinds("An intricate tapestry of skincare.").includes("llm_style_word"));
assert.ok(kinds("This multifaceted realm of insights.").includes("llm_style_word"));
assert.ok(kinds("Showcasing a pivotal, groundbreaking method.").includes("llm_style_word"));
assert.ok(kinds("Utilize the serum after you harness the light.").includes("llm_style_word"));

// Templates
assert.ok(kinds("In a world where routines fail, start here.").includes("template"));
assert.ok(kinds("Whether you're a beginner or a pro, wait 12 seconds.").includes("template"));
assert.ok(kinds("It's important to note that the pad is used once.").includes("template"));
assert.ok(kinds("Let's dive into the wait clock.").includes("template"));
assert.ok(kinds("This will unlock your full potential.").includes("template"));

// Pipeline leaks
assert.ok(kinds("As an AI language model, here is a hook.").includes("pipeline_leak"));
assert.ok(kinds("I hope this helps with your reel.").includes("pipeline_leak"));
assert.ok(kinds("Insert product name into the spoken line.").includes("pipeline_leak"));

// Fake certainty
assert.ok(kinds("This will go viral overnight and 10x your reach.").includes("fake_certainty"));
assert.ok(kinds("Viral garanti, algoritmayı kandır.").includes("fake_certainty"));

// Existing vague list still fires
assert.ok(kinds("Start from the premium frame and stop the scroll.").includes("vague_phrase"));

// Workslop: long, no concrete token, two+ style adjectives
const workslop =
  "Create an engaging and captivating experience that delivers authentic impact through polished storytelling for your audience.";
assert.ok(kinds(workslop).includes("workslop"));

// Workslop must not fire on filmable copy
assert.ok(
  !kinds("Hold the acid serum at the window sill and wait 12 seconds before the cream.").includes(
    "workslop",
  ),
);

// Strip removes lexical residue
const stripped = stripResidue("We meticulously delve into the premium moment on camera.");
assert.equal(firstResidueMatch(stripped), null);
assert.ok(!/delve|meticulously|premium moment/i.test(stripped));

const cleanCard: IdeaCard = {
  id: "residue-clean",
  title: "Wait 12 seconds after the acid",
  conceptSummary: "At the window sill, stack two acids first, then run a 12-second wait clock so one acid, then cream is visible.",
  format: "Reels",
  category: "beauty",
  platform: "instagram_reels",
  audience: "Routine testers who keep what they can prove",
  durationSeconds: 23,
  difficulty: "easy",
  requiredItems: ["acid serum", "window sill", "phone stand", "daylight"],
  viewerTakeaway: "One acid, then cream; keep 12-second wait clock in the frame.",
  whyItWorks:
    "Reverse Prescription: 12-second wait clock creates a prediction error, then one acid, then cream becomes the saveable step.",
  hookId: "reverse_prescription",
  shootFormat: "talking_head",
  presenceMode: "editorial_insider",
  personaSlug: "luxury_editor",
  schemaVersion: 2,
  overallProductionNotes: [
    "No medical claim. One visible test.",
    "talking_head only. eye-level, 0.5 m, close-up bust, locked tripod.",
  ],
  steps: [
    {
      id: "s1",
      order: 1,
      stage: "hook",
      startSecond: 0,
      endSecond: 5,
      purpose: "Interrupt with acid serum and the forbidden move",
      goal: "Make stack two acids look expensive in one beat",
      action: "Hold acid serum up, then stop the hand before you stack two acids",
      spokenLine: "Do not stack two acids. One acid, then cream.",
      shot: "eye-level, 0.5 m, close-up bust, locked tripod. Hold the acid serum at chest height.",
      onScreenText: "one acid, then cream",
      performanceNote: "Shoulders still. One blink. Voice stays flat.",
    },
    {
      id: "s2",
      order: 2,
      stage: "context",
      startSecond: 5,
      endSecond: 10,
      purpose: "Plant the window sill and the wrong default",
      goal: "Name why people stack two acids",
      action: "Set acid serum on the window sill and point to the wasted motion",
      spokenLine: "Most people stack two acids here.",
      shot: "eye-level, 0.5 m. Pull back 8 cm to show the window sill.",
    },
    {
      id: "s3",
      order: 3,
      stage: "demonstration",
      startSecond: 10,
      endSecond: 18,
      purpose: "Prove the rule with 12-second wait clock",
      goal: "Leave a test the viewer can copy",
      action: "Run 12-second wait clock, then place acid serum back and wait",
      spokenLine: "This is 12-second wait clock. One acid, then cream.",
      shot: "close-up of 12-second wait clock, 12 cm, locked, no pan",
    },
    {
      id: "s4",
      order: 4,
      stage: "takeaway",
      startSecond: 18,
      endSecond: 23,
      purpose: "Leave the reusable rule",
      goal: "End on a still the viewer can copy",
      action: "Cap acid serum, step back, leave 12-second wait clock visible",
      spokenLine: "Hold this frame and copy one acid, then cream.",
      shot: "eye-level, 0.5 m. Still hold on acid serum and the written rule.",
    },
  ],
};

const cleanHits = scanIdeaCardResidue(cleanCard);
assert.equal(cleanHits.length, 0, `clean card leaked residue: ${JSON.stringify(cleanHits)}`);
const cleanScore = scoreIdeaCard(cleanCard);
assert.equal(cleanScore.redGatesPassed, true, cleanScore.redGateFailureReasons.join(" | "));
assert.ok(cleanScore.score >= 80, `expected >=80, got ${cleanScore.score}`);
assert.equal(cleanScore.band, "high");

const slopCard: IdeaCard = {
  ...cleanCard,
  id: "residue-slop",
  conceptSummary:
    "We meticulously delve into the intricate tapestry of skincare to showcase a pivotal blend.",
  viewerTakeaway: "Unlock your full potential with this multifaceted routine.",
};
const slopHits = scanIdeaCardResidue(slopCard);
assert.ok(slopHits.length >= 2, `expected multiple residue hits, got ${JSON.stringify(slopHits)}`);
const slopScore = scoreIdeaCard(slopCard);
assert.equal(slopScore.redGatesPassed, false);
assert.ok(slopScore.score <= 50);

console.log(
  JSON.stringify(
    {
      ok: true,
      clean_score: cleanScore.score,
      slop_hits: slopHits.map((hit) => `${hit.kind}:${hit.match}`),
      slop_score: slopScore.score,
    },
    null,
    2,
  ),
);
