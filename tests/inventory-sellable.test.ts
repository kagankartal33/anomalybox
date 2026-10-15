import assert from "node:assert/strict";
import { isRenderableStockCard } from "../lib/idea-card/stock.ts";

const empty = isRenderableStockCard({});
assert.equal(empty, false);

const untitled = isRenderableStockCard({ steps: [{}, {}, {}] });
assert.equal(untitled, false);

const v2 = isRenderableStockCard({
  title: "Hold the cap until the drip stops",
  steps: [{}, {}, {}],
});
assert.equal(v2, true);

const legacy = isRenderableStockCard(
  { scene_script: [{ purpose: "hook" }] },
  "Show the before shade on paper",
);
assert.equal(legacy, true);

const titleFallback = isRenderableStockCard({ steps: [{}, {}, {}] }, "A");
assert.equal(titleFallback, false);

console.log("inventory-sellable.test.ts ok");
