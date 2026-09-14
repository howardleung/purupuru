import "server-only";

import { prisma } from "@beauty-platform/database";
import type { Prisma } from "@beauty-platform/database";

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

export type CategoryRecord = Awaited<ReturnType<typeof getCategories>>[number];

export async function getCategories() {
  return prisma.canonicalCategory.findMany({
    where: { isActive: true },
    orderBy: [{ parentCategoryId: "asc" }, { sortOrder: "asc" }, { displayName: "asc" }],
  });
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

function getCategoryAndDescendantIds(categories: readonly CategoryRecord[], categoryId: string) {
  const ids = new Set([categoryId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.parentCategoryId && ids.has(category.parentCategoryId) && !ids.has(category.id)) {
        ids.add(category.id);
        changed = true;
      }
    }
  }

  return [...ids];
}

export async function getCatalogue(options: { query?: string; categorySlug?: string } = {}) {
  const query = options.query?.trim() ?? "";
  const categories = await getCategories();
  const selectedCategory = options.categorySlug
    ? categories.find((category) => category.slug === options.categorySlug) ?? null
    : null;
  const categoryIds = selectedCategory
    ? getCategoryAndDescendantIds(categories, selectedCategory.id)
    : undefined;

  const products = await prisma.productFamily.findMany({
    where: {
      AND: [
        categoryIds ? { primaryCanonicalCategoryId: { in: categoryIds } } : {},
        query
          ? {
              OR: [
                { canonicalName: { contains: query, mode: "insensitive" } },
                { brand: { name: { contains: query, mode: "insensitive" } } },
              ],
            }
          : {},
      ],
    },
    include: {
      brand: true,
      primaryCanonicalCategory: true,
      currentVersion: {
        include: {
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
          },
          defaultVariant: {
            include: {
              benchmarkPrices: {
                orderBy: { verifiedAt: "desc" },
              },
            },
          },
        },
      },
    },
    orderBy: [{ canonicalName: "asc" }],
  });

  return {
    categories,
    products,
    selectedCategory,
    breadcrumbs: selectedCategory ? getCategoryPath(categories, selectedCategory.id) : [],
    query,
  };
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
