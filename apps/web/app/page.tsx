import type { Metadata } from "next";

import { CatalogueBrowser } from "../components/catalogue-browser";
import { getCatalogue } from "../lib/catalogue";
import { isClerkConfigured } from "../lib/clerk-config";
import { getCurrentUser } from "../lib/current-user";
import { getMyCollectionForUser } from "../lib/my-collection";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skincare catalogue",
};

type SearchParams = Promise<{ q?: string; category?: string }>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
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
      description="Browse a small, version-aware skincare catalogue with verified prices and source signals."
      personalItems={personalItems}
      products={catalogue.products}
      query={catalogue.query}
      selectedCategorySlug={catalogue.selectedCategory?.slug}
      title={catalogue.selectedCategory?.displayName ?? "Skincare catalogue"}
    />
  );
}
