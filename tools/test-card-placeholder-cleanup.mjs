/**
 * Fixture test: creator-facing card text must not leak raw placeholders,
 * generator run ids, or quality-gate labels after cleanup helpers run.
 *
 * Run: node --experimental-strip-types tools/test-card-placeholder-cleanup.mjs
 */

import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const formatUrl = pathToFileURL(path.join(root, "lib", "format.ts")).href;
const { normalizeCreatorText, compactText, sanitizeDisplayText } = await import(formatUrl);

const rawPlaceholderPattern = /\{[a-z0-9_ -]+\}/i;
const runIdPattern = /run_\d{8}_\d{6}/i;
const qualityGatePattern = /Quality Gate/i;

function assertCleanCreatorText(label, value) {
  assert.ok(typeof value === "string" && value.length > 0, `${label} should be non-empty string`);
  assert.equal(rawPlaceholderPattern.test(value), false, `${label} still has raw placeholder: ${value}`);
  assert.equal(runIdPattern.test(value), false, `${label} still has run id: ${value}`);
  assert.equal(qualityGatePattern.test(value), false, `${label} still has Quality Gate language: ${value}`);
}

function walkVisible(value, out) {
  if (value == null) return;
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => walkVisible(item, out));
    return;
  }
  if (typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (["internal_rank_score", "score_band", "assigned_band", "dataset_training"].includes(key)) continue;
      walkVisible(nested, out);
    }
  }
}

const fixtures = [
  {
    name: "product placeholder",
    input: "Hold {product_name} near the light and show the finish.",
    expectIncludes: "your product or subject",
  },
  {
    name: "audience pain placeholder",
    input: "Name {audience_pain} in the first second.",
    expectIncludes: "the audience problem",
  },
  {
    name: "generic placeholder",
    input: "Use {signature_phrase} once, then move on.",
    expectIncludes: "your own recurring phrase",
  },
  {
    name: "run id slug",
    input: "Quality Gate V2 run_20260703_131926_soft_proof_reveal_12",
    expectIncludes: "Soft Proof Reveal",
  },
];

let failures = 0;

for (const fixture of fixtures) {
  try {
    const cleaned = normalizeCreatorText(fixture.input);
    assertCleanCreatorText(fixture.name, cleaned);
    assert.match(cleaned, new RegExp(fixture.expectIncludes, "i"), `${fixture.name} missing expected phrase`);
    console.log(`OK  ${fixture.name}: ${cleaned}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${fixture.name}: ${error.message}`);
  }
}

try {
  const sanitized = sanitizeDisplayText("Quality Gate V2 run_20260703_131926_hidden_decision_map");
  assertCleanCreatorText("sanitizeDisplayText", sanitized);
  console.log(`OK  sanitizeDisplayText: ${sanitized}`);
} catch (error) {
  failures += 1;
  console.error(`FAIL sanitizeDisplayText: ${error.message}`);
}

const dirtyCard = {
  title: "Quality Gate V2 run_20260703_131926_soft_proof_reveal_01",
  idea_summary: {
    premise: "Show {product_name} after naming {audience_pain}.",
  },
  video_blueprint: {
    duration_seconds: 30,
    opening_visual: "Hard cut from finished look to messy prep with {product_name}.",
  },
  scene_script: [
    {
      second: "0-3",
      purpose: "attention",
      voiceover: "Start with {audience_pain}, then your fix.",
      on_screen_text: "{signature_phrase}",
    },
  ],
  shot_list: [
    {
      second: "0-2",
      shot: "Close-up face",
      action: "Hold {product_name} just out of frame, then reveal.",
    },
  ],
  execution_ranges: [
    {
      time_range: "0-5s",
      purpose: "Hook",
      action: "Reveal {product_name} after the messy table cut.",
      camera: "Tight face, then overhead table.",
      say: "Name {audience_pain} in your own words.",
      on_screen_text: "{signature_phrase}",
      creator_touch: "Use your real {daily_context}.",
      edit: "Hard cut into the reveal before the line lands.",
    },
  ],
  // Internal-only fields should never be required for creator cleanup.
  internal_rank_score: 0.98,
  score_band: "A",
};

try {
  const rawVisible = [];
  walkVisible(dirtyCard, rawVisible);
  assert.ok(rawVisible.some((text) => rawPlaceholderPattern.test(text)), "fixture should contain raw placeholders before cleanup");

  const cleanedVisible = rawVisible.map((text) => compactText(text, "ok"));
  for (const [index, text] of cleanedVisible.entries()) {
    assertCleanCreatorText(`fixture field ${index}`, text);
  }

  const serialized = cleanedVisible.join("\n");
  assert.equal(rawPlaceholderPattern.test(serialized), false, `cleaned fixture still contains placeholders:\n${serialized}`);
  assert.equal(runIdPattern.test(serialized), false, `cleaned fixture still contains run ids:\n${serialized}`);
  assert.equal(qualityGatePattern.test(serialized), false, `cleaned fixture still contains Quality Gate language:\n${serialized}`);
  console.log("OK  dirty fixture card becomes creator-safe after compactText/normalizeCreatorText");
} catch (error) {
  failures += 1;
  console.error(`FAIL dirty fixture card: ${error.message}`);
}

if (failures > 0) {
  console.error(`\nCard placeholder cleanup failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("\nCard placeholder cleanup fixtures passed.");
