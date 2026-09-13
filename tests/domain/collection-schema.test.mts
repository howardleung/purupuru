import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(
  new URL("../../packages/database/prisma/schema.prisma", import.meta.url),
  "utf8",
);

test("collection and ratings are uniquely isolated by user and ProductVersion", () => {
  const collectionEntry = schema.match(/model CollectionEntry \{[\s\S]*?\n\}/)?.[0] ?? "";
  const userRating = schema.match(/model UserRating \{[\s\S]*?\n\}/)?.[0] ?? "";

  assert.match(collectionEntry, /@@unique\(\[userId, productVersionId\]\)/);
  assert.match(userRating, /@@unique\(\[userId, productVersionId\]\)/);
});
