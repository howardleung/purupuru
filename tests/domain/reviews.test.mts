import assert from "node:assert/strict";
import test from "node:test";

import { buildReviewSummary, validateReviewInput } from "../../packages/domain/src/reviews.ts";

test("review ratings accept only whole stars from 1 through 5", () => {
  for (const rating of [1, 2, 3, 4, 5]) {
    assert.equal(validateReviewInput({ rating, body: null, productVariantId: "variant-1" }).ok, true);
  }
  for (const rating of [0, 6, 2.5, "5", Number.NaN]) {
    assert.equal(validateReviewInput({ rating, body: null, productVariantId: "variant-1" }).ok, false);
  }
});

test("written reviews normalize valid text and safely handle empty or invalid bodies", () => {
  assert.deepEqual(validateReviewInput({ rating: 5, body: "  Great\r\nproduct  ", productVariantId: "variant-1" }), {
    ok: true,
    value: { rating: 5, body: "Great\nproduct", productVariantId: "variant-1" },
  });
  assert.equal(validateReviewInput({ rating: 4, body: "   ", productVariantId: "variant-1" }).ok, false);
  assert.equal(validateReviewInput({ rating: 4, body: "", productVariantId: "variant-1" }).ok, true);
  assert.equal(validateReviewInput({ rating: 4, body: "x".repeat(3001), productVariantId: "variant-1" }).ok, false);
  assert.equal(validateReviewInput({ rating: 4, body: "bad\u0000text", productVariantId: "variant-1" }).ok, false);
  assert.equal(validateReviewInput({ rating: 4, body: "hidden\u200Btext", productVariantId: "variant-1" }).ok, false);
});

test("review summaries calculate average, count, distribution, and the zero state", () => {
  assert.deepEqual(buildReviewSummary([]), {
    count: 0,
    average: null,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  assert.deepEqual(buildReviewSummary([5, 5, 4, 1]), {
    count: 4,
    average: 3.75,
    distribution: { 1: 1, 2: 0, 3: 0, 4: 1, 5: 2 },
  });
});
