import "server-only";

import { prisma } from "@beauty-platform/database";
import type { Prisma } from "@beauty-platform/database";
import {
  filterCatalogueCapacity,
  filterCataloguePrice,
  getCatalogueCapacityRanges,
  normalizeCatalogueCapacity,
  selectCatalogueFamilyVariant,
  selectLowestMarketOffer,
  sortCatalogueItems,
  type CatalogueCapacityDimension,
  type CatalogueSort,
} from "@beauty-platform/domain/catalogue";
import { selectPrimaryProductImage } from "@beauty-platform/domain/product-images";

import { catalogueSorts, type CatalogueFilters, type CatalogueProduct } from "./catalogue-contract";
import { normalizeCategorySlugs } from "./catalogue-filter-state";

const productDetailsInclude = {
  brand: true,
  primaryCanonicalCategory: true,
  versions: {
    orderBy: [{ releaseDate: "desc" }, { createdAt: "desc" }],
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
      },
      externalSignals: {
        orderBy: { verifiedAt: "desc" },
      },
      variants: {
        orderBy: { normalizedQuantity: "asc" },
        include: {
          benchmarkPrices: {
            orderBy: { verifiedAt: "desc" },
          },
          priceObservations: {
            orderBy: [{ observedAt: "asc" }, { id: "asc" }],
            include: { retailer: true },
          },
          offers: {
            where: { isActive: true },
            include: {
              retailer: true,
              items: {
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ProductFamilyInclude;

export type ProductFamilyDetails = Prisma.ProductFamilyGetPayload<{
  include: typeof productDetailsInclude;
}>;

const categorySelect = {
  id: true,
  slug: true,
  displayName: true,
  parentCategoryId: true,
  sortOrder: true,
  isActive: true,
} satisfies Prisma.CanonicalCategorySelect;

export type CategoryRecord = Prisma.CanonicalCategoryGetPayload<{
  select: typeof categorySelect;
}>;

export async function getCategories(): Promise<CategoryRecord[]> {
  return prisma.canonicalCategory.findMany({
    where: { isActive: true },
    orderBy: [{ parentCategoryId: "asc" }, { sortOrder: "asc" }, { displayName: "asc" }],
    select: categorySelect,
  });
}

export async function getBrands() {
  return prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, originMarket: true } });
}

export function getCategoryPath(categories: readonly CategoryRecord[], categoryId: string) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const path: CategoryRecord[] = [];
  let current = byId.get(categoryId);

  while (current) {
    path.unshift(current);
    current = current.parentCategoryId ? byId.get(current.parentCategoryId) : undefined;
  }

  return path;
}

function finiteNonNegative(value: number | undefined) {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : null;
}

function isCatalogueSort(value: string | undefined): value is CatalogueSort {
  return catalogueSorts.some((sort) => sort.value === value);
}

function isCapacityDimension(value: string | undefined): value is CatalogueCapacityDimension {
  return value === "volume" || value === "mass" || value === "count";
}

const catalogueVersionInclude = {
  include: {
    images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { id: "asc" }] },
    variants: {
      where: { isActive: true },
      orderBy: [{ normalizedQuantity: "asc" }, { id: "asc" }],
      include: {
        offers: {
          where: { isActive: true, availableMarkets: { has: "CA" } },
          include: { retailer: { select: { name: true } } },
        },
        benchmarkPrices: { orderBy: { verifiedAt: "desc" } },
      },
    },
  },
} satisfies Prisma.ProductVersionDefaultArgs;

export async function getCatalogue(options: {
  productVersionIds?: readonly string[];
  query?: string;
  categorySlugs?: readonly string[];
  categorySlug?: string;
  brandSlugs?: readonly string[];
  brandSlug?: string;
  minimumCad?: number;
  maximumCad?: number;
  capacityDimension?: string;
  minimumCapacity?: number;
  maximumCapacity?: number;
  trackedOnly?: boolean;
  sort?: string;
} = {}) {
  const query = options.query?.trim() ?? "";
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  const requestedCategorySlugs = options.categorySlugs?.length
    ? options.categorySlugs
    : options.categorySlug ? [options.categorySlug] : [];
  const requestedBrandSlugs = options.brandSlugs?.length
    ? options.brandSlugs
    : options.brandSlug ? [options.brandSlug] : [];
  const categorySlugs = normalizeCategorySlugs(categories, requestedCategorySlugs);
  const categoryIds = categories
    .filter((category) => categorySlugs.includes(category.slug))
    .map((category) => category.id);
  const availableBrandSlugs = new Set(brands.map((brand) => brand.slug));
  const brandSlugs = [...new Set(requestedBrandSlugs)].filter((slug) => availableBrandSlugs.has(slug));
  const aliasProductIds = query
    ? (await prisma.productFamily.findMany({ select: { id: true, commonEnglishAliases: true } }))
        .filter((product) => product.commonEnglishAliases.some((alias) => alias.toLocaleLowerCase().includes(query.toLocaleLowerCase())))
        .map((product) => product.id)
    : [];
  const selectedCategory = requestedCategorySlugs.length === 1
    ? categories.find((category) => category.slug === requestedCategorySlugs[0]) ?? null
    : null;

  const productRecords = await prisma.productFamily.findMany({
    where: {
      AND: [
        options.productVersionIds ? { versions: { some: { id: { in: [...options.productVersionIds] } } } } : {},
        categoryIds.length > 0 ? { primaryCanonicalCategoryId: { in: categoryIds } } : {},
        brandSlugs.length > 0 ? { brand: { slug: { in: brandSlugs } } } : {},
        query
          ? {
              OR: [
                { canonicalName: { contains: query, mode: "insensitive" } },
                { brand: { name: { contains: query, mode: "insensitive" } } },
                { id: { in: aliasProductIds } },
                { primaryCanonicalCategory: { displayName: { contains: query, mode: "insensitive" } } },
              ],
            }
          : {},
      ],
    },
    include: {
      brand: true,
      primaryCanonicalCategory: true,
      _count: { select: { versions: true } },
      currentVersion: catalogueVersionInclude,
      versions: {
        where: { id: { in: [...(options.productVersionIds ?? [])] } },
        ...catalogueVersionInclude,
      },
    },
    orderBy: [{ canonicalName: "asc" }],
  });
  const reviewGroups = productRecords.length > 0
    ? await prisma.review.groupBy({
        by: ["productFamilyId"],
        where: { productFamilyId: { in: productRecords.map((product) => product.id) } },
        _avg: { rating: true },
        _count: { _all: true },
      })
    : [];
  const reviewsByFamily = new Map(reviewGroups.map((group) => [group.productFamilyId, {
    average: group._avg.rating,
    count: group._count._all,
  }]));

  const minimumCad = finiteNonNegative(options.minimumCad);
  const maximumCad = finiteNonNegative(options.maximumCad);
  const capacityDimension = isCapacityDimension(options.capacityDimension)
    ? options.capacityDimension
    : null;
  const minimumCapacity = capacityDimension ? finiteNonNegative(options.minimumCapacity) : null;
  const maximumCapacity = capacityDimension ? finiteNonNegative(options.maximumCapacity) : null;
  const capacityRanges = getCatalogueCapacityRanges(productRecords.flatMap((product) =>
    product.currentVersion?.variants.map((variant) => ({
      normalizedQuantity: Number(variant.normalizedQuantity),
      normalizedUnit: variant.normalizedUnit,
    })) ?? [],
  ));
  const sort: CatalogueSort = isCatalogueSort(options.sort) ? options.sort : "PRICE_ASC";
  const products = productRecords.flatMap((product) => (options.productVersionIds
    ? product.versions
    : product.currentVersion ? [product.currentVersion] : []
  ).flatMap((version): CatalogueProduct[] => {
    if (!version) return [];

    const variantChoices = version.variants.map((variant) => {
      const lowestOffer = selectLowestMarketOffer(
        variant.offers
          .filter((offer) => offer.availabilityState !== "OUT_OF_STOCK")
          .map((offer) => ({
            ...offer,
            productPrice: Number(offer.productPrice),
            cadConvertedPrice: offer.cadConvertedPrice === null ? null : Number(offer.cadConvertedPrice),
          })),
        "CA",
      );
      return {
        id: variant.id,
        variant,
        lowestOffer,
        lowestPriceCad: lowestOffer
          ? lowestOffer.nativeCurrency === "CAD"
            ? lowestOffer.productPrice
            : lowestOffer.cadConvertedPrice
          : null,
        normalizedQuantity: Number(variant.normalizedQuantity),
        normalizedUnit: variant.normalizedUnit,
      };
    });
    const matchingChoices = filterCatalogueCapacity(
      variantChoices,
      capacityDimension,
      minimumCapacity,
      maximumCapacity,
    );
    const eligibleChoices = filterCataloguePrice(matchingChoices.map((choice) => ({
      ...choice,
      productName: product.canonicalName,
      brandName: product.brand.name,
    })), minimumCad, maximumCad, Boolean(options.trackedOnly));
    const selected = selectCatalogueFamilyVariant(eligibleChoices, version.defaultVariantId);
    if (!selected) return [];

    const reviewSummary = reviewsByFamily.get(product.id) ?? { average: null, count: 0 };
    const { variant, lowestOffer } = selected;

    return [{
      id: variant.id,
      productFamilyId: product.id,
      slug: product.slug,
      canonicalName: product.canonicalName,
      originMarket: product.originMarket,
      brand: { name: product.brand.name, slug: product.brand.slug },
      primaryCanonicalCategory: {
        id: product.primaryCanonicalCategory.id,
        displayName: product.primaryCanonicalCategory.displayName,
        slug: product.primaryCanonicalCategory.slug,
      },
      reviewSummary,
      currentVersion: {
        id: version.id,
        versionCode: version.versionCode,
        versionName: version.versionName,
        showVersionName: product._count.versions > 1,
        image: selectPrimaryProductImage(version.images, version.id, variant.id),
        variant: {
          id: variant.id,
          displaySize: variant.displaySize,
          normalizedQuantity: Number(variant.normalizedQuantity),
          normalizedUnit: variant.normalizedUnit,
        },
        variants: version.variants.map((availableVariant) => ({
          id: availableVariant.id,
          displaySize: availableVariant.displaySize,
          normalizedQuantity: Number(availableVariant.normalizedQuantity),
          normalizedUnit: availableVariant.normalizedUnit,
        })),
        benchmarks: variant.benchmarkPrices.map((benchmark) => ({
          id: benchmark.id,
          type: benchmark.type,
          market: benchmark.market,
          nativeAmount: Number(benchmark.amount),
          nativeCurrency: benchmark.nativeCurrency,
          amountCad: benchmark.nativeCurrency === "CAD"
            ? Number(benchmark.amount)
            : benchmark.cadConvertedAmount === null
              ? null
              : Number(benchmark.cadConvertedAmount),
          sourceDisplayName: benchmark.sourceDisplayName,
          sourceUrl: benchmark.sourceUrl,
          verifiedAt: benchmark.verifiedAt.toISOString(),
        })),
        lowestCanadianPrice: lowestOffer
          ? {
              nativeAmount: lowestOffer.productPrice,
              nativeCurrency: lowestOffer.nativeCurrency,
              amountCad: selected.lowestPriceCad,
              retailerName: lowestOffer.retailer.name,
            }
          : null,
      },
    }];
  }));

  const visibleProducts = sortCatalogueItems(
    products.map((product) => ({
      ...product,
      productName: product.canonicalName,
      brandName: product.brand.name,
      lowestPriceCad: product.currentVersion!.lowestCanadianPrice?.amountCad ?? null,
      sizeSort: normalizeCatalogueCapacity(
        product.currentVersion!.variant.normalizedQuantity,
        product.currentVersion!.variant.normalizedUnit,
      )?.amount ?? product.currentVersion!.variant.normalizedQuantity,
    })),
    sort,
  );

  const filters: CatalogueFilters = {
    query,
    categorySlugs,
    brandSlugs,
    minimumCad,
    maximumCad,
    capacityDimension,
    minimumCapacity,
    maximumCapacity,
    capacityRanges,
    trackedOnly: Boolean(options.trackedOnly),
    sort,
  };

  return {
    categories,
    brands,
    products: visibleProducts,
    selectedCategory,
    breadcrumbs: selectedCategory ? getCategoryPath(categories, selectedCategory.id) : [],
    query,
    filters,
  };
}

export async function getComparisonProducts(productIds: readonly string[]) {
  const uniqueIds = [...new Set(productIds)].slice(0, 4);
  if (uniqueIds.length === 0) return [];
  const catalogue = await getCatalogue();
  const byId = new Map(catalogue.products.map((product) => [product.id, product]));
  return uniqueIds.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
}

export async function getProductFamilyDetails(slug: string) {
  const [family, categories] = await Promise.all([
    prisma.productFamily.findUnique({
      where: { slug },
      include: productDetailsInclude,
    }),
    getCategories(),
  ]);

  return {
    family,
    categories,
    breadcrumbs: family
      ? getCategoryPath(categories, family.primaryCanonicalCategoryId)
      : [],
  };
}
