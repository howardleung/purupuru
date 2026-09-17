export const BENCHMARK_PRECEDENCE = ["MSRP", "RETAIL_PRICE", "REFERENCE_PRICE"] as const;

export type BenchmarkKind = (typeof BENCHMARK_PRECEDENCE)[number];

export type ShoppingListBenchmark = {
  id: string;
  type: BenchmarkKind;
  nativeAmount: number;
  nativeCurrency: string;
  amountCad: number | null;
  verifiedAt: Date | string;
};

export type ShoppingListOffer = {
  id: string;
  nativeAmount: number;
  nativeCurrency: string;
  amountCad: number | null;
  availableMarkets: readonly string[];
  availabilityState: string;
};

export type ShoppingListEstimateItem = {
  itemId: string;
  productLabel: string;
  quantity: number;
  purchased: boolean;
  benchmark: ShoppingListBenchmark | null;
  localOffer: ShoppingListOffer | null;
};

export type ShoppingListEstimateExclusion = {
  itemId: string;
  productLabel: string;
  reason: "NO_VERIFIED_BENCHMARK" | "NO_LOCAL_OFFER" | "CAD_CONVERSION_UNAVAILABLE";
};

export type ShoppingListEstimate = {
  plannedTotalCad: number | null;
  localTotalCad: number | null;
  savingsCad: number | null;
  alreadySavedCad: number | null;
  includedProductCount: number;
  excludedProductCount: number;
  isPartial: boolean;
  exclusions: ShoppingListEstimateExclusion[];
};

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function validateRequestedQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1;
}

export function parseRequestedQuantity(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const quantity = Number(value);
  return Number.isSafeInteger(quantity) && validateRequestedQuantity(quantity) ? quantity : null;
}

export function validateQuantityUpdate(quantity: number, purchasedQuantity: number): boolean {
  return (
    validateRequestedQuantity(quantity) &&
    Number.isInteger(purchasedQuantity) &&
    purchasedQuantity >= 0 &&
    purchasedQuantity <= quantity
  );
}

export function checklistPurchasedQuantity(quantity: number, purchased: boolean): number | null {
  if (!validateRequestedQuantity(quantity)) return null;
  return purchased ? quantity : 0;
}

export function quantityStateAfterChange(
  currentQuantity: number,
  currentPurchasedQuantity: number,
  nextQuantity: number,
): { quantity: number; purchasedQuantity: number } | null {
  if (
    !validateQuantityUpdate(currentQuantity, currentPurchasedQuantity) ||
    !validateRequestedQuantity(nextQuantity)
  ) {
    return null;
  }

  return {
    quantity: nextQuantity,
    purchasedQuantity: currentPurchasedQuantity === currentQuantity ? nextQuantity : 0,
  };
}

export function selectStrongestBenchmark<T extends ShoppingListBenchmark>(
  benchmarks: readonly T[],
): T | null {
  return [...benchmarks].sort((a, b) => {
    const typeDifference =
      BENCHMARK_PRECEDENCE.indexOf(a.type) - BENCHMARK_PRECEDENCE.indexOf(b.type);
    if (typeDifference !== 0) return typeDifference;

    return new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime();
  })[0] ?? null;
}

export function isOfferEligibleForMarket(
  offer: ShoppingListOffer,
  targetMarket: string,
): boolean {
  return (
    offer.availableMarkets.includes(targetMarket) &&
    offer.availabilityState !== "OUT_OF_STOCK"
  );
}

export function compareDestinationOffers(a: ShoppingListOffer, b: ShoppingListOffer): number {
  if (a.nativeCurrency === b.nativeCurrency) return a.nativeAmount - b.nativeAmount;
  if (a.amountCad !== null && b.amountCad !== null) return a.amountCad - b.amountCad;
  if (a.amountCad !== null) return -1;
  if (b.amountCad !== null) return 1;
  return a.nativeCurrency.localeCompare(b.nativeCurrency) || a.nativeAmount - b.nativeAmount;
}

export function calculateShoppingListEstimate(
  items: readonly ShoppingListEstimateItem[],
): ShoppingListEstimate {
  let plannedTotalCad = 0;
  let plannedTotalCoverage = 0;
  let localTotalCad = 0;
  let localTotalCoverage = 0;
  let savingsCad = 0;
  let alreadySavedCad = 0;
  let alreadySavedCoverage = 0;
  let includedProductCount = 0;
  const exclusions: ShoppingListEstimateExclusion[] = [];

  for (const item of items) {
    if (item.benchmark && item.benchmark.amountCad !== null) {
      plannedTotalCad += item.benchmark.amountCad * item.quantity;
      plannedTotalCoverage += 1;
    }
    if (item.localOffer && item.localOffer.amountCad !== null) {
      localTotalCad += item.localOffer.amountCad * item.quantity;
      localTotalCoverage += 1;
    }

    if (!item.benchmark) {
      exclusions.push({
        itemId: item.itemId,
        productLabel: item.productLabel,
        reason: "NO_VERIFIED_BENCHMARK",
      });
      continue;
    }

    if (!item.localOffer) {
      exclusions.push({
        itemId: item.itemId,
        productLabel: item.productLabel,
        reason: "NO_LOCAL_OFFER",
      });
      continue;
    }

    if (item.benchmark.amountCad === null || item.localOffer.amountCad === null) {
      exclusions.push({
        itemId: item.itemId,
        productLabel: item.productLabel,
        reason: "CAD_CONVERSION_UNAVAILABLE",
      });
      continue;
    }

    const itemSavings = (item.localOffer.amountCad - item.benchmark.amountCad) * item.quantity;
    savingsCad += itemSavings;
    if (item.purchased) {
      alreadySavedCad += itemSavings;
      alreadySavedCoverage += 1;
    }
    includedProductCount += 1;
  }

  return {
    plannedTotalCad:
      plannedTotalCoverage === items.length && items.length > 0
        ? roundCurrency(plannedTotalCad)
        : null,
    localTotalCad:
      localTotalCoverage === items.length && items.length > 0
        ? roundCurrency(localTotalCad)
        : null,
    savingsCad: includedProductCount > 0 ? roundCurrency(savingsCad) : null,
    alreadySavedCad: alreadySavedCoverage > 0 ? roundCurrency(alreadySavedCad) : null,
    includedProductCount,
    excludedProductCount: exclusions.length,
    isPartial: exclusions.length > 0,
    exclusions,
  };
}
