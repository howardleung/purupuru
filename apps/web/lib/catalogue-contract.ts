import type {
  CatalogueCapacityDimension,
  CatalogueCapacityRange,
  CatalogueSort,
} from "@beauty-platform/domain/catalogue";

export type CatalogueProduct = {
  id: string;
  productFamilyId: string;
  slug: string;
  canonicalName: string;
  originMarket: string | null;
  brand: { name: string; slug: string };
  primaryCanonicalCategory: { id: string; displayName: string; slug: string };
  currentVersion: {
    id: string;
    versionCode: string | null;
    versionName: string;
    image: {
      id: string;
      productVersionId: string;
      productVariantId: string | null;
      url: string;
      altText: string;
      isPrimary: boolean;
      sortOrder: number;
    } | null;
    variant: {
      id: string;
      displaySize: string;
      normalizedQuantity: number;
      normalizedUnit: string;
    };
    benchmarks: Array<{
      id: string;
      type: string;
      market: string;
      nativeAmount: number;
      nativeCurrency: string;
      sourceDisplayName: string;
      sourceUrl: string | null;
      verifiedAt: string;
    }>;
    lowestCanadianPrice: {
      nativeAmount: number;
      nativeCurrency: string;
      amountCad: number | null;
    } | null;
  } | null;
};

export type CatalogueFilters = {
  query: string;
  categorySlugs: string[];
  brandSlugs: string[];
  minimumCad: number | null;
  maximumCad: number | null;
  capacityDimension: CatalogueCapacityDimension | null;
  minimumCapacity: number | null;
  maximumCapacity: number | null;
  capacityRanges: CatalogueCapacityRange[];
  trackedOnly: boolean;
  sort: CatalogueSort;
};

export type CatalogueSortColumn = "PRICE" | "PRODUCT" | "BRAND";
export type CatalogueSortDirection = "ascending" | "descending";

export function getCatalogueSortDirection(
  sort: CatalogueSort,
  column: CatalogueSortColumn,
): CatalogueSortDirection | null {
  if (sort === `${column}_ASC`) return "ascending";
  if (sort === `${column}_DESC`) return "descending";
  return null;
}

export function getNextCatalogueSort(
  sort: CatalogueSort,
  column: CatalogueSortColumn,
): CatalogueSort {
  return getCatalogueSortDirection(sort, column) === "ascending"
    ? `${column}_DESC`
    : `${column}_ASC`;
}

export const catalogueSorts: Array<{ value: CatalogueSort; label: string }> = [
  { value: "PRICE_ASC", label: "Price: low to high" },
  { value: "PRICE_DESC", label: "Price: high to low" },
  { value: "PRODUCT_ASC", label: "Product: A to Z" },
  { value: "PRODUCT_DESC", label: "Product: Z to A" },
  { value: "BRAND_ASC", label: "Brand: A to Z" },
  { value: "BRAND_DESC", label: "Brand: Z to A" },
];
