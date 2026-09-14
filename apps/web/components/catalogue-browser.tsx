import type { MyCollectionItem } from "@beauty-platform/domain/my-collection";
import Link from "next/link";

import type { CategoryRecord } from "../lib/catalogue";
import { Breadcrumbs } from "./breadcrumbs";
import { ProductCard } from "./product-card";

type CatalogueProduct = Parameters<typeof ProductCard>[0]["product"];

type CatalogueBrowserProps = {
  title: string;
  description: string;
  query: string;
  products: CatalogueProduct[];
  categories: CategoryRecord[];
  personalItems?: MyCollectionItem[];
  breadcrumbs?: CategoryRecord[];
  selectedCategorySlug?: string;
};

function categoryDepth(category: CategoryRecord, categories: readonly CategoryRecord[]) {
  const byId = new Map(categories.map((item) => [item.id, item]));
  let depth = 0;
  let current = category.parentCategoryId ? byId.get(category.parentCategoryId) : undefined;

  while (current) {
    depth += 1;
    current = current.parentCategoryId ? byId.get(current.parentCategoryId) : undefined;
  }

  return depth;
}

export function CatalogueBrowser({
  title,
  description,
  query,
  products,
  categories,
  personalItems = [],
  breadcrumbs = [],
  selectedCategorySlug,
}: CatalogueBrowserProps) {
  const categoryLinks = categories.filter(
    (category) => category.slug !== "skincare" && category.isActive,
  );
  const personalByVersion = new Map(
    personalItems.map((item) => [item.productVersionId, item]),
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-5 max-w-3xl">
        <p className="text-sm font-medium text-slate-500">Discover skincare</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-slate-600">{description}</p>
      </div>

      <form action="/catalogue" className="mt-8 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_15rem_auto]" method="get">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Search products
          <input
            className="min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-slate-500"
            defaultValue={query}
            name="q"
            placeholder="Product name or brand"
            type="search"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Category
          <select
            className="min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"
            defaultValue={selectedCategorySlug ?? ""}
            name="category"
          >
            <option value="">All skincare</option>
            {categoryLinks.map((category) => (
              <option key={category.id} value={category.slug}>
                {"— ".repeat(Math.max(0, categoryDepth(category, categories) - 1))}
                {category.displayName}
              </option>
            ))}
          </select>
        </label>
        <button className="self-end rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">
          Apply
        </button>
      </form>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Browse categories">
        {categoryLinks.map((category) => (
          <Link
            className={
              "shrink-0 rounded-full border px-3 py-1.5 text-sm " +
              (category.slug === selectedCategorySlug
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 text-slate-700 hover:border-slate-500")
            }
            href={"/categories/" + category.slug}
            key={category.id}
          >
            {category.displayName}
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-end justify-between gap-4 sm:mt-10">
        <h2 className="text-xl font-semibold">Products</h2>
        <p className="text-sm text-slate-500">
          {products.length} {products.length === 1 ? "result" : "results"}
        </p>
      </div>

      {products.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              personalState={
                product.currentVersion
                  ? personalByVersion.get(product.currentVersion.id) ?? null
                  : null
              }
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">
          <p>No catalogue products match this search and category.</p>
          <Link className="mt-4 inline-block text-sm font-medium text-slate-900 underline" href="/catalogue">
            Clear filters and browse all skincare
          </Link>
        </div>
      )}
    </main>
  );
}
