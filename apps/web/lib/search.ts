import "server-only";

import { prisma } from "@beauty-platform/database";
import { selectPrimaryProductImage } from "@beauty-platform/domain/product-images";

import { getCategories, getCategoryPath } from "./catalogue";
import { productSelectionHref } from "./product-links";
import type { GroupedSearchResults } from "./search-contract";

export async function searchCatalogue(rawQuery: string): Promise<GroupedSearchResults> {
  const query = rawQuery.trim().slice(0, 80);
  if (query.length < 2) {
    return { products: [], brands: [], categories: [] };
  }

  const normalizedQuery = query.toLocaleLowerCase();
  const [aliasCandidates, brandCandidates, categories] = await Promise.all([
    prisma.productFamily.findMany({ select: { id: true, commonEnglishAliases: true } }),
    prisma.brand.findMany({ select: { id: true, name: true, slug: true, aliases: true } }),
    getCategories(),
  ]);
  const aliasProductIds = aliasCandidates
    .filter((product) => product.commonEnglishAliases.some((alias) => alias.toLocaleLowerCase().includes(normalizedQuery)))
    .map((product) => product.id);
  const brands = brandCandidates
    .filter((brand) => brand.name.toLocaleLowerCase().includes(normalizedQuery) || brand.aliases.some((alias) => alias.toLocaleLowerCase().includes(normalizedQuery)))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 4);
  const products = await prisma.productFamily.findMany({
      where: {
        OR: [
          { canonicalName: { contains: query, mode: "insensitive" } },
          { brand: { name: { contains: query, mode: "insensitive" } } },
          { id: { in: aliasProductIds } },
        ],
      },
      include: {
        brand: true,
        primaryCanonicalCategory: true,
        currentVersion: {
          include: {
            images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { id: "asc" }] },
            defaultVariant: true,
          },
        },
      },
      orderBy: [{ brand: { name: "asc" } }, { canonicalName: "asc" }],
      take: 5,
    });

  const matchingCategories = categories
    .filter((category) =>
      category.displayName.toLocaleLowerCase().includes(normalizedQuery),
    )
    .slice(0, 4);

  return {
    products: products.map((product) => {
      const version = product.currentVersion;
      const variantId = version?.defaultVariant?.id ?? null;
      const image = version
        ? selectPrimaryProductImage(version.images, version.id, variantId)
        : null;
      return {
        id: product.id,
        brandName: product.brand.name,
        productName: product.canonicalName,
        context: [product.primaryCanonicalCategory.displayName, version?.defaultVariant?.displaySize]
          .filter(Boolean)
          .join(" · "),
        href: version
          ? productSelectionHref({
              productSlug: product.slug,
              versionKey: version.versionCode ?? version.id,
              variantId: variantId ?? undefined,
            })
          : `/products/${encodeURIComponent(product.slug)}`,
        image,
      };
    }),
    brands: brands.map((brand) => ({
      id: brand.id,
      label: brand.name,
      context: "Brand",
      href: `/catalogue?brand=${encodeURIComponent(brand.slug)}`,
    })),
    categories: matchingCategories.map((category) => {
      const path = getCategoryPath(categories, category.id);
      return {
        id: category.id,
        label: category.displayName,
        context:
          path.length > 1 ? path.slice(0, -1).map((item) => item.displayName).join(" › ") : null,
        href: `/categories/${encodeURIComponent(category.slug)}`,
      };
    }),
  };
}
