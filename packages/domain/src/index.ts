export type VariantIdentity = {
  id: string;
  normalizedQuantity: number;
  normalizedUnit: string;
};

export type OfferPrice = {
  productPrice: number;
  nativeCurrency: string;
  cadConvertedPrice: number | null;
};

export type StructuredOfferItem = {
  label: string;
  quantity: number;
  itemType: "SAME_PRODUCT" | "OTHER_PRODUCT" | "MINI" | "GIFT_ACCESSORY";
  relatedProductVariantId: string | null;
};

export function getOfferExtraLabels({
  items,
  primaryProductVariantId,
  primaryQuantity,
}: {
  items: readonly StructuredOfferItem[];
  primaryProductVariantId: string;
  primaryQuantity: number;
}): string[] {
  const primaryItemQuantity = items.reduce((maximum, item) => {
    const describesPrimaryItem =
      item.itemType === "SAME_PRODUCT" &&
      (item.relatedProductVariantId === null || item.relatedProductVariantId === primaryProductVariantId);
    return describesPrimaryItem ? Math.max(maximum, item.quantity) : maximum;
  }, primaryQuantity);
  const labels = primaryItemQuantity > 1 ? [`${primaryItemQuantity}-pack`] : [];

  for (const item of items) {
    const describesPrimaryItem =
      item.itemType === "SAME_PRODUCT" &&
      (item.relatedProductVariantId === null || item.relatedProductVariantId === primaryProductVariantId);
    if (describesPrimaryItem) continue;
    labels.push(item.quantity > 1 ? `${item.quantity} × ${item.label}` : item.label);
  }

  return labels;
}

export function convertCurrencyAmount(
  amount: number,
  targetCurrencyUnitsPerSourceUnit: number,
  fractionDigits = 2,
): number | null {
  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    !Number.isFinite(targetCurrencyUnitsPerSourceUnit) ||
    targetCurrencyUnitsPerSourceUnit <= 0 ||
    !Number.isInteger(fractionDigits) ||
    fractionDigits < 0
  ) {
    return null;
  }

  const scale = 10 ** fractionDigits;
  return Math.round((amount * targetCurrencyUnitsPerSourceUnit + Number.EPSILON) * scale) / scale;
}
export function chooseVariantForVersion<T extends VariantIdentity>(
  variants: readonly T[],
  selectedVariant: VariantIdentity | null,
  defaultVariantId: string | null,
): T | null {
  if (selectedVariant) {
    const exactSize = variants.find(
      (variant) =>
        variant.normalizedQuantity === selectedVariant.normalizedQuantity &&
        variant.normalizedUnit === selectedVariant.normalizedUnit,
    );

    if (exactSize) {
      return exactSize;
    }
  }

  return variants.find((variant) => variant.id === defaultVariantId) ?? variants[0] ?? null;
}

function comparableCadPrice(offer: OfferPrice): number | null {
  if (offer.nativeCurrency === "CAD") {
    return offer.productPrice;
  }

  return offer.cadConvertedPrice;
}

export function compareOffersByProductPrice(a: OfferPrice, b: OfferPrice): number {
  const aCad = comparableCadPrice(a);
  const bCad = comparableCadPrice(b);

  if (aCad !== null && bCad !== null) {
    return aCad - bCad;
  }

  if (aCad !== null) return -1;
  if (bCad !== null) return 1;

  const currencyOrder = a.nativeCurrency.localeCompare(b.nativeCurrency);
  return currencyOrder || a.productPrice - b.productPrice;
}
