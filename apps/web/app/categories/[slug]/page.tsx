import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogueBrowser } from "../../../components/catalogue-browser";
import { getCatalogue } from "../../../lib/catalogue";
import { boundedParameter, boundedParameters, priceParameter } from "../../../lib/input-validation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; brand?: string | string[]; minPrice?: string; maxPrice?: string; capacity?: string; minCapacity?: string; maxCapacity?: string; tracked?: string; sort?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalogue = await getCatalogue({ categorySlug: slug });
  const title = catalogue.selectedCategory?.displayName ?? "Category";
  const description = catalogue.selectedCategory
    ? `Browse ${catalogue.selectedCategory.displayName.toLowerCase()} products by exact size and compare tracked retailer prices on PuruPuru.`
    : "Browse PuruPuru’s canonical skincare categories.";

  return {
    title,
    description,
    openGraph: {
    title: `${title} skincare · PuruPuru`,
    description,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, queryParams] = await Promise.all([params, searchParams]);
  const catalogue = await getCatalogue({
    categorySlug: slug,
    query: boundedParameter(queryParams.q, 80),
    brandSlugs: boundedParameters(queryParams.brand, 200),
    minimumCad: priceParameter(queryParams.minPrice),
    maximumCad: priceParameter(queryParams.maxPrice),
    capacityDimension: boundedParameter(queryParams.capacity, 16),
    minimumCapacity: priceParameter(queryParams.minCapacity),
    maximumCapacity: priceParameter(queryParams.maxCapacity),
    trackedOnly: queryParams.tracked === "1",
    sort: boundedParameter(queryParams.sort, 32),
  });

  if (!catalogue.selectedCategory) notFound();

  return (
    <CatalogueBrowser
      key={`${catalogue.filters.categorySlugs.join(",")}|${catalogue.filters.brandSlugs.join(",")}`}
      breadcrumbs={catalogue.breadcrumbs}
      brands={catalogue.brands}
      categories={catalogue.categories}
      description={`Explore ${catalogue.selectedCategory.displayName.toLowerCase()}, discover available sizes, and compare tracked Canadian retailer prices.`}
      products={catalogue.products}
      filters={catalogue.filters}
      title={catalogue.selectedCategory.displayName}
    />
  );
}
