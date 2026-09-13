import type { Metadata } from "next";

import { CatalogueBrowser } from "../components/catalogue-browser";
import { getCatalogue } from "../lib/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skincare catalogue",
};

type SearchParams = Promise<{ q?: string; category?: string }>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const catalogue = await getCatalogue({
    query: params.q,
    categorySlug: params.category,
  });

  return (
    <CatalogueBrowser
      breadcrumbs={catalogue.breadcrumbs}
      categories={catalogue.categories}
      description="Browse a small, version-aware skincare catalogue with verified prices and source signals."
      products={catalogue.products}
      query={catalogue.query}
      selectedCategorySlug={catalogue.selectedCategory?.slug}
      title={catalogue.selectedCategory?.displayName ?? "Skincare catalogue"}
    />
  );
}
