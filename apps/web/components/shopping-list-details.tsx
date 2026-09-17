"use client";

import {
  calculateShoppingListEstimate,
  parseRequestedQuantity,
} from "@beauty-platform/domain/shopping-list";
import { ChevronDown, Minus, Plus, Store, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";

import {
  markShoppingListItemPurchased,
  removeShoppingListItem,
  updateShoppingListItemQuantity,
} from "../app/shopping-lists/actions";
import { marketName } from "../lib/markets";
import { safeExternalUrl } from "../lib/external-url";
import { productSelectionHref } from "../lib/product-links";
import type {
  PreparedShoppingList,
  PreparedShoppingListItem,
  PreparedShoppingListOffer,
} from "../lib/shopping-lists";
import { ProductImage } from "./product-image";

const exclusionLabels: Record<string, string> = {
  NO_VERIFIED_BENCHMARK: "no verified target-market benchmark is available",
  NO_LOCAL_OFFER: "no eligible Canadian retailer offer is currently tracked",
  CAD_CONVERSION_UNAVAILABLE: "a required CAD conversion is unavailable",
};

const benchmarkLabels: Record<string, string> = {
  MSRP: "MSRP",
  RETAIL_PRICE: "Retail Price",
  REFERENCE_PRICE: "Reference Price",
};

function nativeMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: currency === "CAD" ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function cad(value: number) {
  const sign = value < 0 ? "−" : "";
  return `${sign}CA$${Math.abs(value).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function selectedOffer(
  offers: PreparedShoppingListOffer[],
  ids: Record<string, string>,
  itemId: string,
) {
  return offers.find((offer) => offer.id === ids[itemId]) ?? offers[0] ?? null;
}

function benchmarkNativeTotals(items: PreparedShoppingListItem[]) {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (!item.benchmark) continue;
    totals.set(
      item.benchmark.nativeCurrency,
      (totals.get(item.benchmark.nativeCurrency) ?? 0) + item.benchmark.nativeAmount * item.quantity,
    );
  }
  return [...totals.entries()]
    .map(([currency, total]) => `${nativeMoney(total, currency)} ${currency}`)
    .join(" · ");
}

function localNativeTotals(
  items: PreparedShoppingListItem[],
  selectedLocalOfferIds: Record<string, string>,
) {
  const totals = new Map<string, number>();
  for (const item of items) {
    const offer = selectedOffer(item.localOffers, selectedLocalOfferIds, item.id);
    if (!offer) continue;
    totals.set(offer.nativeCurrency, (totals.get(offer.nativeCurrency) ?? 0) + offer.nativeAmount * item.quantity);
  }
  return [...totals.entries()]
    .map(([currency, total]) => `${nativeMoney(total, currency)} ${currency}`)
    .join(" · ");
}

export function ShoppingListDetails({ list }: { list: PreparedShoppingList }) {
  const [items, setItems] = useState(list.items);
  const [selectedLocalOfferIds, setSelectedLocalOfferIds] = useState<Record<string, string>>(
    Object.fromEntries(list.items.flatMap((item) => item.localOffers[0] ? [[item.id, item.localOffers[0].id]] : [])),
  );
  const [retailerFilter, setRetailerFilter] = useState("");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const steppingItemId = useRef<string | null>(null);

  const estimate = useMemo(() => calculateShoppingListEstimate(items.map((item) => ({
    itemId: item.id,
    productLabel: `${item.brandName} ${item.productName} · ${item.displaySize}`,
    quantity: item.quantity,
    purchased: item.purchasedQuantity === item.quantity,
    benchmark: item.benchmark,
    localOffer: selectedOffer(item.localOffers, selectedLocalOfferIds, item.id),
  }))), [items, selectedLocalOfferIds]);
  const plannedNativeTotals = useMemo(() => benchmarkNativeTotals(items), [items]);
  const comparisonNativeTotals = useMemo(
    () => localNativeTotals(items, selectedLocalOfferIds),
    [items, selectedLocalOfferIds],
  );
  const retailers = [...new Set(items.flatMap((item) => item.localOffers.map((offer) => offer.retailerName)))].sort();
  const visibleItems = retailerFilter
    ? items.filter((item) => item.localOffers.some((offer) => offer.retailerName === retailerFilter))
    : items;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const purchasedQuantity = items.reduce(
    (sum, item) => sum + (item.purchasedQuantity === item.quantity ? item.quantity : 0),
    0,
  );
  const progress = totalQuantity > 0 ? Math.round((purchasedQuantity / totalQuantity) * 100) : 0;

  function replaceItem(itemId: string, values: Partial<PreparedShoppingListItem>) {
    setItems((current) => current.map((item) => item.id === itemId ? { ...item, ...values } : item));
  }

  function setMessage(itemId: string, message: string) {
    setMessages((current) => ({ ...current, [itemId]: message }));
  }

  function changeQuantity(item: PreparedShoppingListItem, quantity: number) {
    if (quantity === item.quantity) {
      setQuantityDrafts((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      return;
    }
    startTransition(async () => {
      const result = await updateShoppingListItemQuantity({
        shoppingListId: list.id,
        shoppingListItemId: item.id,
        quantity,
      });
      setMessage(item.id, result.message);
      if (result.status === "SUCCESS" && result.quantity !== undefined && result.purchasedQuantity !== undefined) {
        replaceItem(item.id, {
          quantity: result.quantity,
          purchasedQuantity: result.purchasedQuantity,
        });
      }
      setQuantityDrafts((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
    });
  }

  function commitQuantityDraft(item: PreparedShoppingListItem) {
    const draft = quantityDrafts[item.id];
    if (draft === undefined) return;
    const quantity = parseRequestedQuantity(draft);
    if (quantity === null) {
      setMessage(item.id, "Quantity must be a whole number of at least 1.");
      setQuantityDrafts((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      return;
    }
    changeQuantity(item, quantity);
  }

  function stepQuantity(item: PreparedShoppingListItem, difference: -1 | 1) {
    const draft = quantityDrafts[item.id];
    const displayedQuantity = draft === undefined ? item.quantity : parseRequestedQuantity(draft);
    const nextQuantity = Math.max(1, (displayedQuantity ?? item.quantity) + difference);
    changeQuantity(item, nextQuantity);
  }

  function setPurchased(item: PreparedShoppingListItem, purchased: boolean) {
    startTransition(async () => {
      const result = await markShoppingListItemPurchased({
        shoppingListId: list.id,
        shoppingListItemId: item.id,
        purchased,
      });
      setMessage(item.id, result.message);
      if (result.status === "SUCCESS" && result.purchasedQuantity !== undefined) {
        replaceItem(item.id, { purchasedQuantity: result.purchasedQuantity });
      }
    });
  }

  function removeItem(item: PreparedShoppingListItem) {
    startTransition(async () => {
      const result = await removeShoppingListItem({
        shoppingListId: list.id,
        shoppingListItemId: item.id,
      });
      if (result.status === "SUCCESS") {
        setItems((current) => current.filter((candidate) => candidate.id !== item.id));
        setExpandedIds((current) => current.filter((id) => id !== item.id));
      } else {
        setMessage(item.id, result.message);
      }
    });
  }

  const savingsValue = estimate.savingsCad === null ? "Unavailable" : cad(estimate.savingsCad);
  const alreadySavedValue = purchasedQuantity === 0
    ? cad(0)
    : estimate.alreadySavedCad === null ? "Unavailable" : cad(estimate.alreadySavedCad);

  return (
    <div className="grid gap-6">
      <header>
        <Link className="text-sm font-medium text-slate-600 underline" href="/shopping-lists">← All shopping lists</Link>
        <p className="mt-5 text-sm text-slate-500">Shopping in {marketName(list.targetMarket)} · comparing with {marketName(list.comparisonMarket)}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{list.name}</h1>
        <p className="mt-2 text-sm text-slate-600">Planned spend uses PuruPuru’s verified target-market benchmark. Canadian retailer prices provide the at-home comparison.</p>
      </header>

      {items.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <h2 className="font-semibold">This list is empty</h2>
          <p className="mt-2 text-sm text-slate-600">Choose an exact size from a product page, then add it here.</p>
          <Link className="mt-4 inline-block text-sm font-medium underline" href="/catalogue">Browse catalogue</Link>
        </section>
      ) : (
        <>
          <section className="grid gap-4 rounded-2xl bg-slate-950 p-5 text-white sm:grid-cols-2 lg:grid-cols-4 sm:p-6" aria-label="Shopping list summary">
            <Summary label={`${marketName(list.targetMarket)} planned spend`} value={estimate.plannedTotalCad === null ? "Unavailable" : `Approx. ${cad(estimate.plannedTotalCad)}`} detail={plannedNativeTotals || "Verified benchmark unavailable"} />
            <Summary label="Buy in Canada" value={estimate.localTotalCad === null ? "Unavailable" : cad(estimate.localTotalCad)} detail={comparisonNativeTotals || "No eligible Canadian retailer offers"} />
            <Summary label="Estimated savings" value={savingsValue} detail={`${estimate.includedProductCount} of ${items.length} items compared`} />
            <Summary label="Already saved" value={alreadySavedValue} detail={`${purchasedQuantity} of ${totalQuantity} units purchased`} />
            <div className="col-span-full h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} /></div>
            <p className="col-span-full text-sm text-slate-200">Purchase progress · {purchasedQuantity} / {totalQuantity} · {progress}% purchased</p>
            {estimate.exclusions.length > 0 ? <details className="col-span-full rounded-xl border border-slate-700 p-3 text-sm"><summary className="cursor-pointer font-medium">Partial estimate: why {estimate.excludedProductCount} {estimate.excludedProductCount === 1 ? "item is" : "items are"} excluded</summary><ul className="mt-3 space-y-2 text-slate-300">{estimate.exclusions.map((exclusion) => <li key={exclusion.itemId}>{exclusion.productLabel}: {exclusionLabels[exclusion.reason]}.</li>)}</ul></details> : null}
            <p className="col-span-full text-xs text-slate-300">Savings compare the verified {marketName(list.targetMarket)} benchmark with the selected Canadian retailer price for the exact size. Shipping is excluded.</p>
          </section>

          <section>
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end">
              <div><h2 className="text-xl font-semibold">Items</h2><p className="mt-1 text-sm text-slate-500">{visibleItems.length} shown · Canadian comparison defaults to the cheapest eligible product price</p></div>
              <label className="grid gap-1 text-sm font-medium text-slate-700"><span className="flex items-center gap-1.5"><Store aria-hidden className="h-4 w-4" /> Canadian retailer filter</span><select className="ui-input font-normal" onChange={(event) => setRetailerFilter(event.target.value)} value={retailerFilter}><option value="">All tracked retailers</option>{retailers.map((retailer) => <option key={retailer} value={retailer}>{retailer}</option>)}</select></label>
            </div>

            <div className="mt-4 grid gap-3">
              {visibleItems.map((item) => {
                const localOffer = selectedOffer(item.localOffers, selectedLocalOfferIds, item.id);
                const isPurchased = item.purchasedQuantity === item.quantity;
                const expanded = expandedIds.includes(item.id);
                const quantityDraft = quantityDrafts[item.id] ?? String(item.quantity);
                const parsedDraft = parseRequestedQuantity(quantityDraft);
                const href = productSelectionHref({ productSlug: item.productSlug, versionKey: item.productVersionId, variantId: item.productVariantId });
                return (
                  <article className={`surface-card p-3 sm:p-4 ${isPurchased ? "opacity-65" : ""}`} key={item.id}>
                    <div className="grid grid-cols-[auto_4rem_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[auto_4.5rem_minmax(0,1fr)_auto_auto]">
                      <label className="grid h-10 w-10 place-items-center"><input aria-label={`Mark ${item.productName} ${isPurchased ? "not purchased" : "purchased"}`} checked={isPurchased} className="h-5 w-5" disabled={isPending} onChange={(event) => setPurchased(item, event.target.checked)} type="checkbox" /></label>
                      <Link href={href}><ProductImage className="h-16 min-h-16 rounded-lg" image={item.image} productName={`${item.brandName} ${item.productName}`} sizes="72px" /></Link>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{item.brandName}</p>
                        <h3 className="truncate font-semibold"><Link className="hover:underline" href={href}>{item.productName}</Link></h3>
                        <p className="mt-1 text-xs text-slate-500">{item.displaySize} · {isPurchased ? "Purchased" : "Not purchased"}</p>
                        <p className="mt-2 text-sm font-medium">{marketName(list.targetMarket)} {item.benchmark ? `${benchmarkLabels[item.benchmark.type]} · ${nativeMoney(item.benchmark.nativeAmount, item.benchmark.nativeCurrency)}` : "benchmark unavailable"}</p>
                        <p className="mt-1 text-sm font-medium text-emerald-800">Canada {localOffer ? `${localOffer.retailerName} · ${nativeMoney(localOffer.nativeAmount, localOffer.nativeCurrency)}` : "retailer price unavailable"}</p>
                      </div>
                      <div className="col-span-3 col-start-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:col-start-auto">
                        <span className="text-xs font-medium text-slate-600">Quantity</span>
                        <div className="flex items-center rounded-lg border border-slate-300" aria-label={`Quantity for ${item.productName}`}>
                          <button aria-label={`Decrease ${item.productName} quantity`} className="grid h-9 w-9 place-items-center disabled:opacity-35" disabled={isPending || (parsedDraft ?? item.quantity) <= 1} onClick={() => { steppingItemId.current = null; stepQuantity(item, -1); }} onPointerCancel={() => { steppingItemId.current = null; }} onPointerDown={() => { steppingItemId.current = item.id; }} type="button"><Minus aria-hidden className="h-4 w-4" /></button>
                          <input aria-label={`Edit ${item.productName} quantity`} className="h-9 w-10 border-x border-slate-300 bg-white text-center text-sm font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" disabled={isPending} inputMode="numeric" min={1} onBlur={() => { if (steppingItemId.current !== item.id) commitQuantityDraft(item); }} onChange={(event) => setQuantityDrafts((current) => ({ ...current, [item.id]: event.target.value }))} onFocus={() => { steppingItemId.current = null; }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} step={1} type="number" value={quantityDraft} />
                          <button aria-label={`Increase ${item.productName} quantity`} className="grid h-9 w-9 place-items-center disabled:opacity-35" disabled={isPending} onClick={() => { steppingItemId.current = null; stepQuantity(item, 1); }} onPointerCancel={() => { steppingItemId.current = null; }} onPointerDown={() => { steppingItemId.current = item.id; }} type="button"><Plus aria-hidden className="h-4 w-4" /></button>
                        </div>
                        <button aria-label={`Remove ${item.productName} from this shopping list`} className="flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50" disabled={isPending} onClick={() => removeItem(item)} type="button"><Trash2 aria-hidden className="h-4 w-4" /> Remove</button>
                      </div>
                      <button aria-expanded={expanded} aria-label={`${expanded ? "Hide" : "Show"} details for ${item.productName}`} className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100" onClick={() => setExpandedIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} type="button"><ChevronDown aria-hidden className={`h-5 w-5 transition ${expanded ? "rotate-180" : ""}`} /></button>
                    </div>

                    {expanded ? <div className="mt-4 grid gap-5 border-t border-slate-100 pt-4 lg:grid-cols-3">
                      <BenchmarkDetails item={item} market={list.targetMarket} />
                      <OfferSelector label="Canadian retailer comparison" market={list.comparisonMarket} offers={item.localOffers} selected={localOffer} onChange={(offerId) => setSelectedLocalOfferIds((current) => ({ ...current, [item.id]: offerId }))} />
                      <DestinationOffers item={item} market={list.targetMarket} />
                      <p aria-live="polite" className="min-h-5 text-sm text-slate-600 lg:col-span-3">{messages[item.id]}</p>
                    </div> : <p aria-live="polite" className="sr-only">{messages[item.id]}</p>}
                  </article>
                );
              })}
              {visibleItems.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">No items have a tracked Canadian offer from this retailer.</p> : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function BenchmarkDetails({ item, market }: { item: PreparedShoppingListItem; market: string }) {
  const benchmark = item.benchmark;
  return <div className="grid content-start gap-1.5 text-sm"><h4 className="font-medium text-slate-700">{marketName(market)} planning benchmark</h4>{benchmark ? <><p>{benchmarkLabels[benchmark.type]} · {nativeMoney(benchmark.nativeAmount, benchmark.nativeCurrency)}</p><p className="text-slate-600">Source: {benchmark.sourceDisplayName}</p><p className="text-xs text-slate-500">Verified {new Date(benchmark.verifiedAt).toLocaleDateString("en-CA")}{benchmark.amountCad !== null && benchmark.nativeCurrency !== "CAD" ? ` · Approx. ${cad(benchmark.amountCad)}` : ""}</p>{benchmark.sourceUrl ? <a className="text-xs underline" href={safeExternalUrl(benchmark.sourceUrl)} rel="noreferrer" target="_blank">View benchmark source</a> : null}</> : <p className="rounded-lg bg-amber-50 p-3 text-amber-900">No verified benchmark is available for this exact size.</p>}</div>;
}

function DestinationOffers({ item, market }: { item: PreparedShoppingListItem; market: string }) {
  return <div className="grid content-start gap-1.5 text-sm"><h4 className="font-medium text-slate-700">Current {marketName(market)} retailer offers</h4>{item.destinationOffers.length > 0 ? <ul className="space-y-2">{item.destinationOffers.map((offer) => <li key={offer.id}><a className="underline" href={safeExternalUrl(offer.listingUrl)} rel="noreferrer" target="_blank">{offer.retailerName} · {nativeMoney(offer.nativeAmount, offer.nativeCurrency)}</a></li>)}</ul> : <p className="rounded-lg bg-slate-50 p-3 text-slate-600">No eligible retailer offers are currently tracked. The benchmark can still be used for planning.</p>}</div>;
}

function OfferSelector({ label, market, offers, selected, onChange }: { label: string; market: string; offers: PreparedShoppingListOffer[]; selected: PreparedShoppingListOffer | null; onChange: (offerId: string) => void }) {
  return <label className="grid content-start gap-1.5 text-sm font-medium text-slate-700">{label}{offers.length > 0 ? <select className="min-w-0 ui-input font-normal" onChange={(event) => onChange(event.target.value)} value={selected?.id ?? ""}>{offers.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.retailerName} · {nativeMoney(candidate.nativeAmount, candidate.nativeCurrency)}</option>)}</select> : <span className="rounded-lg bg-amber-50 p-3 font-normal text-amber-900">No eligible {marketName(market)} retailer offer tracked</span>}{selected ? <><span className="font-normal text-slate-600">{selected.amountCad !== null && selected.nativeCurrency !== "CAD" ? `Approx. ${cad(selected.amountCad)}` : "Native price shown above"}</span><a className="text-xs font-normal underline" href={safeExternalUrl(selected.listingUrl)} rel="noreferrer" target="_blank">View retailer offer</a></> : null}</label>;
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-slate-300">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-slate-300">{detail}</p></div>;
}
