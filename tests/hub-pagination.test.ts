import assert from "node:assert/strict";
import {
  HUB_PAGE_SIZE,
  clampHubPage,
  hubPageCount,
  hubPageHref,
  hubPageWindow,
  parseHubPage,
  sliceHubPage,
} from "../lib/hub-pagination";
import { generateHubPagedParams, publicHubCount } from "../lib/hub-section";

assert.equal(HUB_PAGE_SIZE, 9);
assert.equal(parseHubPage(undefined), 1);
assert.equal(parseHubPage("0"), 1);
assert.equal(parseHubPage("2"), 2);
assert.equal(hubPageCount(110), 13);
assert.equal(clampHubPage(99, 110), 13);
assert.deepEqual(sliceHubPage(["a", "b", "c", "d"], 1, 3), ["a", "b", "c"]);
assert.deepEqual(sliceHubPage(["a", "b", "c", "d"], 2, 3), ["d"]);
assert.equal(hubPageHref("/resources", 1), "/resources");
assert.equal(hubPageHref("/resources", 3), "/resources/p/3");
assert.deepEqual(hubPageWindow(1, 4), [1, 2, 3, 4]);
assert.ok(hubPageWindow(7, 13).includes(1));
assert.ok(hubPageWindow(7, 13).includes(13));
assert.ok(hubPageWindow(7, 13).includes("gap"));
assert.ok(publicHubCount("resources") > 9);
assert.ok(generateHubPagedParams("resources").every((item) => item.page !== "1"));
assert.equal(hubPageHref("/content-ideas", 2), "/content-ideas/p/2");

console.log("hub-pagination: ok");
