"use client";

import { filterCollectionItems, sortCollectionItems, type CollectionFilter, type CollectionSort, type MyCollectionItem } from "@beauty-platform/domain/my-collection";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { productSelectionHref } from "../lib/product-links";
import { trapTabKey } from "../lib/modal-focus";
import { CollectionActions } from "./collection-actions";
import { ProductImage } from "./product-image";

const filters: { value: CollectionFilter; label: string }[] = [
  { value: "WANT", label: "Want" },
  { value: "TRIED", label: "Tried" },
  { value: "OWNED", label: "Owned" },
  { value: "HOLY_GRAIL", label: "Holy Grail" },
  { value: "WOULD_REPURCHASE", label: "Would Repurchase" },
];

function stateLabels(item: MyCollectionItem) {
  return [item.wants ? "Want" : null, item.owned ? "Owned" : null, item.holyGrail ? "Holy Grail" : null]
    .filter((value): value is string => Boolean(value));
}

export function CollectionBrowser({ items }: { items: MyCollectionItem[] }) {
  const [activeFilters, setActiveFilters] = useState<CollectionFilter[]>([]);
  const [sort, setSort] = useState<CollectionSort>("RECENT");
  const [selected, setSelected] = useState<MyCollectionItem | null>(null);
  const quickViewTriggerRef = useRef<HTMLButtonElement>(null);
  const visibleItems = useMemo(() => sortCollectionItems(filterCollectionItems(items, activeFilters), sort), [activeFilters, items, sort]);

  function toggleFilter(filter: CollectionFilter) {
    setActiveFilters((current) => current.includes(filter) ? current.filter((value) => value !== filter) : [...current, filter]);
  }

  function closeQuickView() {
    setSelected(null);
    window.requestAnimationFrame(() => quickViewTriggerRef.current?.focus());
  }

  return (
    <>
      <section className="mt-8 border-y border-slate-200 py-4">
        <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-end">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700">Your shelf</p>
            <div aria-label="Collection filters" className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <FilterButton active={activeFilters.length === 0} label="All" onClick={() => setActiveFilters([])} />
              {filters.map((filter) => <FilterButton active={activeFilters.includes(filter.value)} key={filter.value} label={filter.label} onClick={() => toggleFilter(filter.value)} />)}
            </div>
            {activeFilters.length > 1 ? <p className="mt-2 text-xs text-slate-500">Products must match every selected filter.</p> : null}
          </div>
          <label className="grid gap-1 text-sm font-medium text-slate-700">Sort by<select className="ui-input font-normal" onChange={(event) => setSort(event.target.value as CollectionSort)} value={sort}><option value="RECENT">Recently updated</option><option value="RATING">Rating high to low</option><option value="ALPHABETICAL">Brand/name alphabetical</option></select></label>
        </div>
      </section>

      <p aria-live="polite" className="mt-5 text-sm text-slate-600">{visibleItems.length} {visibleItems.length === 1 ? "product" : "products"}</p>
      {visibleItems.length > 0 ? (
        <section className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleItems.map((item) => {
            const labels = stateLabels(item);
            return (
              <button className="surface-card group min-w-0 overflow-hidden text-left transition hover:border-slate-400 hover:shadow-float" key={item.productVersionId} onClick={(event) => { quickViewTriggerRef.current = event.currentTarget; setSelected(item); }} type="button">
                <ProductImage className="aspect-square h-auto rounded-none" image={item.image ?? null} productName={`${item.brandName} ${item.productName}`} sizes="(max-width: 640px) 45vw, 25vw" />
                <span className="block p-3 sm:p-4">
                  <span className="block truncate text-[0.68rem] font-medium uppercase tracking-wide text-slate-500">{item.brandName}</span>
                  <span className="mt-1 block text-sm font-semibold leading-snug sm:text-base">{item.productName}</span>
                  <span className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{item.ratingHalfSteps === null ? "Not rated" : `★ ${(item.ratingHalfSteps / 2).toFixed(1)}`}</span>
                    {labels[0] ? <span className="ui-chip truncate">{labels[0]}</span> : null}
                  </span>
                </span>
              </button>
            );
          })}
        </section>
      ) : (
        <section className="mt-3 rounded-xl border border-dashed border-slate-300 p-8 text-center"><h2 className="font-semibold">No products match these filters</h2><p className="mt-2 text-sm text-slate-600">Try removing one or more collection filters.</p><button className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium" onClick={() => setActiveFilters([])} type="button">Clear filters</button></section>
      )}
      {selected ? <CollectionQuickView item={selected} onClose={closeQuickView} /> : null}
    </>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button aria-pressed={active} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${active ? "border-brand-action bg-brand-action text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"}`} onClick={onClick} type="button">{label}</button>;
}

function CollectionQuickView({ item, onClose }: { item: MyCollectionItem; onClose: () => void }) {
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const href = productSelectionHref({ productSlug: item.productSlug, versionKey: item.productVersionId, variantId: item.selectedVariantId });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") onClose(); trapTabKey(event, dialogRef.current); }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; };
  }, [onClose]);

  function closeAndRefresh() {
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-slate-950/45 sm:place-items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAndRefresh(); }}>
      <section aria-labelledby="collection-quick-view-title" aria-modal="true" className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-float sm:max-w-3xl sm:rounded-2xl sm:p-6" ref={dialogRef} role="dialog" tabIndex={-1}>
        <div className="flex justify-end"><button aria-label="Close collection quick view" className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100" onClick={closeAndRefresh} ref={closeRef} type="button"><X aria-hidden className="h-5 w-5" /></button></div>
        <div className="grid gap-6 sm:grid-cols-[15rem_1fr]">
          <ProductImage className="aspect-square h-auto" image={item.image ?? null} productName={`${item.brandName} ${item.productName}`} sizes="240px" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.brandName}</p>
            <h2 className="mt-1 text-2xl font-semibold" id="collection-quick-view-title">{item.productName}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {item.showVersionName ? item.versionName : null}
              {item.showVersionName && item.selectedVariantLabel ? " · " : null}
              {item.selectedVariantLabel}
            </p>
            {item.owned ? <p className="mt-3 text-sm text-slate-600">{item.purchaseCount} purchase {item.purchaseCount === 1 ? "record" : "records"} · {item.ownedQuantity} acquired</p> : null}
            {item.selectedVariantId ? (
              <div className="mt-6"><CollectionActions initialState={{ wants: item.wants, tried: item.tried, purchaseCount: item.purchaseCount, holyGrail: item.holyGrail, wouldRepurchase: item.wouldRepurchase, ratingHalfSteps: item.ratingHalfSteps }} productSlug={item.productSlug} productVariantId={item.selectedVariantId} productVersionId={item.productVersionId} variantLabel={item.selectedVariantLabel ?? "selected size"} /></div>
            ) : <p className="mt-6 text-sm text-slate-500">Personal actions need an exact recorded size.</p>}
            <Link className="ui-button ui-button--primary mt-6" href={href}>View full product</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
