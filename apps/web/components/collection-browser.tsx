"use client";

import {
  filterCollectionItems,
  sortCollectionItems,
  type CollectionFilter,
  type CollectionSort,
  type MyCollectionItem,
} from "@beauty-platform/domain/my-collection";
import Link from "next/link";
import { useMemo, useState } from "react";

import { productSelectionHref } from "../lib/product-links";

const filters: { value: CollectionFilter; label: string }[] = [
  { value: "WANT", label: "Want" },
  { value: "TRIED", label: "Tried" },
  { value: "OWNED", label: "Owned" },
  { value: "HOLY_GRAIL", label: "Holy Grail" },
  { value: "WOULD_REPURCHASE", label: "Would Repurchase" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function ratingLabel(ratingHalfSteps: number | null) {
  return ratingHalfSteps === null ? "Not rated" : `${(ratingHalfSteps / 2).toFixed(1)} / 5`;
}

function stateLabels(item: MyCollectionItem) {
  return [
    item.wants ? "Want" : null,
    item.tried ? "Tried" : null,
    item.owned ? "Owned" : null,
    item.holyGrail ? "Holy Grail" : null,
    item.wouldRepurchase ? "Would Repurchase" : null,
  ].filter((value): value is string => Boolean(value));
}

export function CollectionBrowser({ items }: { items: MyCollectionItem[] }) {
  const [activeFilters, setActiveFilters] = useState<CollectionFilter[]>([]);
  const [sort, setSort] = useState<CollectionSort>("RECENT");

  const visibleItems = useMemo(
    () => sortCollectionItems(filterCollectionItems(items, activeFilters), sort),
    [activeFilters, items, sort],
  );

  function toggleFilter(filter: CollectionFilter) {
    setActiveFilters((current) =>
      current.includes(filter)
        ? current.filter((value) => value !== filter)
        : [...current, filter],
    );
  }

  return (
    <>
      <section className="mt-8 rounded-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate-700">Filter your collection</p>
            <div aria-label="Collection filters" className="mt-3 flex flex-wrap gap-2">
              <button
                aria-pressed={activeFilters.length === 0}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  activeFilters.length === 0
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                }`}
                onClick={() => setActiveFilters([])}
                type="button"
              >
                All
              </button>
              {filters.map((filter) => {
                const active = activeFilters.includes(filter.value);
                return (
                  <button
                    aria-pressed={active}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                    }`}
                    key={filter.value}
                    onClick={() => toggleFilter(filter.value)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            {activeFilters.length > 1 ? (
              <p className="mt-2 text-xs text-slate-500">Showing products that match every selected filter.</p>
            ) : null}
          </div>

          <label className="grid w-full gap-1 text-sm font-medium text-slate-700 sm:w-auto">
            Sort by
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal sm:w-auto"
              onChange={(event) => setSort(event.target.value as CollectionSort)}
              value={sort}
            >
              <option value="RECENT">Recently updated</option>
              <option value="RATING">Rating high to low</option>
              <option value="ALPHABETICAL">Brand/name alphabetical</option>
            </select>
          </label>
        </div>
      </section>

      <p aria-live="polite" className="mt-5 text-sm text-slate-600">
        {visibleItems.length} {visibleItems.length === 1 ? "product" : "products"}
      </p>

      {visibleItems.length > 0 ? (
        <section className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => {
            const labels = stateLabels(item);
            const href = productSelectionHref({
              productSlug: item.productSlug,
              versionKey: item.productVersionId,
              variantId: item.selectedVariantId,
            });

            return (
              <article className="flex flex-col rounded-xl border border-slate-200 p-4 sm:p-5" key={item.productVersionId}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {item.brandName}
                </p>
                <h2 className="mt-1 text-lg font-semibold leading-snug">
                  <Link className="hover:underline" href={href}>
                    {item.productName}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {item.versionName}
                  {item.selectedVariantLabel ? ` · ${item.selectedVariantLabel}` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">{item.categoryName}</p>

                {labels.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {labels.map((label) => (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700" key={label}>
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}

                <dl className="mt-5 grid gap-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Your rating</dt>
                    <dd className="font-medium text-slate-900">{ratingLabel(item.ratingHalfSteps)}</dd>
                  </div>
                  {item.owned ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Purchases</dt>
                      <dd className="text-right font-medium text-slate-900">
                        {item.purchaseCount} {item.purchaseCount === 1 ? "record" : "records"}
                        {item.ownedQuantity !== item.purchaseCount
                          ? ` · ${item.ownedQuantity} total units`
                          : ""}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {item.latestPurchase ? (
                  <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    <p className="font-medium text-slate-700">Latest purchase · {formatDate(item.latestPurchase.date)}</p>
                    <p className="mt-1">
                      {item.latestPurchase.variantLabel}
                      {item.latestPurchase.quantity > 1 ? ` · quantity ${item.latestPurchase.quantity}` : ""}
                      {item.latestPurchase.retailerName ? ` · ${item.latestPurchase.retailerName}` : ""}
                    </p>
                  </div>
                ) : null}

                <div className="mt-auto pt-5">
                  <Link className="text-sm font-medium underline decoration-slate-300 underline-offset-4" href={href}>
                    View product
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="mt-3 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <h2 className="font-semibold">No products match these filters</h2>
          <p className="mt-2 text-sm text-slate-600">Try removing one or more collection filters.</p>
          <button
            className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium"
            onClick={() => setActiveFilters([])}
            type="button"
          >
            Clear filters
          </button>
        </section>
      )}
    </>
  );
}
