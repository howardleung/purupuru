import type { Metadata } from "next";

import { CatalogueBrowser } from "../../components/catalogue-browser";
import { getCatalogue } from "../../lib/catalogue";
import { isClerkConfigured } from "../../lib/clerk-config";
import { getCurrentUser } from "../../lib/current-user";
import { getMyCollectionForUser } from "../../lib/my-collection";
import { boundedParameter, priceParameter } from "../../lib/input-validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skincare Catalogue",
  description: "Search PuruPuru’s version-aware skincare catalogue by product, brand, or canonical category.",
  openGraph: {
    title: "Browse skincare · PuruPuru",
    description: "Search version-aware skincare products and compare trusted market pricing.",
  },
};

type SearchParams = Promise<{
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  capacity?: string;
  minCapacity?: string;
  maxCapacity?: string;
  tracked?: string;
  sort?: string;
}>;

export default async function CataloguePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [catalogue, currentUser] = await Promise.all([
    getCatalogue({
      query: boundedParameter(params.q, 80),
      categorySlug: boundedParameter(params.category, 200),
      brandSlug: boundedParameter(params.brand, 200),
      minimumCad: priceParameter(params.minPrice),
      maximumCad: priceParameter(params.maxPrice),
      capacityDimension: boundedParameter(params.capacity, 16),
      minimumCapacity: priceParameter(params.minCapacity),
      maximumCapacity: priceParameter(params.maxCapacity),
      trackedOnly: params.tracked === "1",
      sort: boundedParameter(params.sort, 32),
    }),
    isClerkConfigured ? getCurrentUser() : Promise.resolve(null),
  ]);
  const personalItems = currentUser
      ? await getMyCollectionForUser(currentUser.id, {
        productVersionIds: [...new Set(catalogue.products.flatMap((product) =>
          product.currentVersion ? [product.currentVersion.id] : [],
        ))],
      })
    : [];

  return (
    <CatalogueBrowser
      breadcrumbs={catalogue.breadcrumbs}
      brands={catalogue.brands}
      categories={catalogue.categories}
      description="Browse a curated, version-aware skincare catalogue with verified price context and source signals."
      personalItems={personalItems}
      products={catalogue.products}
      filters={catalogue.filters}
      title={catalogue.selectedCategory?.displayName ?? "Browse skincare"}
    />
  );
}
