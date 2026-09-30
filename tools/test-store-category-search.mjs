/**
 * Fixture test: Store category search must map Turkish yacht/boat intent to
 * the premium English-facing category label used by the purchase UI.
 *
 * Run: node --experimental-strip-types tools/test-store-category-search.mjs
 */

import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const searchUrl = pathToFileURL(path.join(root, "lib", "store-category-search.ts")).href;
const {
  filterStoreCategories,
  normalized,
  premiumCategoryLabel,
  categorySearchScore,
} = await import(searchUrl);

const categories = [
  { id: "travel", slug: "travel", name: "Travel", family: "creator_content" },
  { id: "boat-tour", slug: "boat_tour_agency", name: "Boat Tour Agency", family: "instagram_business" },
  { id: "boat-rental", slug: "boat_rental", name: "Boat Rental", family: "instagram_business" },
  { id: "beauty", slug: "beauty", name: "Beauty", family: "creator_content" },
  { id: "restaurant", slug: "restaurant", name: "Restaurant", family: "instagram_business" },
];

const yachtQueries = ["yat", "tekne", "yatch", "yacht", "mavi tur", "gulet", "private yacht charter"];

assert.equal(normalized("lüks yat turu"), "luks yat turu");
assert.equal(normalized("Özel Tekne"), "ozel tekne");

for (const query of yachtQueries) {
  const results = filterStoreCategories(categories, query, "all");
  assert.ok(results.length > 0, `${query} should return at least one category`);
  assert.equal(premiumCategoryLabel(results[0]), "Yacht Luxury Travel", `${query} should rank Yacht Luxury Travel first`);
  assert.ok(categorySearchScore(results[0], query) > categorySearchScore(categories[0], query), `${query} should score yacht result above generic Travel`);
  console.log(`OK  ${query} -> ${premiumCategoryLabel(results[0])} (${results[0].slug})`);
}

const travelResults = filterStoreCategories(categories, "tur", "travel");
assert.ok(travelResults.some((category) => premiumCategoryLabel(category) === "Yacht Luxury Travel"), "travel filter should retain boat/yacht categories");
console.log("OK  travel filter keeps yacht/boat categories");

console.log("\nStore category search fixtures passed.");