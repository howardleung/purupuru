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
};

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
