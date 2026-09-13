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
