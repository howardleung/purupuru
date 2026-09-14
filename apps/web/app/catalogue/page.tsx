import type { Metadata } from "next";

import { CatalogueBrowser } from "../../components/catalogue-browser";
import { getCatalogue } from "../../lib/catalogue";
import { isClerkConfigured } from "../../lib/clerk-config";
import { getCurrentUser } from "../../lib/current-user";
import { getMyCollectionForUser } from "../../lib/my-collection";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse skincare",
  description: "Search Otoku’s version-aware skincare catalogue by product, brand, or canonical category.",
  openGraph: {
    title: "Browse skincare · Otoku",
    description: "Search version-aware skincare products and compare trusted market pricing.",
  },
};

type SearchParams = Promise<{
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  tracked?: string;
  sort?: string;
}>;

export default async function CataloguePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [catalogue, currentUser] = await Promise.all([
    getCatalogue({
      query: params.q,
      categorySlug: params.category,
      brandSlug: params.brand,
      minimumCad: params.minPrice?.trim() ? Number(params.minPrice) : undefined,
      maximumCad: params.maxPrice?.trim() ? Number(params.maxPrice) : undefined,
      trackedOnly: params.tracked === "1",
      sort: params.sort,
    }),
    isClerkConfigured ? getCurrentUser() : Promise.resolve(null),
  ]);
  const personalItems = currentUser
    ? await getMyCollectionForUser(currentUser.id, {
        productVersionIds: catalogue.products.flatMap((product) =>
          product.currentVersion ? [product.currentVersion.id] : [],
        ),
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
