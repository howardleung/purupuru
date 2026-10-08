import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(new URL("../../packages/database/prisma/schema.prisma", import.meta.url), "utf8");
const migration = readFileSync(new URL("../../packages/database/prisma/migrations/20261008120000_add_product_reviews/migration.sql", import.meta.url), "utf8");
const review = schema.match(/model Review \{[\s\S]*?\n\}/)?.[0] ?? "";
const userRating = schema.match(/model UserRating \{[\s\S]*?\n\}/)?.[0] ?? "";

test("reviews are family-level while preserving exact size, version, and historical skin context", () => {
  assert.match(review, /productFamilyId\s+String/);
  assert.match(review, /productVersionId\s+String/);
  assert.match(review, /productVariantId\s+String/);
  assert.match(review, /skinTypeSnapshot\s+SkinType\?/);
  assert.match(review, /sensitiveSkinSnapshot\s+Boolean/);
  assert.match(review, /@@unique\(\[userId, productFamilyId\]\)/);
  assert.doesNotMatch(review, /displayName|email|avatarId/);
});

test("existing private UserRating semantics remain version-scoped and half-step based", () => {
  assert.match(userRating, /productVersionId\s+String/);
  assert.match(userRating, /ratingHalfSteps\s+Int/);
  assert.match(userRating, /@@unique\(\[userId, productVersionId\]\)/);
});

test("review migration is additive and enforces rating and uniqueness constraints", () => {
  assert.match(migration, /CREATE TABLE "Review"/);
  assert.match(migration, /CHECK \("rating" BETWEEN 1 AND 5\)/);
  assert.match(migration, /CREATE UNIQUE INDEX "Review_userId_productFamilyId_key"/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/);
});
