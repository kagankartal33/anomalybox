import assert from "node:assert/strict";
import {
  balancedGoldLaneProgress,
  goldLaneNeedsRatings,
  goldSetTargetSource,
} from "../lib/generation/gold-set";

assert.equal(goldSetTargetSource({ existing: 0, generated: 0 }), "existing");
assert.equal(goldSetTargetSource({ existing: 12, generated: 5 }), "generated");
assert.equal(goldSetTargetSource({ existing: 20, generated: 4 }), "generated");
assert.equal(goldSetTargetSource({ existing: 9, generated: 20 }), "existing");

assert.equal(goldLaneNeedsRatings({ existing: 40, generated: 0 }), true);
assert.equal(balancedGoldLaneProgress({ existing: 40, generated: 0 }), 20);
assert.equal(goldLaneNeedsRatings({ existing: 20, generated: 20 }), false);
assert.equal(balancedGoldLaneProgress({ existing: 24, generated: 22 }), 40);

console.log("gold set source quota fixtures passed");
