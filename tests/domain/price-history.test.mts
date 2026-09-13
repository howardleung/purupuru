import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildPriceHistorySeries } from "../../packages/domain/src/price-history.ts";

const offers = [
  {
    id: "offer-well",
    productVariantId: "version-a-200ml",
    retailerId: "retailer-well",
    retailerName: "Well.ca",
    listingUrl: "https://example.test/well/200",
    amount: 17.99,
    nativeCurrency: "CAD",
    lastVerifiedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "offer-shoppers",
    productVariantId: "version-a-200ml",
    retailerId: "retailer-shoppers",
    retailerName: "Shoppers Drug Mart",
    listingUrl: "https://example.test/shoppers/200",
    amount: 20,
    nativeCurrency: "CAD",
    lastVerifiedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "offer-other-version",
    productVariantId: "version-b-200ml",
    retailerId: "retailer-well",
    retailerName: "Well.ca",
    listingUrl: "https://example.test/well/version-b-200",
    amount: 16,
    nativeCurrency: "CAD",
    lastVerifiedAt: "2026-09-12T00:00:00.000Z",
  },
];

const observations = [
  {
    id: "well-later",
    productVariantId: "version-a-200ml",
    retailerId: "retailer-well",
    retailerName: "Well.ca",
    sourceUrl: "https://example.test/well/200",
    amount: 17.99,
    nativeCurrency: "CAD",
    observedAt: "2026-09-01T00:00:00.000Z",
    verificationType: "OTHER",
  },
  {
    id: "well-earlier",
    productVariantId: "version-a-200ml",
    retailerId: "retailer-well",
    retailerName: "Well.ca",
    sourceUrl: "https://example.test/well/200",
    amount: 21.99,
    nativeCurrency: "CAD",
    observedAt: "2026-07-01T00:00:00.000Z",
    verificationType: "OTHER",
  },
  {
    id: "shoppers-sparse",
    productVariantId: "version-a-200ml",
    retailerId: "retailer-shoppers",
    retailerName: "Shoppers Drug Mart",
    sourceUrl: "https://example.test/shoppers/200",
    amount: 22.99,
    nativeCurrency: "CAD",
    observedAt: "2026-08-01T00:00:00.000Z",
    verificationType: "OTHER",
  },
  {
    id: "wrong-size",
    productVariantId: "version-a-500ml",
    retailerId: "retailer-well",
    retailerName: "Well.ca",
    sourceUrl: "https://example.test/well/200",
    amount: 30,
    nativeCurrency: "CAD",
    observedAt: "2026-08-10T00:00:00.000Z",
    verificationType: "OTHER",
  },
  {
    id: "wrong-version",
    productVariantId: "version-b-200ml",
    retailerId: "retailer-well",
    retailerName: "Well.ca",
    sourceUrl: "https://example.test/well/version-b-200",
    amount: 16,
    nativeCurrency: "CAD",
    observedAt: "2026-08-10T00:00:00.000Z",
    verificationType: "OTHER",
  },
  {
    id: "wrong-offer",
    productVariantId: "version-a-200ml",
    retailerId: "retailer-well",
    retailerName: "Well.ca",
    sourceUrl: "https://example.test/well/bundle",
    amount: 40,
    nativeCurrency: "CAD",
    observedAt: "2026-08-11T00:00:00.000Z",
    verificationType: "OTHER",
  },
];

test("price history is isolated by selected version and exact variant", () => {
  const series = buildPriceHistorySeries({
    selectedVariantId: "version-a-200ml",
    offers,
    observations,
  });

  assert.equal(series.length, 2);
  assert.deepEqual(
    series.flatMap((value) => value.observations.map((observation) => observation.id)).sort(),
    ["shoppers-sparse", "well-earlier", "well-later"],
  );
});

test("retailer and offer series remain independent and chronological", () => {
  const series = buildPriceHistorySeries({
    selectedVariantId: "version-a-200ml",
    offers,
    observations,
  });
  const well = series.find((value) => value.offerId === "offer-well");
  const shoppers = series.find((value) => value.offerId === "offer-shoppers");

  assert.deepEqual(well?.observations.map((observation) => observation.id), [
    "well-earlier",
    "well-later",
  ]);
  assert.deepEqual(shoppers?.observations.map((observation) => observation.id), [
    "shoppers-sparse",
  ]);
  assert.equal(well?.observations.some((observation) => observation.id === "wrong-offer"), false);
});

test("current price remains separate and native observation currency is preserved", () => {
  const [series] = buildPriceHistorySeries({
    selectedVariantId: "version-a-200ml",
    offers: [offers[0]],
    observations: [observations[0]],
  });

  assert.equal(series.currentPrice.amount, 17.99);
  assert.equal(series.observations.length, 1);
  assert.equal(series.observations[0]?.amount, 17.99);
  assert.equal(series.observations[0]?.nativeCurrency, "CAD");
});

test("missing history returns no series rather than inventing observations", () => {
  const series = buildPriceHistorySeries({
    selectedVariantId: "version-a-200ml",
    offers,
    observations: [],
  });

  assert.deepEqual(series, []);
});

test("price-history UI includes sparse and missing states and no historical CAD claim", async () => {
  const source = await readFile(
    new URL("../../apps/web/components/price-history-section.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Sparse history: only one observation/);
  assert.match(source, /No price observations have been recorded/);
  assert.match(source, /observation-date CAD rates are not yet stored/);
  assert.doesNotMatch(source, /convertToCad/);
});

test("product query loads variant observations and product page builds selected history", async () => {
  const [catalogue, productPage] = await Promise.all([
    readFile(new URL("../../apps/web/lib/catalogue.ts", import.meta.url), "utf8"),
    readFile(new URL("../../apps/web/app/products/[slug]/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(catalogue, /priceObservations:/);
  assert.match(productPage, /selectedVariantRecord\.priceObservations/);
  assert.match(productPage, /buildPriceHistorySeries/);
});
