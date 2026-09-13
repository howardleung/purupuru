"use client";

import { calculateShoppingListEstimate } from "@beauty-platform/domain/shopping-list";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import {
  markShoppingListItemPurchased,
  updateShoppingListItemQuantity,
} from "../app/shopping-lists/actions";
import { marketName } from "../lib/markets";
import type {
  PreparedShoppingList,
  PreparedShoppingListItem,
  PreparedShoppingListOffer,
} from "../lib/shopping-lists";

const benchmarkLabels: Record<string, string> = {
  MSRP: "MSRP",
  RETAIL_PRICE: "Retail price",
  REFERENCE_PRICE: "Reference price",
};

const exclusionLabels: Record<string, string> = {
  NO_DESTINATION_OFFER: "no eligible destination-market offer is currently tracked",
  NO_VERIFIED_BENCHMARK: "no verified target-market benchmark is available",
  CAD_CONVERSION_UNAVAILABLE: "a required CAD conversion is unavailable",
};

function formatNativeMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: currency === "CAD" ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCad(value: number) {
  const sign = value < 0 ? "−" : "";
  return `${sign}CA$${Math.abs(value).toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatRateDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function selectedOffer(
  item: PreparedShoppingListItem,
  selectedOfferIds: Record<string, string>,
): PreparedShoppingListOffer | null {
  return (
    item.offers.find((offer) => offer.id === selectedOfferIds[item.id]) ??
    item.offers[0] ??
    null
  );
}

export function ShoppingListDetails({ list }: { list: PreparedShoppingList }) {
  const [items, setItems] = useState(list.items);
  const [selectedOfferIds, setSelectedOfferIds] = useState<Record<string, string>>(
    Object.fromEntries(list.items.flatMap((item) => item.offers[0] ? [[item.id, item.offers[0].id]] : [])),
  );
  const [quantityTargets, setQuantityTargets] = useState<Record<string, number>>(
    Object.fromEntries(list.items.map((item) => [item.id, item.quantity])),
  );
  const [purchaseTargets, setPurchaseTargets] = useState<Record<string, number>>(
    Object.fromEntries(list.items.map((item) => [item.id, item.purchasedQuantity])),
  );
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const estimate = useMemo(
    () =>
      calculateShoppingListEstimate(
        items.map((item) => ({
          itemId: item.id,
          productLabel: `${item.brandName} ${item.productName} · ${item.displaySize}`,
          quantity: item.quantity,
          offer: selectedOffer(item, selectedOfferIds),
          benchmark: item.benchmark,
        })),
      ),
    [items, selectedOfferIds],
  );

  const nativeTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of items) {
      const offer = selectedOffer(item, selectedOfferIds);
      if (!offer) continue;
      totals.set(
        offer.nativeCurrency,
        (totals.get(offer.nativeCurrency) ?? 0) + offer.nativeAmount * item.quantity,
      );
    }
    return [...totals.entries()];
  }, [items, selectedOfferIds]);

  const rateDates = items.flatMap((item) => {
    const offerDate = selectedOffer(item, selectedOfferIds)?.rateDate;
    return [offerDate, item.benchmark?.rateDate].filter((value): value is string => Boolean(value));
  });
  const latestRateDate = [...rateDates].sort().at(-1) ?? null;

  function replaceItem(itemId: string, values: Partial<PreparedShoppingListItem>) {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, ...values } : item)),
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-slate-200 p-5">
        <p className="text-sm text-slate-500">Target market · {marketName(list.targetMarket)}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{list.name}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Prices use offers explicitly recorded as serving {marketName(list.targetMarket)}.
          Retailer country is not used as a proxy.
        </p>
      </section>

      {items.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <h2 className="font-semibold">This list is empty</h2>
          <p className="mt-2 text-sm text-slate-600">
            Choose an exact size from a product page, then add it here.
          </p>
          <Link className="mt-4 inline-block text-sm font-medium underline" href="/">
            Browse catalogue
          </Link>
        </section>
      ) : (
        <>
          <section className="grid gap-4">
            {items.map((item) => {
              const offer = selectedOffer(item, selectedOfferIds);
              const quantityTarget = quantityTargets[item.id] ?? item.quantity;
              const purchaseTarget = purchaseTargets[item.id] ?? item.purchasedQuantity;
              return (
                <article className="rounded-xl border border-slate-200 p-5" key={item.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                        {item.brandName}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold">
                        <Link
                          className="underline decoration-slate-300 underline-offset-2"
                          href={`/products/${item.productSlug}?version=${item.productVersionId}&variant=${item.productVariantId}`}
                        >
                          {item.productName}
                        </Link>
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.versionName} · {item.displaySize}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600">
                      Purchased {item.purchasedQuantity} of {item.quantity}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      Destination offer
                      {item.offers.length > 0 ? (
                        <select
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"
                          onChange={(event) =>
                            setSelectedOfferIds((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          value={offer?.id ?? ""}
                        >
                          {item.offers.map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.retailerName} · {formatNativeMoney(candidate.nativeAmount, candidate.nativeCurrency)}
                              {" · " + candidate.availabilityState.replaceAll("_", " ").toLowerCase()}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="rounded-md bg-amber-50 px-3 py-2 font-normal text-amber-900">
                          No eligible offer tracked
                        </span>
                      )}
                      {offer ? (
                        <span className="font-normal text-slate-600">
                          {formatNativeMoney(offer.nativeAmount, offer.nativeCurrency)}
                          {offer.amountCad !== null && offer.nativeCurrency !== "CAD"
                            ? ` (approx. ${formatCad(offer.amountCad)})`
                            : ""}
                        </span>
                      ) : null}
                      {offer ? (
                        <span className="text-xs font-normal text-slate-500">
                          {offer.availabilityState.replaceAll("_", " ").toLowerCase()} ·{" "}
                          <a
                            className="underline decoration-slate-300 underline-offset-2"
                            href={offer.listingUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View offer
                          </a>
                        </span>
                      ) : null}
                    </label>

                    <div className="text-sm">
                      <p className="font-medium text-slate-700">Target-market benchmark</p>
                      {item.benchmark ? (
                        <>
                          <p className="mt-2 text-slate-900">
                            {benchmarkLabels[item.benchmark.type]} ·{" "}
                            {formatNativeMoney(
                              item.benchmark.nativeAmount,
                              item.benchmark.nativeCurrency,
                            )}
                            {item.benchmark.amountCad !== null &&
                            item.benchmark.nativeCurrency !== "CAD"
                              ? ` (approx. ${formatCad(item.benchmark.amountCad)})`
                              : ""}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.benchmark.sourceDisplayName} · verified{" "}
                            {new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(
                              new Date(item.benchmark.verifiedAt),
                            )}
                          </p>
                        </>
                      ) : (
                        <p className="mt-2 text-amber-900">
                          No verified {marketName(list.targetMarket)} benchmark.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <label className="grid gap-1 text-sm font-medium text-slate-700">
                        Planned quantity
                        <div className="flex gap-2">
                          <input
                            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 font-normal"
                            min={Math.max(1, item.purchasedQuantity)}
                            onChange={(event) =>
                              setQuantityTargets((current) => ({
                                ...current,
                                [item.id]: Number(event.target.value),
                              }))
                            }
                            type="number"
                            value={quantityTarget}
                          />
                          <button
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                            disabled={
                              isPending ||
                              !Number.isInteger(quantityTarget) ||
                              quantityTarget < Math.max(1, item.purchasedQuantity)
                            }
                            onClick={() =>
                              startTransition(async () => {
                                const result = await updateShoppingListItemQuantity({
                                  shoppingListId: list.id,
                                  shoppingListItemId: item.id,
                                  quantity: quantityTarget,
                                });
                                setMessages((current) => ({ ...current, [item.id]: result.message }));
                                if (result.status === "SUCCESS" && result.quantity !== undefined) {
                                  replaceItem(item.id, {
                                    quantity: result.quantity,
                                    purchasedQuantity: result.purchasedQuantity,
                                  });
                                  setQuantityTargets((current) => ({
                                    ...current,
                                    [item.id]: result.quantity!,
                                  }));
                                }
                              })
                            }
                            type="button"
                          >
                            Save
                          </button>
                        </div>
                      </label>

                      <label className="grid gap-1 text-sm font-medium text-slate-700">
                        Mark purchased
                        <div className="flex gap-2">
                          <input
                            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 font-normal"
                            max={item.quantity}
                            min={item.purchasedQuantity}
                            onChange={(event) =>
                              setPurchaseTargets((current) => ({
                                ...current,
                                [item.id]: Number(event.target.value),
                              }))
                            }
                            type="number"
                            value={purchaseTarget}
                          />
                          <button
                            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                            disabled={
                              isPending ||
                              purchaseTarget < item.purchasedQuantity ||
                              purchaseTarget > item.quantity
                            }
                            onClick={() =>
                              startTransition(async () => {
                                const result = await markShoppingListItemPurchased({
                                  shoppingListId: list.id,
                                  shoppingListItemId: item.id,
                                  purchasedQuantity: purchaseTarget,
                                });
                                setMessages((current) => ({ ...current, [item.id]: result.message }));
                                if (
                                  result.status === "SUCCESS" &&
                                  result.purchasedQuantity !== undefined
                                ) {
                                  replaceItem(item.id, {
                                    purchasedQuantity: result.purchasedQuantity,
                                  });
                                }
                              })
                            }
                            type="button"
                          >
                            Record
                          </button>
                        </div>
                      </label>
                    </div>
                  </div>

                  <p aria-live="polite" className="mt-3 min-h-5 text-sm text-slate-600">
                    {messages[item.id]}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="rounded-xl border border-slate-900 bg-slate-950 p-6 text-white">
            <p className="text-sm text-slate-300">Estimated destination cost</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xl font-semibold">
              {nativeTotals.length > 0
                ? nativeTotals.map(([currency, total]) => (
                    <span key={currency}>{formatNativeMoney(total, currency)}</span>
                  ))
                : <span>Unavailable</span>}
            </div>
            <p className="mt-1 text-sm text-slate-300">
              {estimate.destinationTotalCad !== null
                ? `Approx. ${formatCad(estimate.destinationTotalCad)} total`
                : "A complete approximate CAD total is unavailable."}
            </p>

            <div className="my-5 border-t border-slate-700" />

            <p className="text-sm text-slate-300">Estimated savings against target-market benchmarks</p>
            <p className="mt-1 text-3xl font-semibold">
              {estimate.savingsCad === null ? "Unavailable" : formatCad(estimate.savingsCad)}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Based on {estimate.includedProductCount} of {items.length} products
            </p>
            {estimate.isPartial ? (
              <p className="mt-2 inline-block rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-amber-950">
                Partial estimate
              </p>
            ) : null}
            {latestRateDate ? (
              <p className="mt-3 text-xs text-slate-400">
                Approx. CAD conversion · Bank of Canada daily rates · rate updated{" "}
                {formatRateDate(latestRateDate)}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-slate-400">
              Product prices only. Shipping is excluded and does not affect offer order.
            </p>

            {estimate.exclusions.length > 0 ? (
              <details className="mt-5 rounded-lg border border-slate-700 p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  {estimate.excludedProductCount} excluded{" "}
                  {estimate.excludedProductCount === 1 ? "product" : "products"}
                </summary>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {estimate.exclusions.map((exclusion) => (
                    <li key={exclusion.itemId}>
                      {exclusion.productLabel}: {exclusionLabels[exclusion.reason]}.
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
