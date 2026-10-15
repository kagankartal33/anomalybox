import assert from "node:assert/strict";
import { goldRatingInputSchema } from "../lib/generation/gold-rating";

const baseRating = {
  ideaId: "3bd5d9d0-676a-4b57-8d73-b0de3eb4516f",
  decision: "approve",
  rank: "4",
  runtimeFit: "right",
  failureCodes: [],
  notes: "The proof lands without rushing.",
};

const parsed = goldRatingInputSchema.parse(baseRating);
assert.equal(parsed.rank, 4);
assert.equal(parsed.runtimeFit, "right");

assert.equal(
  goldRatingInputSchema.safeParse({ ...baseRating, runtimeFit: undefined }).success,
  false,
  "a blind review cannot be saved without a runtime-fit judgement",
);
assert.equal(goldRatingInputSchema.safeParse({ ...baseRating, runtimeFit: "fast" }).success, false);
assert.equal(goldRatingInputSchema.safeParse({ ...baseRating, rank: 6 }).success, false);
assert.equal(goldRatingInputSchema.safeParse({
  ...baseRating,
  failureCodes: ["runtime_rushed", "runtime padded"],
}).success, false);

console.log("gold rating input fixtures passed");
