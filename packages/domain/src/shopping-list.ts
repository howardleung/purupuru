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
  offer: ShoppingListOffer | null;
  benchmark: ShoppingListBenchmark | null;
};

export type ShoppingListEstimateExclusion = {
  itemId: string;
  productLabel: string;
  reason: "NO_DESTINATION_OFFER" | "NO_VERIFIED_BENCHMARK" | "CAD_CONVERSION_UNAVAILABLE";
};

export type ShoppingListEstimate = {
  destinationTotalCad: number | null;
  savingsCad: number | null;
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

export function nextQuantityAfterAdd(currentQuantity: number, addedQuantity: number): number | null {
  if (!validateRequestedQuantity(currentQuantity) || !validateRequestedQuantity(addedQuantity)) {
    return null;
  }

  return currentQuantity + addedQuantity;
}

export function validateQuantityUpdate(quantity: number, purchasedQuantity: number): boolean {
  return (
    validateRequestedQuantity(quantity) &&
    Number.isInteger(purchasedQuantity) &&
    purchasedQuantity >= 0 &&
    purchasedQuantity <= quantity
  );
}

export function purchaseDelta(
  quantity: number,
  currentPurchasedQuantity: number,
  nextPurchasedQuantity: number,
): number | null {
  if (
    !validateQuantityUpdate(quantity, currentPurchasedQuantity) ||
    !validateQuantityUpdate(quantity, nextPurchasedQuantity) ||
    nextPurchasedQuantity < currentPurchasedQuantity
  ) {
    return null;
  }

  return nextPurchasedQuantity - currentPurchasedQuantity;
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
  let destinationTotalCad = 0;
  let destinationTotalCoverage = 0;
  let savingsCad = 0;
  let includedProductCount = 0;
  const exclusions: ShoppingListEstimateExclusion[] = [];

  for (const item of items) {
    if (item.offer && item.offer.amountCad !== null) {
      destinationTotalCad += item.offer.amountCad * item.quantity;
      destinationTotalCoverage += 1;
    }

    if (!item.offer) {
      exclusions.push({
        itemId: item.itemId,
        productLabel: item.productLabel,
        reason: "NO_DESTINATION_OFFER",
      });
      continue;
    }

    if (!item.benchmark) {
      exclusions.push({
        itemId: item.itemId,
        productLabel: item.productLabel,
        reason: "NO_VERIFIED_BENCHMARK",
      });
      continue;
    }

    if (item.offer.amountCad === null || item.benchmark.amountCad === null) {
      exclusions.push({
        itemId: item.itemId,
        productLabel: item.productLabel,
        reason: "CAD_CONVERSION_UNAVAILABLE",
      });
      continue;
    }

    savingsCad += (item.benchmark.amountCad - item.offer.amountCad) * item.quantity;
    includedProductCount += 1;
  }

  return {
    destinationTotalCad:
      destinationTotalCoverage === items.length && items.length > 0
        ? roundCurrency(destinationTotalCad)
        : null,
    savingsCad: includedProductCount > 0 ? roundCurrency(savingsCad) : null,
    includedProductCount,
    excludedProductCount: exclusions.length,
    isPartial: exclusions.length > 0,
    exclusions,
  };
}
