"use client";

import { ArrowDownUp, Check, ChevronDown, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { CategoryRecord } from "../lib/catalogue";
import {
  catalogueSorts,
  type CatalogueFilters,
  type CatalogueProduct,
} from "../lib/catalogue-contract";
import {
  appendRepeatedValues,
  getCategorySelectionState,
  setCategorySelection,
} from "../lib/catalogue-filter-state";
import { Breadcrumbs } from "./breadcrumbs";
import { CategorySymbol, categoryTone } from "./category-symbol";
import { ProductCard } from "./product-card";

type Brand = { id: string; name: string; slug: string };

type CatalogueBrowserProps = {
  title: string;
  description: string;
  products: CatalogueProduct[];
  categories: CategoryRecord[];
  brands: Brand[];
  filters: CatalogueFilters;
  breadcrumbs?: CategoryRecord[];
};

function filterCount(filters: CatalogueFilters) {
  const basicCount = [filters.query, filters.categorySlugs.length > 0, filters.brandSlugs.length > 0, filters.minimumCad, filters.maximumCad, filters.trackedOnly]
    .filter((value) => value !== "" && value !== null && value !== false).length;
  return basicCount + Number(filters.capacityDimension !== null);
}

function CategoryCheckbox({
  category,
  categories,
  selectedSlugs,
  setSelectedSlugs,
}: {
  category: CategoryRecord;
  categories: readonly CategoryRecord[];
  selectedSlugs: readonly string[];
  setSelectedSlugs: (slugs: string[]) => void;
}) {
  const children = categories.filter((candidate) => candidate.parentCategoryId === category.id);
  const [expanded, setExpanded] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const selection = getCategorySelectionState(categories, selectedSlugs, category.id);

  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = selection.indeterminate;
  }, [selection.indeterminate]);

  return (
    <div>
      <div className="flex min-h-7 items-center gap-1">
        {children.length > 0 ? (
          <button
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${category.displayName}`}
            className="grid h-6 w-6 shrink-0 place-items-center rounded hover:bg-slate-100"
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            {expanded ? <ChevronDown aria-hidden className="h-3.5 w-3.5" /> : <ChevronRight aria-hidden className="h-3.5 w-3.5" />}
          </button>
        ) : <span className="h-6 w-6 shrink-0" />}
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-700">
          <input
            checked={selection.checked}
            className="h-4 w-4 rounded border-slate-300"
            onChange={(event) => setSelectedSlugs(setCategorySelection(selectedSlugs, selection.leafSlugs, event.target.checked))}
            ref={checkboxRef}
            type="checkbox"
          />
          <span className="truncate">{category.displayName}</span>
        </label>
      </div>
      {expanded && children.length > 0 ? (
        <div className="ml-3 border-l border-slate-200 pl-2">
          {children.map((child) => (
            <CategoryCheckbox
              categories={categories}
              category={child}
              key={child.id}
              selectedSlugs={selectedSlugs}
              setSelectedSlugs={setSelectedSlugs}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

const capacityLabels = {
  volume: "Volume (mL)",
  mass: "Mass (g)",
  count: "Count (items)",
} as const;

function CapacityFilter({ filters }: { filters: CatalogueFilters }) {
  const implicitDimension = filters.capacityRanges.length === 1
    ? filters.capacityRanges[0].dimension
    : null;
  const [dimension, setDimension] = useState(filters.capacityDimension ?? implicitDimension ?? "");
  const initialRange = filters.capacityRanges.find((range) => range.dimension === dimension) ?? null;
  const [minimum, setMinimum] = useState(filters.minimumCapacity ?? initialRange?.minimum ?? 0);
  const [maximum, setMaximum] = useState(filters.maximumCapacity ?? initialRange?.maximum ?? 0);
  const range = filters.capacityRanges.find((item) => item.dimension === dimension) ?? null;

  if (filters.capacityRanges.length === 0) return null;

  function selectDimension(nextDimension: string) {
    setDimension(nextDimension);
    const nextRange = filters.capacityRanges.find((item) => item.dimension === nextDimension);
    setMinimum(nextRange?.minimum ?? 0);
    setMaximum(nextRange?.maximum ?? 0);
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-700">Size / capacity</legend>
      {filters.capacityRanges.length > 1 ? (
        <label className="mt-2 grid gap-1 text-xs text-slate-500">
          Measurement
          <select className="ui-input font-normal" name="capacity" onChange={(event) => selectDimension(event.target.value)} value={dimension}>
            <option value="">Any size type</option>
            {filters.capacityRanges.map((item) => <option key={item.dimension} value={item.dimension}>{capacityLabels[item.dimension]}</option>)}
          </select>
        </label>
      ) : dimension ? <input name="capacity" type="hidden" value={dimension} /> : null}
      {range ? (
        <div className="mt-3 grid gap-3">
          {range.minimum < range.maximum ? (
            <div className="grid gap-2" aria-label={`${capacityLabels[range.dimension]} range`}>
              <label className="grid gap-1 text-xs text-slate-500">Minimum slider<input aria-label={`Minimum ${capacityLabels[range.dimension]}`} max={range.maximum} min={range.minimum} onChange={(event) => setMinimum(Math.min(Number(event.target.value), maximum))} step="1" type="range" value={minimum} /></label>
              <label className="grid gap-1 text-xs text-slate-500">Maximum slider<input aria-label={`Maximum ${capacityLabels[range.dimension]}`} max={range.maximum} min={range.minimum} onChange={(event) => setMaximum(Math.max(Number(event.target.value), minimum))} step="1" type="range" value={maximum} /></label>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs text-slate-500">Minimum {range.unit}<input className="ui-input" max={range.maximum} min={range.minimum} name="minCapacity" onChange={(event) => { if (event.target.value !== "") setMinimum(Number(event.target.value)); }} step="1" type="number" value={minimum} /></label>
            <label className="grid gap-1 text-xs text-slate-500">Maximum {range.unit}<input className="ui-input" max={range.maximum} min={range.minimum} name="maxCapacity" onChange={(event) => { if (event.target.value !== "") setMaximum(Number(event.target.value)); }} step="1" type="number" value={maximum} /></label>
          </div>
        </div>
      ) : <p className="mt-2 text-xs text-slate-500">Choose a size type to set a compatible range.</p>}
    </fieldset>
  );
}

export function CatalogueBrowser({
  title,
  description,
  products,
  categories,
  brands,
  filters,
  breadcrumbs = [],
}: CatalogueBrowserProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState(filters.categorySlugs);
  const [compareMessage, setCompareMessage] = useState("");
  const skincareRoot = categories.find((category) => category.slug === "skincare");
  const topCategories = categories.filter((category) => (
    category.isActive && (skincareRoot
      ? category.parentCategoryId === skincareRoot.id
      : category.parentCategoryId === null && category.slug !== "skincare")
  ));

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
    appendRepeatedValues(params, "category", filters.categorySlugs);
    appendRepeatedValues(params, "brand", filters.brandSlugs);
    if (filters.minimumCad !== null) params.set("minPrice", String(filters.minimumCad));
    if (filters.maximumCad !== null) params.set("maxPrice", String(filters.maximumCad));
    if (filters.capacityDimension) params.set("capacity", filters.capacityDimension);
    if (filters.minimumCapacity !== null) params.set("minCapacity", String(filters.minimumCapacity));
    if (filters.maximumCapacity !== null) params.set("maxCapacity", String(filters.maximumCapacity));
    if (filters.trackedOnly) params.set("tracked", "1");
    params.set("sort", sort);
    return `/catalogue?${params.toString()}`;
  }

  const filterPanel = (
    <form action="/catalogue" className="grid gap-5" method="get">
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        Search
        <input className="ui-input font-normal" defaultValue={filters.query} name="q" placeholder="Product or brand" type="search" />
      </label>
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Category</legend>
        {selectedCategorySlugs.map((slug) => <input key={slug} name="category" type="hidden" value={slug} />)}
        <div className="mt-2 grid gap-0.5">
          {topCategories.map((category) => (
            <CategoryCheckbox
              categories={categories}
              category={category}
              key={category.id}
              selectedSlugs={selectedCategorySlugs}
              setSelectedSlugs={setSelectedCategorySlugs}
            />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Brand</legend>
        <div className="mt-2 grid max-h-44 gap-2 overflow-y-auto pr-1">
          {brands.map((brand) => (
            <label className="flex items-center gap-2 text-sm text-slate-700" key={brand.id}>
              <input className="h-4 w-4 rounded border-slate-300" defaultChecked={filters.brandSlugs.includes(brand.slug)} name="brand" type="checkbox" value={brand.slug} />
              {brand.name}
            </label>
          ))}
        </div>
      </fieldset>
      <CapacityFilter filters={filters} />
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Canada price</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs text-slate-500">Minimum CAD<input className="ui-input" defaultValue={filters.minimumCad ?? ""} min="0" name="minPrice" step="0.01" type="number" /></label>
          <label className="grid gap-1 text-xs text-slate-500">Maximum CAD<input className="ui-input" defaultValue={filters.maximumCad ?? ""} min="0" name="maxPrice" step="0.01" type="number" /></label>
        </div>
      </fieldset>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input className="mt-0.5 h-4 w-4 rounded border-slate-300" defaultChecked={filters.trackedOnly} name="tracked" type="checkbox" value="1" />
        Only products with a tracked Canada price
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        Sort by
        <select className="ui-input font-normal" defaultValue={filters.sort} name="sort">
          {catalogueSorts.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
        </select>
      </label>
      <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
        Ingredient and skin-concern filters will appear only after reliable structured data exists.
      </div>
      <button className="ui-button ui-button--primary" type="submit">Apply filters</button>
      {filterCount(filters) > 0 ? <Link className="text-center text-sm font-medium underline" href="/catalogue">Clear all filters</Link> : null}
    </form>
  );

  return (
    <main className="page-container py-8 sm:py-10">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-5 max-w-3xl">
        <p className="eyebrow">Skincare to discover</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-3 text-slate-600">{description}</p>
      </div>

      <nav aria-label="Shop skincare" className="mt-6 flex flex-wrap gap-2 pb-1">
        <Link className="shrink-0 rounded-full bg-brand-ink px-4 py-2.5 text-sm font-bold text-white" href="/catalogue">Shop all</Link>
        <Link className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-brand-ink transition hover:border-slate-400" href="/categories">Shop by category</Link>
        <Link className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-brand-ink transition hover:border-slate-400" href="/brands">Shop by brand</Link>
      </nav>

      {topCategories.length > 0 ? (
        <section aria-labelledby="browse-categories-title" className="mt-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-extrabold text-brand-ink" id="browse-categories-title">Shop by category</h2>
            <Link className="text-xs font-bold text-brand-action underline underline-offset-4" href="/categories">View all</Link>
          </div>
          <div className="scrollbar-hidden mt-3 flex snap-x gap-3 overflow-x-auto pb-2">
            {topCategories.slice(0, 8).map((category) => (
              <Link
                className="category-tile min-w-28 shrink-0 snap-start px-3 py-4 sm:min-w-32"
                data-tone={categoryTone(category.slug)}
                href={`/categories/${category.slug}`}
                key={category.id}
              >
                <CategorySymbol className="h-7 w-7 text-brand-action" slug={category.slug} />
                <span className="text-xs font-bold">{category.displayName}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <details className="mt-6 surface-card p-4 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
          <span className="flex items-center gap-2"><SlidersHorizontal aria-hidden className="h-4 w-4" /> Filters</span>
          {filterCount(filters) > 0 ? <span className="rounded-full bg-slate-950 px-2 py-0.5 text-xs text-white">{filterCount(filters)}</span> : null}
        </summary>
        <div className="mt-5 border-t border-slate-100 pt-5">{filterPanel}</div>
      </details>

      <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="surface-card hidden self-start p-5 lg:block lg:sticky lg:top-4" aria-label="Catalogue filters">
          <h2 className="mb-5 flex items-center gap-2 font-semibold"><SlidersHorizontal aria-hidden className="h-4 w-4" /> Filters</h2>
          {filterPanel}
        </aside>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-brand-ink">Products</h2>
              <p aria-live="polite" className="mt-1 text-sm text-slate-500">{products.length} {products.length === 1 ? "product" : "products"}{filterCount(filters) > 0 ? ` · ${filterCount(filters)} active filters` : ""}</p>
            </div>
            <label className="flex items-center gap-2 text-sm"><ArrowDownUp aria-hidden className="h-4 w-4 text-slate-500" /><span className="sr-only sm:not-sr-only">Sort</span><select aria-label="Sort catalogue" className="ui-input min-w-44" onChange={(event) => router.push(sortHref(event.target.value))} value={filters.sort}>{catalogueSorts.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}</select></label>
          </div>

          {products.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                return (
                  <div className="relative min-w-0" key={product.productFamilyId}>
                    <ProductCard product={product} />
                    <label className="absolute right-2.5 top-2.5 flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-2.5 text-[0.7rem] font-bold text-slate-700 shadow-sm backdrop-blur-sm focus-within:ring-2 focus-within:ring-brand-action">
                      <input
                        aria-label={`Compare ${product.brand.name} ${product.canonicalName} ${product.currentVersion?.variant.displaySize ?? ""}`}
                        checked={selectedIds.includes(product.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300"
                        onChange={() => toggleComparison(product.id)}
                        type="checkbox"
                      />
                      Compare
                    </label>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state mt-5"><p className="font-bold text-brand-ink">No products match these filters</p><p className="mt-2 text-sm">Try widening your price or size range, or clear the filters to keep browsing.</p><Link className="ui-link mt-4" href="/catalogue">Clear filters and browse all skincare</Link></div>
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
