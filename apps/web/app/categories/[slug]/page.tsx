import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogueBrowser } from "../../../components/catalogue-browser";
import { getCatalogue } from "../../../lib/catalogue";
import { isClerkConfigured } from "../../../lib/clerk-config";
import { getCurrentUser } from "../../../lib/current-user";
import { getMyCollectionForUser } from "../../../lib/my-collection";
import { boundedParameter, priceParameter } from "../../../lib/input-validation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; brand?: string; minPrice?: string; maxPrice?: string; tracked?: string; sort?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalogue = await getCatalogue({ categorySlug: slug });
  const title = catalogue.selectedCategory?.displayName ?? "Category";
  const description = catalogue.selectedCategory
    ? `Browse version-aware ${catalogue.selectedCategory.displayName.toLowerCase()} products and trusted price context on PuruPuru.`
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
  const [catalogue, currentUser] = await Promise.all([
    getCatalogue({
      categorySlug: slug,
      query: boundedParameter(queryParams.q, 80),
      brandSlug: boundedParameter(queryParams.brand, 200),
      minimumCad: priceParameter(queryParams.minPrice),
      maximumCad: priceParameter(queryParams.maxPrice),
      trackedOnly: queryParams.tracked === "1",
      sort: boundedParameter(queryParams.sort, 32),
    }),
    isClerkConfigured ? getCurrentUser() : Promise.resolve(null),
  ]);

  if (!catalogue.selectedCategory) notFound();

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
      description={`Products classified under the canonical ${catalogue.selectedCategory.displayName} category.`}
      personalItems={personalItems}
      products={catalogue.products}
      filters={catalogue.filters}
      title={catalogue.selectedCategory.displayName}
    />
  );
}
