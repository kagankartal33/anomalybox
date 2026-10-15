/**
 * Smoke tests for lib/idea-card adapter + quality (viralboxUP.md).
 * Run: node --experimental-strip-types tools/test-idea-card-adapter.mjs
 * or: npx tsx tools/test-idea-card-adapter.mjs
 */

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadModule() {
  // Prefer compiled-free TS via experimental strip if available; fallback tsx path pattern.
  const modPath = pathToFileURL(path.join(root, "lib/idea-card/index.ts")).href;
  try {
    return await import(modPath);
  } catch {
    const require = createRequire(import.meta.url);
    // Dynamic tsx register not always present — use relative .ts via node strip
    return await import(pathToFileURL(path.join(root, "lib/idea-card/index.ts")).href);
  }
}

const {
  adaptLegacyIdeaCard,
  formatTime,
  formatTimeRange,
  parseTimeToSeconds,
  validateIdeaCardQuality,
  jaccardSimilarity,
} = await loadModule();

// Time parser
assert.equal(parseTimeToSeconds(0), 0);
assert.equal(parseTimeToSeconds("5s"), 5);
assert.equal(parseTimeToSeconds("0:05"), 5);
assert.equal(parseTimeToSeconds("1:05"), 65);
assert.equal(formatTime(65), "1:05");
assert.equal(formatTimeRange(0, 5), "0:00–0:05");

// Legacy adaptation
const legacy = {
  title: "The Trust Marker",
  one_sentence_premise: "Reveal one small correction behind a polished beauty result.",
  idea_summary: {
    premise: "Reveal one small correction behind a polished beauty result to show how the final look was achieved.",
    creator_takeaway: "Show the finished look, then the single correction that made it work.",
  },
  video_blueprint: {
    opening_visual: "Hold the finished look on camera for one second.",
    payoff_visual: "Ask which detail the viewer would fix first.",
    duration_seconds: 28,
  },
  scene_script: [
    { second: "0-5", purpose: "Hook", action: "Show finished look", voiceover: "This looks effortless, but one mistake nearly ruined it." },
    { second: "5-14", purpose: "Context", action: "Raise phone notes", voiceover: "I wrote the fix down before I reshot." },
    { second: "14-22", purpose: "Proof", action: "Point to corrected detail", on_screen_text: "The correction" },
    { second: "22-28", purpose: "CTA", action: "Hold product and pause", voiceover: "Which detail would you change first?" },
  ],
};

const adapted = adaptLegacyIdeaCard(legacy, { ideaId: "test-card-1", dbTitle: "The Trust Marker" });
assert.equal(adapted.card.schemaVersion, 2);
assert.ok(adapted.card.steps.length >= 3, "expected at least 3 steps");
assert.equal(adapted.card.steps[0].startSecond, 0);
assert.equal(adapted.card.durationSeconds, adapted.card.steps.at(-1).endSecond);
assert.ok(adapted.card.conceptSummary.length >= 12);
assert.ok(adapted.card.viewerTakeaway.length >= 6);

// Quality should not crash; may warn on legacy language
const issues = validateIdeaCardQuality(adapted.card);
assert.ok(Array.isArray(issues));

// Near-duplicate detector
assert.ok(jaccardSimilarity("hold the finished look on screen", "hold the finished look on the screen") > 0.7);

console.log("test-idea-card-adapter: ok");
console.log(`  steps=${adapted.card.steps.length} duration=${adapted.card.durationSeconds}s issues=${issues.length}`);
