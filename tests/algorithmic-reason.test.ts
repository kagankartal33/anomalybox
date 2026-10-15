import assert from "node:assert/strict";
import {
  ALL_HOOKS,
  PURCHASE_LANES,
  CREATOR_MODES,
  CREATOR_PERSONAS,
  LANE_MATRIX,
  buildAlgorithmicInsight,
  recommendHooks,
  evaluateHookFit,
  inferShootFormat,
  synthesizeWhy,
  getHookById,
} from "../lib/algorithmic-reason";

assert.equal(PURCHASE_LANES.length, 12);
assert.equal(CREATOR_MODES.length, 8);
assert.equal(CREATOR_PERSONAS.length, 6);
assert.equal(ALL_HOOKS.length, 62);
assert.ok(ALL_HOOKS.every((h) => h.compatibleLanes.length && h.compatibleModes.length && h.compatiblePersonas.length));

for (const lane of PURCHASE_LANES) {
  assert.ok(LANE_MATRIX[lane].topHookIds.length >= 3, lane);
}

const beautyRecs = recommendHooks({ lane: "beauty", mode: "hands_only", limit: 3 });
assert.ok(beautyRecs.some((h) => h.id === "macro_tactile_zoom"));

const comedyFit = evaluateHookFit("deadpan_calm", {
  lane: "entertainment_comedy",
  mode: "talking_head",
  persona: "relatable_confidant",
});
assert.equal(comedyFit.ok, true);

const unfit = evaluateHookFit("deadpan_calm", { lane: "beauty", mode: "screen_recording" });
assert.equal(unfit.ok, false);

const silent = buildAlgorithmicInsight("Kısa ve belirsiz.", {
  category: "beauty",
  shootFormat: "talking_head",
});
assert.equal(silent.isAlgorithmicReasonValid, false);
assert.equal(silent.cognitiveTrigger, undefined);
assert.equal(silent.targetSignal, undefined);

const valid = buildAlgorithmicInsight(
  "Ters reçete: köpükle yıkamaya devam dersen izleyici durur. Ayna testiyle kaydeder.",
  {
    category: "beauty",
    shootFormat: "talking_head",
    hookId: "reverse_prescription",
    presenceMode: "editorial_insider",
  },
);
assert.equal(valid.isAlgorithmicReasonValid, true);
assert.equal(valid.hookTypeId, "reverse_prescription");
assert.ok(valid.hookNameTr);

assert.equal(inferShootFormat("top-down makro doku, sadece eller"), "hands_only");
assert.equal(inferShootFormat("dashboard ekran kaydı %120 zoom"), "screen_recording");
const hook = getHookById("reverse_prescription");
assert.ok(hook);
assert.match(synthesizeWhy(hook), /Ters Reçete/);

console.log("algorithmic-reason tests passed");
