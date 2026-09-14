import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateShoppingListEstimate,
  compareDestinationOffers,
  isOfferEligibleForMarket,
  nextQuantityAfterAdd,
  purchaseDelta,
  selectStrongestBenchmark,
  validateQuantityUpdate,
  validateRequestedQuantity,
} from "../../packages/domain/src/shopping-list.ts";

test("adding the same exact variant increases its quantity", () => {
  assert.equal(nextQuantityAfterAdd(2, 3), 5);
  assert.equal(nextQuantityAfterAdd(2, 0), null);
});

test("requested quantity cannot drop below one", () => {
  assert.equal(validateRequestedQuantity(1), true);
  assert.equal(validateRequestedQuantity(0), false);
  assert.equal(validateRequestedQuantity(1.5), false);
});

test("purchased quantity stays within total quantity", () => {
  assert.equal(validateQuantityUpdate(3, 2), true);
  assert.equal(validateQuantityUpdate(3, 4), false);
  assert.equal(validateQuantityUpdate(3, -1), false);
});

test("partial purchase returns only the newly purchased quantity", () => {
  assert.equal(purchaseDelta(5, 1, 3), 2);
  assert.equal(purchaseDelta(5, 3, 3), 0);
  assert.equal(purchaseDelta(5, 3, 2), null);
  assert.equal(purchaseDelta(5, 3, 6), null);
});

test("benchmark selection preserves MSRP, Retail Price, Reference Price precedence", () => {
  const benchmarks = [
    {
      id: "reference",
      type: "REFERENCE_PRICE" as const,
      nativeAmount: 20,
      nativeCurrency: "CAD",
      amountCad: 20,
      verifiedAt: "2026-09-12",
    },
    {
      id: "retail",
      type: "RETAIL_PRICE" as const,
      nativeAmount: 18,
      nativeCurrency: "CAD",
      amountCad: 18,
      verifiedAt: "2026-08-01",
    },
    {
      id: "msrp",
      type: "MSRP" as const,
      nativeAmount: 25,
      nativeCurrency: "CAD",
      amountCad: 25,
      verifiedAt: "2026-01-01",
    },
  ];

  assert.equal(selectStrongestBenchmark(benchmarks)?.id, "msrp");
});

test("target-market offers are filtered from explicit availableMarkets", () => {
  const offer = {
    id: "international-retailer",
    nativeAmount: 2508,
    nativeCurrency: "JPY",
    amountCad: 22.62,
    availableMarkets: ["CA", "JP"],
    availabilityState: "IN_STOCK",
  };

  assert.equal(isOfferEligibleForMarket(offer, "CA"), true);
  assert.equal(isOfferEligibleForMarket(offer, "KR"), false);
  assert.equal(
    isOfferEligibleForMarket({ ...offer, availabilityState: "OUT_OF_STOCK" }, "JP"),
    false,
  );
});

test("destination offer ordering uses product price and never shipping", () => {
  const offers = [
    {
      id: "higher",
      nativeAmount: 2508,
      nativeCurrency: "JPY",
      amountCad: 22.62,
      availableMarkets: ["JP"],
      availabilityState: "IN_STOCK",
      shippingAmount: 0,
    },
    {
      id: "lower",
      nativeAmount: 2200,
      nativeCurrency: "JPY",
      amountCad: 19.84,
      availableMarkets: ["JP"],
      availabilityState: "IN_STOCK",
      shippingAmount: 5000,
    },
  ];

  assert.deepEqual(offers.sort(compareDestinationOffers).map((offer) => offer.id), [
    "lower",
    "higher",
  ]);
});

test("savings are quantity-aware and missing benchmarks are excluded, never zero", () => {
  const estimate = calculateShoppingListEstimate([
    {
      itemId: "covered",
      productLabel: "Covered product",
      quantity: 3,
      offer: {
        id: "offer",
        nativeAmount: 10,
        nativeCurrency: "CAD",
        amountCad: 10,
        availableMarkets: ["CA"],
        availabilityState: "IN_STOCK",
      },
      benchmark: {
        id: "benchmark",
        type: "RETAIL_PRICE",
        nativeAmount: 15,
        nativeCurrency: "CAD",
        amountCad: 15,
        verifiedAt: "2026-09-12",
      },
    },
    {
      itemId: "missing",
      productLabel: "Missing product",
      quantity: 2,
      offer: {
        id: "offer-2",
        nativeAmount: 7,
        nativeCurrency: "CAD",
        amountCad: 7,
        availableMarkets: ["CA"],
        availabilityState: "IN_STOCK",
      },
      benchmark: null,
    },
  ]);

  assert.equal(estimate.destinationTotalCad, 44);
  assert.equal(estimate.savingsCad, 15);
  assert.equal(estimate.includedProductCount, 1);
  assert.equal(estimate.excludedProductCount, 1);
  assert.equal(estimate.isPartial, true);
  assert.equal(estimate.exclusions[0]?.reason, "NO_VERIFIED_BENCHMARK");
});

test("a zero savings estimate means an eligible offer matches its target-market benchmark", () => {
  const estimate = calculateShoppingListEstimate([
    {
      itemId: "matching-price",
      productLabel: "Matching price product",
      quantity: 1,
      offer: {
        id: "offer",
        nativeAmount: 20,
        nativeCurrency: "CAD",
        amountCad: 20,
        availableMarkets: ["CA"],
        availabilityState: "IN_STOCK",
      },
      benchmark: {
        id: "benchmark",
        type: "RETAIL_PRICE",
        nativeAmount: 20,
        nativeCurrency: "CAD",
        amountCad: 20,
        verifiedAt: "2026-09-12",
      },
    },
  ]);

  assert.equal(estimate.destinationTotalCad, 20);
  assert.equal(estimate.savingsCad, 0);
  assert.equal(estimate.includedProductCount, 1);
  assert.equal(estimate.isPartial, false);
});

test("an unavailable CAD conversion excludes the item instead of inventing a value", () => {
  const estimate = calculateShoppingListEstimate([
    {
      itemId: "no-rate",
      productLabel: "Native-only product",
      quantity: 1,
      offer: {
        id: "offer",
        nativeAmount: 20,
        nativeCurrency: "XYZ",
        amountCad: null,
        availableMarkets: ["JP"],
        availabilityState: "IN_STOCK",
      },
      benchmark: {
        id: "benchmark",
        type: "REFERENCE_PRICE",
        nativeAmount: 25,
        nativeCurrency: "XYZ",
        amountCad: null,
        verifiedAt: "2026-09-12",
      },
    },
  ]);

  assert.equal(estimate.destinationTotalCad, null);
  assert.equal(estimate.savingsCad, null);
  assert.equal(estimate.includedProductCount, 0);
  assert.equal(estimate.isPartial, true);
});
