"use client";

import { calculateShoppingListEstimate } from "@beauty-platform/domain/shopping-list";
import { Check, ChevronDown, Store } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { markShoppingListItemPurchased, updateShoppingListItemQuantity } from "../app/shopping-lists/actions";
import { marketName } from "../lib/markets";
import { productSelectionHref } from "../lib/product-links";
import type { PreparedShoppingList, PreparedShoppingListItem, PreparedShoppingListOffer } from "../lib/shopping-lists";
import { ProductImage } from "./product-image";

const benchmarkLabels: Record<string, string> = { MSRP: "MSRP", RETAIL_PRICE: "Retail price", REFERENCE_PRICE: "Reference price" };
const exclusionLabels: Record<string, string> = {
  NO_DESTINATION_OFFER: "no eligible destination-market offer is currently tracked",
  NO_VERIFIED_BENCHMARK: "no verified target-market benchmark is available",
  CAD_CONVERSION_UNAVAILABLE: "a required CAD conversion is unavailable",
};

function nativeMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: currency === "CAD" ? 2 : 0, maximumFractionDigits: 2 }).format(value);
}

function cad(value: number) {
  const sign = value < 0 ? "−" : "";
  return `${sign}CA$${Math.abs(value).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function selectedOffer(item: PreparedShoppingListItem, ids: Record<string, string>): PreparedShoppingListOffer | null {
  return item.offers.find((offer) => offer.id === ids[item.id]) ?? item.offers[0] ?? null;
}

export function ShoppingListDetails({ list }: { list: PreparedShoppingList }) {
  const [items, setItems] = useState(list.items);
  const [selectedOfferIds, setSelectedOfferIds] = useState<Record<string, string>>(Object.fromEntries(list.items.flatMap((item) => item.offers[0] ? [[item.id, item.offers[0].id]] : [])));
  const [retailerFilter, setRetailerFilter] = useState("");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [quantityTargets, setQuantityTargets] = useState<Record<string, number>>(Object.fromEntries(list.items.map((item) => [item.id, item.quantity])));
  const [purchaseTargets, setPurchaseTargets] = useState<Record<string, number>>(Object.fromEntries(list.items.map((item) => [item.id, item.purchasedQuantity])));
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const estimate = useMemo(() => calculateShoppingListEstimate(items.map((item) => ({ itemId: item.id, productLabel: `${item.brandName} ${item.productName} · ${item.displaySize}`, quantity: item.quantity, offer: selectedOffer(item, selectedOfferIds), benchmark: item.benchmark }))), [items, selectedOfferIds]);
  const nativeTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of items) {
      const offer = selectedOffer(item, selectedOfferIds);
      if (offer) totals.set(offer.nativeCurrency, (totals.get(offer.nativeCurrency) ?? 0) + offer.nativeAmount * item.quantity);
    }
    return [...totals.entries()];
  }, [items, selectedOfferIds]);
  const retailers = [...new Set(items.flatMap((item) => item.offers.map((offer) => offer.retailerName)))].sort();
  const visibleItems = retailerFilter ? items.filter((item) => item.offers.some((offer) => offer.retailerName === retailerFilter)) : items;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const purchasedQuantity = items.reduce((sum, item) => sum + item.purchasedQuantity, 0);
  const progress = totalQuantity > 0 ? Math.round((purchasedQuantity / totalQuantity) * 100) : 0;

  function replaceItem(itemId: string, values: Partial<PreparedShoppingListItem>) {
    setItems((current) => current.map((item) => item.id === itemId ? { ...item, ...values } : item));
  }

  function recordPurchased(item: PreparedShoppingListItem, target: number) {
    startTransition(async () => {
      const result = await markShoppingListItemPurchased({ shoppingListId: list.id, shoppingListItemId: item.id, purchasedQuantity: target });
      setMessages((current) => ({ ...current, [item.id]: result.message }));
      if (result.status === "SUCCESS" && result.purchasedQuantity !== undefined) {
        replaceItem(item.id, { purchasedQuantity: result.purchasedQuantity });
        setPurchaseTargets((current) => ({ ...current, [item.id]: result.purchasedQuantity! }));
      }
    });
  }

  return (
    <div className="grid gap-6">
      <header>
        <Link className="text-sm font-medium text-slate-600 underline" href="/shopping-lists">← All shopping lists</Link>
        <p className="mt-5 text-sm text-slate-500">Shopping in {marketName(list.targetMarket)}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{list.name}</h1>
        <p className="mt-2 text-sm text-slate-600">Only offers explicitly recorded as serving the target market are eligible.</p>
      </header>

      {items.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 p-8 text-center"><h2 className="font-semibold">This list is empty</h2><p className="mt-2 text-sm text-slate-600">Choose an exact size from a product page, then add it here.</p><Link className="mt-4 inline-block text-sm font-medium underline" href="/catalogue">Browse catalogue</Link></section>
      ) : (
        <>
          <section className="grid gap-4 rounded-2xl bg-slate-950 p-5 text-white sm:grid-cols-2 lg:grid-cols-4 sm:p-6" aria-label="Shopping list summary">
            <Summary label="Estimated total" value={estimate.destinationTotalCad === null ? "Unavailable" : `Approx. ${cad(estimate.destinationTotalCad)}`} detail={nativeTotals.map(([currency, total]) => `${nativeMoney(total, currency)} ${currency}`).join(" · ") || "No eligible offers"} />
            <Summary label="Estimated savings" value={estimate.savingsCad === null ? "Unavailable" : cad(estimate.savingsCad)} detail={`${estimate.includedProductCount} of ${items.length} products covered`} />
            <Summary label="Benchmark coverage" value={`${estimate.includedProductCount} / ${items.length}`} detail={estimate.isPartial ? "Partial estimate" : "Complete for tracked inputs"} />
            <Summary label="Purchase progress" value={`${purchasedQuantity} / ${totalQuantity}`} detail={`${progress}% purchased`} />
            <div className="col-span-full h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} /></div>
            {estimate.exclusions.length > 0 ? (
              <details className="col-span-full rounded-xl border border-slate-700 p-3 text-sm"><summary className="cursor-pointer font-medium">Why {estimate.excludedProductCount} {estimate.excludedProductCount === 1 ? "product is" : "products are"} excluded</summary><ul className="mt-3 space-y-2 text-slate-300">{estimate.exclusions.map((exclusion) => <li key={exclusion.itemId}>{exclusion.productLabel}: {exclusionLabels[exclusion.reason]}.</li>)}</ul></details>
            ) : null}
            <p className="col-span-full text-xs text-slate-400">Estimated product prices only. Shipping is excluded. Actual savings are not shown until reliable paid-price entry semantics are defined.</p>
          </section>

          <section>
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end">
              <div><h2 className="text-xl font-semibold">Items</h2><p className="mt-1 text-sm text-slate-500">{visibleItems.length} shown · purchased items remain visible</p></div>
              <label className="grid gap-1 text-sm font-medium text-slate-700"><span className="flex items-center gap-1.5"><Store aria-hidden className="h-4 w-4" /> Shop filter</span><select className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" onChange={(event) => setRetailerFilter(event.target.value)} value={retailerFilter}><option value="">All tracked retailers</option>{retailers.map((retailer) => <option key={retailer} value={retailer}>{retailer}</option>)}</select></label>
            </div>

            <div className="mt-4 grid gap-3">
              {visibleItems.map((item) => {
                const offer = selectedOffer(item, selectedOfferIds);
                const isPurchased = item.purchasedQuantity === item.quantity;
                const expanded = expandedIds.includes(item.id);
                const href = productSelectionHref({ productSlug: item.productSlug, versionKey: item.productVersionId, variantId: item.productVariantId });
                const quantityTarget = quantityTargets[item.id] ?? item.quantity;
                const purchaseTarget = purchaseTargets[item.id] ?? item.purchasedQuantity;
                return (
                  <article className={`rounded-xl border border-slate-200 bg-white p-3 sm:p-4 ${isPurchased ? "opacity-65" : ""}`} key={item.id}>
                    <div className="grid grid-cols-[auto_4.5rem_1fr_auto] items-center gap-3">
                      <label className="grid h-10 w-10 place-items-center"><input aria-label={`Mark ${item.productName} fully purchased`} checked={isPurchased} className="h-5 w-5" disabled={isPending || isPurchased} onChange={() => recordPurchased(item, item.quantity)} type="checkbox" /></label>
                      <Link href={href}><ProductImage className="h-16 min-h-16 rounded-lg" image={item.image} productName={`${item.brandName} ${item.productName}`} sizes="72px" /></Link>
                      <div className="min-w-0"><p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{item.brandName}</p><h3 className="truncate font-semibold"><Link className="hover:underline" href={href}>{item.productName}</Link></h3><p className="mt-1 text-xs text-slate-500">{item.displaySize} · Qty {item.quantity}{item.purchasedQuantity ? ` · ${item.purchasedQuantity} purchased` : ""}</p><p className="mt-1 text-sm font-medium">{offer ? `${nativeMoney(offer.nativeAmount, offer.nativeCurrency)} each` : "No eligible price tracked"}</p></div>
                      <button aria-expanded={expanded} aria-label={`${expanded ? "Hide" : "Show"} details for ${item.productName}`} className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100" onClick={() => setExpandedIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} type="button"><ChevronDown aria-hidden className={`h-5 w-5 transition ${expanded ? "rotate-180" : ""}`} /></button>
                    </div>

                    {expanded ? (
                      <div className="mt-4 grid gap-5 border-t border-slate-100 pt-4 lg:grid-cols-3">
                        <label className="grid content-start gap-1.5 text-sm font-medium text-slate-700">Selected retailer / offer{item.offers.length > 0 ? <select className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" onChange={(event) => setSelectedOfferIds((current) => ({ ...current, [item.id]: event.target.value }))} value={offer?.id ?? ""}>{item.offers.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.retailerName} · {nativeMoney(candidate.nativeAmount, candidate.nativeCurrency)}</option>)}</select> : <span className="rounded-lg bg-amber-50 p-3 font-normal text-amber-900">No eligible offer tracked</span>}{offer ? <><span className="font-normal text-slate-600">{offer.amountCad !== null && offer.nativeCurrency !== "CAD" ? `Approx. ${cad(offer.amountCad)}` : "Native price shown above"}</span><a className="text-xs font-normal underline" href={offer.listingUrl} rel="noreferrer" target="_blank">View retailer offer</a></> : null}</label>
                        <div className="text-sm"><p className="font-medium text-slate-700">Target-market benchmark</p>{item.benchmark ? <><p className="mt-2">{benchmarkLabels[item.benchmark.type]} · {nativeMoney(item.benchmark.nativeAmount, item.benchmark.nativeCurrency)} {item.benchmark.nativeCurrency}</p><p className="mt-1 text-xs text-slate-500">{item.benchmark.sourceDisplayName} · verified {new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(new Date(item.benchmark.verifiedAt))}</p></> : <p className="mt-2 text-amber-900">No verified {marketName(list.targetMarket)} benchmark.</p>}</div>
                        <div className="grid gap-3">
                          <label className="grid gap-1 text-sm font-medium text-slate-700">Planned quantity<div className="grid grid-cols-[1fr_auto] gap-2"><input className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 font-normal" min={Math.max(1, item.purchasedQuantity)} onChange={(event) => setQuantityTargets((current) => ({ ...current, [item.id]: Number(event.target.value) }))} type="number" value={quantityTarget} /><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50" disabled={isPending || !Number.isInteger(quantityTarget) || quantityTarget < Math.max(1, item.purchasedQuantity)} onClick={() => startTransition(async () => { const result = await updateShoppingListItemQuantity({ shoppingListId: list.id, shoppingListItemId: item.id, quantity: quantityTarget }); setMessages((current) => ({ ...current, [item.id]: result.message })); if (result.status === "SUCCESS" && result.quantity !== undefined) replaceItem(item.id, { quantity: result.quantity, purchasedQuantity: result.purchasedQuantity }); })} type="button">Save</button></div></label>
                          <label className="grid gap-1 text-sm font-medium text-slate-700">Purchased quantity<div className="grid grid-cols-[1fr_auto] gap-2"><input className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 font-normal" max={item.quantity} min={item.purchasedQuantity} onChange={(event) => setPurchaseTargets((current) => ({ ...current, [item.id]: Number(event.target.value) }))} type="number" value={purchaseTarget} /><button className="flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={isPending || purchaseTarget < item.purchasedQuantity || purchaseTarget > item.quantity} onClick={() => recordPurchased(item, purchaseTarget)} type="button"><Check aria-hidden className="h-4 w-4" /> Record</button></div></label>
                        </div>
                        <p aria-live="polite" className="min-h-5 text-sm text-slate-600 lg:col-span-3">{messages[item.id]}</p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
              {visibleItems.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">No items have a tracked offer from this retailer.</p> : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-slate-300">{detail}</p></div>;
}
