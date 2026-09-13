import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const querySource = readFileSync(
  new URL("../../apps/web/lib/my-collection.ts", import.meta.url),
  "utf8",
);

test("My Collection uses a fixed parallel query set with strict user scoping", () => {
  assert.match(querySource, /Promise\.all\(\[/);
  assert.equal(querySource.match(/where:\s*\{\s*userId\s*\}/g)?.length, 3);
  assert.match(querySource, /collectionEntry\.findMany/);
  assert.match(querySource, /userRating\.findMany/);
  assert.match(querySource, /purchaseInstance\.findMany/);
});

test("My Collection normalizes all sources by ProductVersion", () => {
  assert.match(querySource, /normalizeCollectionItems\(contributions\)/);
  assert.match(querySource, /productVersion:\s*\{\s*include:\s*versionContext\s*\}/);
});
