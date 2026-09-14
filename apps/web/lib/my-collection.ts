import "server-only";

import { prisma, type Prisma } from "@beauty-platform/database";
import {
  normalizeCollectionItems,
  type CollectionContribution,
  type CollectionVersionBase,
  type MyCollectionItem,
} from "@beauty-platform/domain/my-collection";
import { selectPrimaryProductImage } from "@beauty-platform/domain/product-images";

const versionContext = {
  productFamily: {
    include: {
      brand: true,
      primaryCanonicalCategory: true,
    },
  },
  defaultVariant: true,
  variants: {
    where: { isActive: true },
    orderBy: [{ normalizedQuantity: "asc" }, { normalizedUnit: "asc" }],
    take: 1,
  },
  images: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
  },
} satisfies Prisma.ProductVersionInclude;

type VersionContext = Prisma.ProductVersionGetPayload<{ include: typeof versionContext }>;

function variantContext(variant: { id: string; displaySize: string } | null | undefined) {
  return variant ? { id: variant.id, label: variant.displaySize } : null;
}

function versionBase(version: VersionContext): CollectionVersionBase {
  const family = version.productFamily;
  const fallbackVariant = version.defaultVariant ?? version.variants[0] ?? null;

  return {
    productVersionId: version.id,
    productFamilyId: family.id,
    productSlug: family.slug,
    productName: family.canonicalName,
    brandName: family.brand.name,
    versionName: version.versionName,
    categoryName: family.primaryCanonicalCategory.displayName,
    defaultVariantId: fallbackVariant?.id ?? null,
    defaultVariantLabel: fallbackVariant?.displaySize ?? null,
  };
}

export async function getMyCollectionForUser(
  userId: string,
  options: { productVersionIds?: readonly string[] } = {},
): Promise<MyCollectionItem[]> {
  const productVersionIds = options.productVersionIds
    ? [...new Set(options.productVersionIds)]
    : null;
  if (productVersionIds?.length === 0) return [];

  const versionWhere = productVersionIds
    ? { productVersionId: { in: productVersionIds } }
    : {};
  const purchaseVersionWhere = productVersionIds
    ? { productVariant: { productVersionId: { in: productVersionIds } } }
    : {};

  const [entries, ratings, purchases] = await Promise.all([
    prisma.collectionEntry.findMany({
      where: { userId, ...versionWhere },
      include: {
        tags: true,
        selectedVariant: true,
        productVersion: { include: versionContext },
      },
    }),
    prisma.userRating.findMany({
      where: { userId, ...versionWhere },
      include: {
        contextualVariant: true,
        productVersion: { include: versionContext },
      },
    }),
    prisma.purchaseInstance.findMany({
      where: { userId, ...purchaseVersionWhere },
      include: {
        retailer: true,
        productVariant: {
          include: {
            productVersion: { include: versionContext },
          },
        },
      },
    }),
  ]);

  const contributions: CollectionContribution[] = [
    ...entries.map(
      (entry): CollectionContribution => ({
        kind: "RELATIONSHIP",
        base: versionBase(entry.productVersion),
        wants: entry.wants,
        tried: entry.tried,
        tagKinds: entry.tags.map((tag) => tag.kind),
        selectedVariant: variantContext(entry.selectedVariant),
        updatedAt: entry.updatedAt.toISOString(),
      }),
    ),
    ...ratings.map(
      (rating): CollectionContribution => ({
        kind: "RATING",
        base: versionBase(rating.productVersion),
        ratingHalfSteps: rating.ratingHalfSteps,
        contextualVariant: variantContext(rating.contextualVariant),
        updatedAt: rating.updatedAt.toISOString(),
      }),
    ),
    ...purchases.map(
      (purchase): CollectionContribution => ({
        kind: "PURCHASE",
        base: versionBase(purchase.productVariant.productVersion),
        purchase: {
          id: purchase.id,
          quantity: purchase.quantity,
          purchaseDate: purchase.purchaseDate?.toISOString() ?? null,
          createdAt: purchase.createdAt.toISOString(),
          updatedAt: purchase.updatedAt.toISOString(),
          source: purchase.source,
          retailerName: purchase.retailer?.name ?? purchase.customRetailer ?? null,
          variant: {
            id: purchase.productVariant.id,
            label: purchase.productVariant.displaySize,
          },
        },
      }),
    ),
  ];

  const versions = [
    ...entries.map((entry) => entry.productVersion),
    ...ratings.map((rating) => rating.productVersion),
    ...purchases.map((purchase) => purchase.productVariant.productVersion),
  ];
  const versionById = new Map(versions.map((version) => [version.id, version]));

  return normalizeCollectionItems(contributions).map((item) => {
    const version = versionById.get(item.productVersionId);
    return {
      ...item,
      image: version
        ? selectPrimaryProductImage(version.images, version.id, item.selectedVariantId)
        : null,
    };
  });
}
