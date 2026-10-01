import assert from "node:assert/strict";
import test from "node:test";

import {
  expandCatalogueVariants,
  filterCatalogueCapacity,
  filterCataloguePrice,
  getCatalogueCapacityRanges,
  normalizeCatalogueCapacity,
  selectLowestMarketOffer,
  sortCatalogueItems,
} from "../../packages/domain/src/catalogue.ts";
import { catalogueProductHref } from "../../apps/web/lib/product-links.ts";

test("one product family produces one catalogue row per current exact variant", () => {
  const rows = expandCatalogueVariants([{ family: { id: "dokdo", brand: "Round Lab" }, variants: [
    { id: "200", displaySize: "200 mL", offers: [{ id: "offer-a" }, { id: "offer-b" }] },
    { id: "500", displaySize: "500 mL", offers: [{ id: "offer-c" }] },
  ] }]);

  assert.deepEqual(rows.map(({ variant }) => variant.id), ["200", "500"]);
  assert.equal(rows.length, 2, "multiple offers must not multiply variant rows");
});

test("capacity filtering converts compatible volume units and excludes incompatible mass", () => {
  const variants = [
    { id: "200ml", normalizedQuantity: 200, normalizedUnit: "ml" },
    { id: "500ml", normalizedQuantity: 0.5, normalizedUnit: "l" },
    { id: "500g", normalizedQuantity: 500, normalizedUnit: "g" },
  ];

  assert.deepEqual(
    filterCatalogueCapacity(variants, "volume", 500, null).map((item) => item.id),
    ["500ml"],
  );
  assert.deepEqual(normalizeCatalogueCapacity(0.5, "l"), { dimension: "volume", amount: 500, unit: "mL" });
  assert.deepEqual(normalizeCatalogueCapacity(0.5, "kg"), { dimension: "mass", amount: 500, unit: "g" });
  assert.deepEqual(getCatalogueCapacityRanges(variants), [
    { dimension: "volume", minimum: 200, maximum: 500, unit: "mL" },
    { dimension: "mass", minimum: 500, maximum: 500, unit: "g" },
  ]);
});

test("catalogue links preserve the exact row variant", () => {
  assert.equal(catalogueProductHref({
    slug: "round-lab-1025-dokdo-toner",
    currentVersion: { id: "version", versionCode: "current", variant: { id: "variant-500" } },
  }), "/products/round-lab-1025-dokdo-toner?version=current&variant=variant-500");
});

test("each variant selects a lowest offer only from its own offers", () => {
  const variants = [
    { id: "200", offers: [{ id: "200-price", productPrice: 18, nativeCurrency: "CAD", cadConvertedPrice: null, availableMarkets: ["CA"] }] },
    { id: "500", offers: [{ id: "500-price", productPrice: 35, nativeCurrency: "CAD", cadConvertedPrice: null, availableMarkets: ["CA"] }] },
  ];
  assert.deepEqual(variants.map((variant) => selectLowestMarketOffer(variant.offers, "CA")?.id), ["200-price", "500-price"]);
});

test("catalogue lowest price uses explicit customer markets and comparable product price", () => {
  const offers = [
    { id: "ca-high", productPrice: 22, nativeCurrency: "CAD", cadConvertedPrice: null, availableMarkets: ["CA"] },
    { id: "jp-cheap-looking", productPrice: 1500, nativeCurrency: "JPY", cadConvertedPrice: 14, availableMarkets: ["JP"] },
    { id: "ca-low", productPrice: 2500, nativeCurrency: "JPY", cadConvertedPrice: 20, availableMarkets: ["CA", "JP"] },
  ];

  assert.equal(selectLowestMarketOffer(offers, "CA")?.id, "ca-low");
  assert.equal(selectLowestMarketOffer(offers, "KR"), null);
});

test("catalogue price sorts leave unranked products after comparable prices", () => {
  const products = [
    { id: "unknown", productName: "Unknown", brandName: "B", lowestPriceCad: null },
    { id: "high", productName: "High", brandName: "A", lowestPriceCad: 30 },
    { id: "low", productName: "Low", brandName: "C", lowestPriceCad: 10 },
  ];

  assert.deepEqual(sortCatalogueItems(products, "PRICE_ASC").map((item) => item.id), ["low", "high", "unknown"]);
  assert.deepEqual(sortCatalogueItems(products, "PRICE_DESC").map((item) => item.id), ["high", "low", "unknown"]);
});

test("catalogue price filters never turn missing prices into zero", () => {
  const products = [
    { id: "unknown", productName: "Unknown", brandName: "B", lowestPriceCad: null },
    { id: "priced", productName: "Priced", brandName: "A", lowestPriceCad: 25 },
  ];

  assert.deepEqual(filterCataloguePrice(products, null, null, false).map((item) => item.id), ["unknown", "priced"]);
  assert.deepEqual(filterCataloguePrice(products, 0, 30, false).map((item) => item.id), ["priced"]);
  assert.deepEqual(filterCataloguePrice(products, null, null, true).map((item) => item.id), ["priced"]);
});
