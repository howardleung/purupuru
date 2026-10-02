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
  description: "Browse skincare by product, brand, or category and compare the best retailer prices PuruPuru currently tracks.",
  openGraph: {
    title: "Browse skincare · PuruPuru",
    description: "Find the exact skincare size you want and compare available retailer prices.",
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
      description="Find the product and size you want, then compare the retailer prices PuruPuru currently tracks."
      personalItems={personalItems}
      products={catalogue.products}
      filters={catalogue.filters}
      title={catalogue.selectedCategory?.displayName ?? "Browse skincare"}
    />
  );
}
