"use client";

import type { MyCollectionItem } from "@beauty-platform/domain/my-collection";
import { ArrowDownUp, Check, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CategoryRecord } from "../lib/catalogue";
import { catalogueSorts, type CatalogueFilters, type CatalogueProduct } from "../lib/catalogue-contract";
import { Breadcrumbs } from "./breadcrumbs";
import { catalogueProductHref, formatCataloguePrice } from "./product-card";
import { ProductImage } from "./product-image";

type Brand = { id: string; name: string; slug: string };

type CatalogueBrowserProps = {
  title: string;
  description: string;
  products: CatalogueProduct[];
  categories: CategoryRecord[];
  brands: Brand[];
  filters: CatalogueFilters;
  personalItems?: MyCollectionItem[];
  breadcrumbs?: CategoryRecord[];
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

function filterCount(filters: CatalogueFilters) {
  return [filters.query, filters.categorySlug, filters.brandSlug, filters.minimumCad, filters.maximumCad, filters.trackedOnly]
    .filter((value) => value !== "" && value !== null && value !== false).length;
}

export function CatalogueBrowser({
  title,
  description,
  products,
  categories,
  brands,
  filters,
  personalItems = [],
  breadcrumbs = [],
}: CatalogueBrowserProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareMessage, setCompareMessage] = useState("");
  const personalByVersion = new Map(personalItems.map((item) => [item.productVersionId, item]));
  const categoryLinks = categories.filter((category) => category.slug !== "skincare" && category.isActive);

  function toggleComparison(productId: string) {
    setCompareMessage("");
    setSelectedIds((current) => {
      if (current.includes(productId)) return current.filter((id) => id !== productId);
      if (current.length >= 4) {
        setCompareMessage("Compare up to four products at a time.");
        return current;
      }
      return [...current, productId];
    });
  }

  function sortHref(sort: string) {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.categorySlug) params.set("category", filters.categorySlug);
    if (filters.brandSlug) params.set("brand", filters.brandSlug);
    if (filters.minimumCad !== null) params.set("minPrice", String(filters.minimumCad));
    if (filters.maximumCad !== null) params.set("maxPrice", String(filters.maximumCad));
    if (filters.trackedOnly) params.set("tracked", "1");
    params.set("sort", sort);
    return `/catalogue?${params.toString()}`;
  }

  const filterPanel = (
    <form action="/catalogue" className="grid gap-5" method="get">
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        Search
        <input className="rounded-lg border border-slate-300 px-3 py-2 font-normal" defaultValue={filters.query} name="q" placeholder="Product or brand" type="search" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        Category
        <select className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" defaultValue={filters.categorySlug} name="category">
          <option value="">All skincare</option>
          {categoryLinks.map((category) => (
            <option key={category.id} value={category.slug}>
              {"— ".repeat(Math.max(0, categoryDepth(category, categories) - 1))}{category.displayName}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        Brand
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" defaultValue={filters.brandSlug} name="brand">
          <option value="">All brands</option>
          {brands.map((brand) => <option key={brand.id} value={brand.slug}>{brand.name}</option>)}
        </select>
      </label>
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Canada price</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs text-slate-500">Minimum CAD<input className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" defaultValue={filters.minimumCad ?? ""} min="0" name="minPrice" step="0.01" type="number" /></label>
          <label className="grid gap-1 text-xs text-slate-500">Maximum CAD<input className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" defaultValue={filters.maximumCad ?? ""} min="0" name="maxPrice" step="0.01" type="number" /></label>
        </div>
      </fieldset>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input className="mt-0.5 h-4 w-4 rounded border-slate-300" defaultChecked={filters.trackedOnly} name="tracked" type="checkbox" value="1" />
        Only products with a tracked Canada price
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        Sort by
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" defaultValue={filters.sort} name="sort">
          {catalogueSorts.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
        </select>
      </label>
      <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
        Public ratings and ingredient filters will appear after verified, normalized source data exists.
      </div>
      <button className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" type="submit">Apply filters</button>
      {filterCount(filters) > 0 ? <Link className="text-center text-sm font-medium underline" href="/catalogue">Clear all filters</Link> : null}
    </form>
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-5 max-w-3xl">
        <p className="text-sm font-medium text-slate-500">Research skincare</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-slate-600">{description}</p>
      </div>

      <details className="mt-6 rounded-xl border border-slate-200 p-4 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
          <span className="flex items-center gap-2"><SlidersHorizontal aria-hidden className="h-4 w-4" /> Filters</span>
          {filterCount(filters) > 0 ? <span className="rounded-full bg-slate-950 px-2 py-0.5 text-xs text-white">{filterCount(filters)}</span> : null}
        </summary>
        <div className="mt-5 border-t border-slate-100 pt-5">{filterPanel}</div>
      </details>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-xl border border-slate-200 p-5 lg:block lg:sticky lg:top-4" aria-label="Catalogue filters">
          <h2 className="mb-5 flex items-center gap-2 font-semibold"><SlidersHorizontal aria-hidden className="h-4 w-4" /> Filters</h2>
          {filterPanel}
        </aside>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Products</h2>
              <p aria-live="polite" className="mt-1 text-sm text-slate-500">{products.length} {products.length === 1 ? "result" : "results"}{filterCount(filters) > 0 ? ` · ${filterCount(filters)} active filters` : ""}</p>
            </div>
            <label className="flex items-center gap-2 text-sm lg:hidden"><ArrowDownUp aria-hidden className="h-4 w-4" /><select className="rounded-lg border border-slate-300 bg-white px-3 py-2" onChange={(event) => router.push(sortHref(event.target.value))} value={filters.sort}>{catalogueSorts.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}</select></label>
          </div>

          {products.length > 0 ? (
            <>
              <div className="mt-4 hidden overflow-hidden rounded-xl border border-slate-200 lg:block">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="w-12 px-3 py-3"><span className="sr-only">Compare</span></th>
                      <th className="w-20 px-3 py-3">Image</th>
                      <SortableHeader href={sortHref(filters.sort === "PRODUCT_ASC" ? "PRODUCT_DESC" : "PRODUCT_ASC")} label="Product" />
                      <SortableHeader href={sortHref(filters.sort === "BRAND_ASC" ? "BRAND_DESC" : "BRAND_ASC")} label="Brand" />
                      <th className="px-3 py-3 font-medium">Category</th>
                      <th className="w-24 px-3 py-3 font-medium">Rating</th>
                      <SortableHeader className="w-40" href={sortHref(filters.sort === "PRICE_ASC" ? "PRICE_DESC" : "PRICE_ASC")} label="Lowest tracked price" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {products.map((product) => {
                      const href = catalogueProductHref(product);
                      const checked = selectedIds.includes(product.id);
                      const personal = product.currentVersion ? personalByVersion.get(product.currentVersion.id) : null;
                      return (
                        <tr
                          aria-label={`View ${product.brand.name} ${product.canonicalName}`}
                          className="cursor-pointer transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500"
                          key={product.id}
                          onClick={(event) => { if (!(event.target as HTMLElement).closest("a,button,input,label")) router.push(href); }}
                          onKeyDown={(event) => { if (event.key === "Enter") router.push(href); }}
                          tabIndex={0}
                        >
                          <td className="px-3 py-4 align-middle"><input aria-label={`Compare ${product.brand.name} ${product.canonicalName}`} checked={checked} className="h-4 w-4" onChange={() => toggleComparison(product.id)} type="checkbox" /></td>
                          <td className="px-3 py-3"><Link href={href}><ProductImage className="h-14 min-h-14 rounded-lg" image={product.currentVersion?.image ?? null} productName={product.canonicalName} sizes="56px" /></Link></td>
                          <td className="px-3 py-4"><Link className="font-semibold hover:underline" href={href}>{product.canonicalName}</Link><span className="mt-1 block text-xs text-slate-500">{product.currentVersion?.defaultVariant?.displaySize ?? "Size not recorded"}</span></td>
                          <td className="px-3 py-4 text-slate-700">{product.brand.name}</td>
                          <td className="px-3 py-4 text-slate-700">{product.primaryCanonicalCategory.displayName}</td>
                          <td className="px-3 py-4 text-slate-500" title="A normalized public rating source is not yet defined">{personal?.ratingHalfSteps ? <span title="Your private rating">Your {(personal.ratingHalfSteps / 2).toFixed(1)}</span> : "—"}</td>
                          <td className="px-3 py-4 font-semibold">{formatCataloguePrice(product) ?? <span className="font-normal text-slate-500">Not tracked</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid gap-3 lg:hidden">
                {products.map((product) => {
                  const href = catalogueProductHref(product);
                  return (
                    <article className="grid grid-cols-[5.5rem_1fr] gap-4 rounded-xl border border-slate-200 p-3" key={product.id}>
                      <Link href={href}><ProductImage className="h-24" image={product.currentVersion?.image ?? null} productName={product.canonicalName} sizes="88px" /></Link>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{product.brand.name}</p><label className="flex items-center gap-1.5 text-xs text-slate-600"><input checked={selectedIds.includes(product.id)} className="h-4 w-4" onChange={() => toggleComparison(product.id)} type="checkbox" /> Compare</label></div>
                        <h3 className="mt-1 font-semibold"><Link href={href}>{product.canonicalName}</Link></h3>
                        <p className="mt-1 text-xs text-slate-500">{product.primaryCanonicalCategory.displayName} · {product.currentVersion?.defaultVariant?.displaySize ?? "Size not recorded"}</p>
                        <p className="mt-3 text-sm font-semibold">{formatCataloguePrice(product) ?? "No Canada price tracked"}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600"><p>No catalogue products match these filters.</p><Link className="mt-4 inline-block text-sm font-medium text-slate-900 underline" href="/catalogue">Clear filters and browse all skincare</Link></div>
          )}
        </section>
      </div>

      {selectedIds.length > 0 ? (
        <aside className="fixed bottom-4 left-1/2 z-40 flex w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl bg-slate-950 p-3 text-white shadow-2xl" aria-label="Product comparison">
          <div className="min-w-0"><p className="font-semibold">{selectedIds.length} selected to compare</p><p aria-live="polite" className="truncate text-xs text-slate-300">{compareMessage || "Select up to four products."}</p></div>
          <div className="flex shrink-0 gap-2"><button aria-label="Clear comparison" className="grid h-10 w-10 place-items-center rounded-full border border-slate-700" onClick={() => setSelectedIds([])} type="button"><X aria-hidden className="h-4 w-4" /></button><Link className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${selectedIds.length >= 2 ? "bg-white text-slate-950" : "pointer-events-none bg-slate-800 text-slate-500"}`} href={`/compare?products=${selectedIds.join(",")}`}><Check aria-hidden className="h-4 w-4" /> Compare</Link></div>
        </aside>
      ) : null}
    </main>
  );
}

function SortableHeader({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  return <th className={`px-3 py-3 font-medium ${className}`}><Link className="inline-flex items-center gap-1 hover:text-slate-950" href={href}>{label}<ArrowDownUp aria-hidden className="h-3 w-3" /></Link></th>;
}
