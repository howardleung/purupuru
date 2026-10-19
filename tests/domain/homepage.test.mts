import assert from "node:assert/strict";
import test from "node:test";

import type { CatalogueProduct } from "../../apps/web/lib/catalogue-contract.ts";
import { buildHomepageDeals } from "../../apps/web/lib/homepage-merchandising.ts";

function product({
  id,
  price,
  benchmarks = [],
}: {
  id: string;
  price: number | null;
  benchmarks?: NonNullable<CatalogueProduct["currentVersion"]>["benchmarks"];
}): CatalogueProduct {
  return {
    id: `variant-${id}`,
    productFamilyId: `family-${id}`,
    slug: id,
    canonicalName: `Product ${id}`,
    originMarket: "KR",
    brand: { name: "Brand", slug: "brand" },
    primaryCanonicalCategory: { id: "category", displayName: "Serum", slug: "serum" },
    reviewSummary: { average: null, count: 0 },
    currentVersion: {
      id: `version-${id}`,
      versionCode: "current",
      versionName: "Current",
      image: null,
      variant: { id: `variant-${id}`, displaySize: "50 mL", normalizedQuantity: 50, normalizedUnit: "mL" },
      variants: [{ id: `variant-${id}`, displaySize: "50 mL", normalizedQuantity: 50, normalizedUnit: "mL" }],
      benchmarks,
      lowestCanadianPrice: price === null ? null : {
        nativeAmount: price,
        nativeCurrency: "CAD",
        amountCad: price,
        retailerName: "Canadian Retailer",
      },
    },
  };
}

function benchmark({ id, market, amountCad, type = "RETAIL_PRICE" }: {
  id: string;
  market: string;
  amountCad: number | null;
  type?: string;
}): NonNullable<CatalogueProduct["currentVersion"]>["benchmarks"][number] {
  return {
    id,
    type,
    market,
    nativeAmount: amountCad ?? 2000,
    nativeCurrency: amountCad === null ? "JPY" : "CAD",
    amountCad,
    sourceDisplayName: "Verified source",
    sourceUrl: "https://example.test/reference",
    verifiedAt: "2026-10-15T00:00:00.000Z",
  };
}

test("homepage deals calculate discounts only from a higher Canadian reference price", () => {
  const [deal] = buildHomepageDeals([
    product({
      id: "discounted",
      price: 20,
      benchmarks: [
        benchmark({ id: "jp", market: "JP", amountCad: 40 }),
        benchmark({ id: "ca", market: "CA", amountCad: 25 }),
      ],
    }),
  ]);

  assert.equal(deal.referencePriceCad, 25);
  assert.equal(deal.discountPercent, 20);
});

test("homepage deals never fabricate a reference price when verified CAD context is absent", () => {
  const [deal] = buildHomepageDeals([
    product({
      id: "plain-price",
      price: 18,
      benchmarks: [benchmark({ id: "jp", market: "JP", amountCad: 30 })],
    }),
  ]);

  assert.equal(deal.referencePriceCad, null);
  assert.equal(deal.discountPercent, null);
});

test("homepage deals prioritize verified discounts and exclude prices without CAD comparison", () => {
  const deals = buildHomepageDeals([
    product({ id: "cheap", price: 10 }),
    product({ id: "discount", price: 25, benchmarks: [benchmark({ id: "ca", market: "CA", amountCad: 50, type: "MSRP" })] }),
    product({ id: "missing", price: null }),
  ]);

  assert.deepEqual(deals.map((deal) => deal.product.slug), ["discount", "cheap"]);
});

