import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogueBrowser } from "../../../components/catalogue-browser";
import { getCatalogue } from "../../../lib/catalogue";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalogue = await getCatalogue({ categorySlug: slug });
  return { title: catalogue.selectedCategory?.displayName ?? "Category" };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, queryParams] = await Promise.all([params, searchParams]);
  const catalogue = await getCatalogue({ categorySlug: slug, query: queryParams.q });

  if (!catalogue.selectedCategory) notFound();

  return (
    <CatalogueBrowser
      breadcrumbs={catalogue.breadcrumbs}
      categories={catalogue.categories}
      description={`Products classified under the canonical ${catalogue.selectedCategory.displayName} category.`}
      products={catalogue.products}
      query={catalogue.query}
      selectedCategorySlug={catalogue.selectedCategory.slug}
      title={catalogue.selectedCategory.displayName}
    />
  );
}
