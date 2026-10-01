import { compareOffersByProductPrice } from "@beauty-platform/domain";

export type CatalogueOffer = {
  productPrice: number;
  nativeCurrency: string;
  cadConvertedPrice: number | null;
  availableMarkets: readonly string[];
};

export type CatalogueSort =
  | "PRICE_ASC"
  | "PRICE_DESC"
  | "PRODUCT_ASC"
  | "PRODUCT_DESC"
  | "BRAND_ASC"
  | "BRAND_DESC";

export type CatalogueSortable = {
  id: string;
  productName: string;
  brandName: string;
  lowestPriceCad: number | null;
  sizeSort?: number;
};

export type CatalogueCapacityDimension = "volume" | "mass" | "count";

export type CatalogueCapacity = {
  dimension: CatalogueCapacityDimension;
  amount: number;
  unit: "mL" | "g" | "count";
};

export type CatalogueCapacityRange = {
  dimension: CatalogueCapacityDimension;
  minimum: number;
  maximum: number;
  unit: CatalogueCapacity["unit"];
};

export function expandCatalogueVariants<TFamily, TVariant>(
  families: readonly { family: TFamily; variants: readonly TVariant[] }[],
): Array<{ family: TFamily; variant: TVariant }> {
  return families.flatMap(({ family, variants }) =>
    variants.map((variant) => ({ family, variant })),
  );
}

export function normalizeCatalogueCapacity(
  normalizedQuantity: number,
  normalizedUnit: string,
): CatalogueCapacity | null {
  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) return null;

  const unit = normalizedUnit.trim().toLocaleLowerCase();
  if (["ml", "millilitre", "millilitres", "milliliter", "milliliters"].includes(unit)) {
    return { dimension: "volume", amount: normalizedQuantity, unit: "mL" };
  }
  if (["l", "litre", "litres", "liter", "liters"].includes(unit)) {
    return { dimension: "volume", amount: normalizedQuantity * 1000, unit: "mL" };
  }
  if (["g", "gram", "grams"].includes(unit)) {
    return { dimension: "mass", amount: normalizedQuantity, unit: "g" };
  }
  if (["kg", "kilogram", "kilograms"].includes(unit)) {
    return { dimension: "mass", amount: normalizedQuantity * 1000, unit: "g" };
  }
  if (["count", "ct", "pad", "pads", "sheet", "sheets", "piece", "pieces", "pc", "pcs"].includes(unit)) {
    return { dimension: "count", amount: normalizedQuantity, unit: "count" };
  }
  return null;
}

export function getCatalogueCapacityRanges<T extends { normalizedQuantity: number; normalizedUnit: string }>(
  items: readonly T[],
): CatalogueCapacityRange[] {
  const values = new Map<CatalogueCapacityDimension, { amounts: number[]; unit: CatalogueCapacity["unit"] }>();
  for (const item of items) {
    const capacity = normalizeCatalogueCapacity(item.normalizedQuantity, item.normalizedUnit);
    if (!capacity) continue;
    const current = values.get(capacity.dimension) ?? { amounts: [], unit: capacity.unit };
    current.amounts.push(capacity.amount);
    values.set(capacity.dimension, current);
  }
  return (["volume", "mass", "count"] as const).flatMap((dimension) => {
    const value = values.get(dimension);
    if (!value?.amounts.length) return [];
    return [{
      dimension,
      minimum: Math.min(...value.amounts),
      maximum: Math.max(...value.amounts),
      unit: value.unit,
    }];
  });
}

export function filterCatalogueCapacity<T extends { normalizedQuantity: number; normalizedUnit: string }>(
  items: readonly T[],
  dimension: CatalogueCapacityDimension | null,
  minimum: number | null,
  maximum: number | null,
): T[] {
  if (!dimension) return [...items];
  return items.filter((item) => {
    const capacity = normalizeCatalogueCapacity(item.normalizedQuantity, item.normalizedUnit);
    if (!capacity || capacity.dimension !== dimension) return false;
    if (minimum !== null && capacity.amount < minimum) return false;
    if (maximum !== null && capacity.amount > maximum) return false;
    return true;
  });
}

export function selectLowestMarketOffer<T extends CatalogueOffer>(
  offers: readonly T[],
  market: string,
): T | null {
  return (
    offers
      .filter((offer) => offer.availableMarkets.includes(market))
      .sort(compareOffersByProductPrice)[0] ?? null
  );
}

function alphabetical(a: CatalogueSortable, b: CatalogueSortable) {
  return (
    a.productName.localeCompare(b.productName) ||
    a.brandName.localeCompare(b.brandName) ||
    (a.sizeSort ?? 0) - (b.sizeSort ?? 0) ||
    a.id.localeCompare(b.id)
  );
}

export function sortCatalogueItems<T extends CatalogueSortable>(
  items: readonly T[],
  sort: CatalogueSort,
): T[] {
  return [...items].sort((a, b) => {
    if (sort === "PRICE_ASC" || sort === "PRICE_DESC") {
      if (a.lowestPriceCad !== null && b.lowestPriceCad !== null) {
        const difference = a.lowestPriceCad - b.lowestPriceCad;
        if (difference !== 0) return sort === "PRICE_ASC" ? difference : -difference;
      } else if (a.lowestPriceCad !== null) {
        return -1;
      } else if (b.lowestPriceCad !== null) {
        return 1;
      }
    }

    if (sort === "BRAND_ASC" || sort === "BRAND_DESC") {
      const difference =
        a.brandName.localeCompare(b.brandName) ||
        a.productName.localeCompare(b.productName) ||
        (a.sizeSort ?? 0) - (b.sizeSort ?? 0) ||
        a.id.localeCompare(b.id);
      return sort === "BRAND_ASC" ? difference : -difference;
    }

    const difference = alphabetical(a, b);
    return sort === "PRODUCT_DESC" ? -difference : difference;
  });
}

export function filterCataloguePrice<T extends CatalogueSortable>(
  items: readonly T[],
  minimumCad: number | null,
  maximumCad: number | null,
  requireTrackedPrice: boolean,
): T[] {
  return items.filter((item) => {
    if (item.lowestPriceCad === null) {
      return !requireTrackedPrice && minimumCad === null && maximumCad === null;
    }
    if (minimumCad !== null && item.lowestPriceCad < minimumCad) return false;
    if (maximumCad !== null && item.lowestPriceCad > maximumCad) return false;
    return true;
  });
}
