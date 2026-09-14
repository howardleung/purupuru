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

type SearchParams = Promise<{ q?: string; category?: string }>;

export default async function CataloguePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [catalogue, currentUser] = await Promise.all([
    getCatalogue({ query: params.q, categorySlug: params.category }),
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
      categories={catalogue.categories}
      description="Browse a curated, version-aware skincare catalogue with verified price context and source signals."
      personalItems={personalItems}
      products={catalogue.products}
      query={catalogue.query}
      selectedCategorySlug={catalogue.selectedCategory?.slug}
      title={catalogue.selectedCategory?.displayName ?? "Browse skincare"}
    />
  );
}