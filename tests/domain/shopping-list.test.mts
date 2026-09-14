import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateShoppingListEstimate,
  checklistPurchasedQuantity,
  compareDestinationOffers,
  isOfferEligibleForMarket,
  nextQuantityAfterAdd,
  parseRequestedQuantity,
  quantityStateAfterChange,
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

test("direct quantity entry accepts only positive decimal integers", () => {
  assert.equal(parseRequestedQuantity("12"), 12);
  assert.equal(parseRequestedQuantity("1"), 1);
  assert.equal(parseRequestedQuantity(""), null);
  assert.equal(parseRequestedQuantity("0"), null);
  assert.equal(parseRequestedQuantity("-2"), null);
  assert.equal(parseRequestedQuantity("1.5"), null);
  assert.equal(parseRequestedQuantity("1e2"), null);
});

test("purchased quantity stays within total quantity", () => {
  assert.equal(validateQuantityUpdate(3, 2), true);
  assert.equal(validateQuantityUpdate(3, 4), false);
  assert.equal(validateQuantityUpdate(3, -1), false);
});

test("the reversible checklist maps unchecked to zero and checked to the full quantity", () => {
  assert.equal(checklistPurchasedQuantity(3, false), 0);
  assert.equal(checklistPurchasedQuantity(3, true), 3);
  assert.equal(checklistPurchasedQuantity(0, true), null);
});

test("quantity changes preserve a fully purchased checklist state", () => {
  assert.deepEqual(quantityStateAfterChange(2, 2, 3), { quantity: 3, purchasedQuantity: 3 });
  assert.deepEqual(quantityStateAfterChange(3, 3, 1), { quantity: 1, purchasedQuantity: 1 });
  assert.deepEqual(quantityStateAfterChange(2, 0, 3), { quantity: 3, purchasedQuantity: 0 });
  assert.equal(quantityStateAfterChange(2, 2, 0), null);
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

test("savings compare selected local retailers with target-market benchmarks and remain quantity-aware", () => {
  const estimate = calculateShoppingListEstimate([
    {
      itemId: "covered",
      productLabel: "Covered product",
      quantity: 3,
      purchased: true,
      benchmark: {
        id: "benchmark",
        type: "RETAIL_PRICE",
        nativeAmount: 10,
        nativeCurrency: "CAD",
        amountCad: 10,
        verifiedAt: "2026-09-12",
      },
      localOffer: {
        id: "local-offer",
        nativeAmount: 15,
        nativeCurrency: "CAD",
        amountCad: 15,
        availableMarkets: ["CA"],
        availabilityState: "IN_STOCK",
      },
    },
    {
      itemId: "missing",
      productLabel: "Missing product",
      quantity: 2,
      purchased: false,
      benchmark: {
        id: "benchmark-2",
        type: "MSRP",
        nativeAmount: 7,
        nativeCurrency: "CAD",
        amountCad: 7,
        verifiedAt: "2026-09-12",
      },
      localOffer: null,
    },
  ]);

  assert.equal(estimate.plannedTotalCad, 44);
  assert.equal(estimate.localTotalCad, null);
  assert.equal(estimate.savingsCad, 15);
  assert.equal(estimate.alreadySavedCad, 15);
  assert.equal(estimate.includedProductCount, 1);
  assert.equal(estimate.excludedProductCount, 1);
  assert.equal(estimate.isPartial, true);
  assert.equal(estimate.exclusions[0]?.reason, "NO_LOCAL_OFFER");
});

test("checking, unchecking, and quantity changes update already-saved totals", () => {
  const item = {
    itemId: "comparison",
    productLabel: "Comparison product",
    benchmark: {
      id: "benchmark",
      type: "RETAIL_PRICE" as const,
      nativeAmount: 10,
      nativeCurrency: "CAD",
      amountCad: 10,
      verifiedAt: "2026-09-12",
    },
    localOffer: {
      id: "local-offer",
      nativeAmount: 15,
      nativeCurrency: "CAD",
      amountCad: 15,
      availableMarkets: ["CA"],
      availabilityState: "IN_STOCK",
    },
  };
  const estimate = calculateShoppingListEstimate([{ ...item, quantity: 2, purchased: false }]);
  const checked = calculateShoppingListEstimate([{ ...item, quantity: 2, purchased: true }]);
  const checkedAfterIncrease = calculateShoppingListEstimate([{ ...item, quantity: 3, purchased: true }]);
  const uncheckedAgain = calculateShoppingListEstimate([{ ...item, quantity: 3, purchased: false }]);

  assert.equal(estimate.plannedTotalCad, 20);
  assert.equal(estimate.localTotalCad, 30);
  assert.equal(estimate.savingsCad, 10);
  assert.equal(estimate.alreadySavedCad, null);
  assert.equal(checked.alreadySavedCad, 10);
  assert.equal(checkedAfterIncrease.alreadySavedCad, 15);
  assert.equal(uncheckedAgain.alreadySavedCad, null);
  assert.equal(estimate.includedProductCount, 1);
  assert.equal(estimate.isPartial, false);
});

test("an unavailable CAD conversion excludes the item instead of inventing a value", () => {
  const estimate = calculateShoppingListEstimate([
    {
      itemId: "no-rate",
      productLabel: "Native-only product",
      quantity: 1,
      purchased: true,
      benchmark: {
        id: "benchmark",
        type: "REFERENCE_PRICE",
        nativeAmount: 20,
        nativeCurrency: "XYZ",
        amountCad: null,
        verifiedAt: "2026-09-12",
      },
      localOffer: {
        id: "local-offer",
        nativeAmount: 25,
        nativeCurrency: "XYZ",
        amountCad: null,
        availableMarkets: ["CA"],
        availabilityState: "IN_STOCK",
      },
    },
  ]);

  assert.equal(estimate.plannedTotalCad, null);
  assert.equal(estimate.savingsCad, null);
  assert.equal(estimate.includedProductCount, 0);
  assert.equal(estimate.isPartial, true);
});

test("a missing benchmark stays missing and is excluded honestly", () => {
  const estimate = calculateShoppingListEstimate([{
    itemId: "missing-benchmark",
    productLabel: "Unknown benchmark product",
    quantity: 1,
    purchased: false,
    benchmark: null,
    localOffer: {
      id: "local-offer",
      nativeAmount: 25,
      nativeCurrency: "CAD",
      amountCad: 25,
      availableMarkets: ["CA"],
      availabilityState: "IN_STOCK",
    },
  }]);

  assert.equal(estimate.plannedTotalCad, null);
  assert.equal(estimate.savingsCad, null);
  assert.equal(estimate.exclusions[0]?.reason, "NO_VERIFIED_BENCHMARK");
});
