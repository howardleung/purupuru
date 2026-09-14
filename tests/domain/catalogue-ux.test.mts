import assert from "node:assert/strict";
import test from "node:test";

import {
  filterCataloguePrice,
  selectLowestMarketOffer,
  sortCatalogueItems,
} from "../../packages/domain/src/catalogue.ts";

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
