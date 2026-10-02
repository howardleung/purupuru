import { getOfferExtraLabels, type OfferPrice } from "@beauty-platform/domain";

import { safeExternalUrl } from "../lib/external-url";
import { getLocalFirstPrice } from "../lib/price-presentation";
import { RetailerLink } from "./retailer-link";

export type OfferView = OfferPrice & {
  id: string;
  productVariantId: string;
  primaryQuantity: number;
  listingUrl: string;
  displayCadPrice: number | null;
  availabilityState: string;
  retailer: { sourceKey: string; name: string };
  items: Array<{
    id: string;
    label: string;
    quantity: number;
    itemType: "SAME_PRODUCT" | "OTHER_PRODUCT" | "MINI" | "GIFT_ACCESSORY";
    isPromotional: boolean;
    relatedProductVariantId: string | null;
  }>;
};

const availabilityLabels: Record<string, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Out of stock",
  PREORDER: "Pre-order",
  UNKNOWN: "Unknown",
};

function availabilityClass(state: string) {
  if (state === "IN_STOCK") return "bg-emerald-50 text-emerald-800";
  if (state === "LOW_STOCK" || state === "PREORDER") return "bg-amber-50 text-amber-900";
  if (state === "OUT_OF_STOCK") return "bg-slate-200 text-slate-600";
  return "bg-slate-100 text-slate-600";
}

function formatMoney(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: currency === "CAD" ? 2 : 0,
    maximumFractionDigits: currency === "CAD" ? 2 : 0,
  }).format(value)} ${currency}`;
}

function formatCad(value: number) {
  return `CA$${new Intl.NumberFormat("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function extrasText(offer: OfferView) {
  const labels = getOfferExtraLabels({
    items: offer.items,
    primaryProductVariantId: offer.productVariantId,
    primaryQuantity: offer.primaryQuantity,
  });
  return labels.length > 0 ? labels.join(", ") : "—";
}

function OfferPriceLink({ offer }: { offer: OfferView }) {
  const price = getLocalFirstPrice(
    offer.productPrice,
    offer.nativeCurrency,
    offer.displayCadPrice,
  );
  const primaryPrice = price.primaryCurrency === "CAD"
    ? formatCad(price.primaryAmount)
    : formatMoney(price.primaryAmount, price.primaryCurrency);
  const nativePrice = price.nativeSecondary
    ? formatMoney(price.nativeSecondary.amount, price.nativeSecondary.currency)
    : null;

  return (
    <a
      aria-label={`Shop this listing at ${offer.retailer.name} for ${price.primaryIsApproximate ? "approximately " : ""}${primaryPrice}${nativePrice ? `; native price ${nativePrice}` : ""}`}
      className="inline-flex flex-col items-end text-right font-bold text-brand-action underline decoration-slate-300 underline-offset-2 transition hover:decoration-brand-action"
      href={safeExternalUrl(offer.listingUrl)}
      rel="noreferrer"
      target="_blank"
    >
      <span>{primaryPrice}</span>
      {nativePrice ? (
        <span className="mt-0.5 text-xs font-medium text-slate-500 no-underline">{nativePrice}</span>
      ) : price.cadConversionUnavailable ? (
        <span className="mt-0.5 max-w-32 text-xs font-medium text-slate-500 no-underline">CAD conversion unavailable</span>
      ) : null}
    </a>
  );
}

export function OfferSection({
  title,
  description,
  offers,
  emptyMessage = "No currently verified offers are available for this size.",
  compact = false,
}: {
  title: string;
  description: string;
  offers: OfferView[];
  emptyMessage?: string;
  compact?: boolean;
}) {
  return (
    <section className={compact ? "" : "mt-10 sm:mt-12"}>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      {offers.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600 sm:p-6">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-2 sm:hidden">
            {offers.map((offer) => (
              <article className={`rounded-xl border border-slate-200 p-3 ${offer.availabilityState === "OUT_OF_STOCK" ? "bg-slate-50" : "bg-white"}`} key={offer.id}>
                <div className="flex items-start justify-between gap-3">
                  <RetailerLink
                    className="min-w-0 font-semibold text-brand-action underline decoration-slate-300 underline-offset-2 hover:decoration-brand-action"
                    href={offer.listingUrl}
                    name={offer.retailer.name}
                    showName
                    sourceKey={offer.retailer.sourceKey}
                  />
                  <OfferPriceLink offer={offer} />
                </div>
                <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 text-xs">
                  <div>
                    <dt className="sr-only">Availability</dt>
                    <dd className={`inline-flex rounded-full px-2 py-1 font-semibold ${availabilityClass(offer.availabilityState)}`}>
                      {availabilityLabels[offer.availabilityState] ?? "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Extras</dt>
                    <dd className="mt-0.5 text-slate-700">{extrasText(offer)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="mt-4 hidden overflow-hidden rounded-xl border border-slate-200 sm:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="w-[28%] px-4 py-3 font-medium">Retailer</th>
                  <th className="px-4 py-3 font-medium">Extras</th>
                  <th className="w-28 px-4 py-3 font-medium">Availability</th>
                  <th className="w-44 px-4 py-3 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {offers.map((offer) => (
                  <tr className={offer.availabilityState === "OUT_OF_STOCK" ? "bg-slate-50 text-slate-500" : undefined} key={offer.id}>
                    <td className="px-4 py-4 align-top">
                      <RetailerLink
                        className="font-semibold text-brand-action underline decoration-slate-300 underline-offset-2 hover:decoration-brand-action"
                        href={offer.listingUrl}
                        name={offer.retailer.name}
                        showName
                        sourceKey={offer.retailer.sourceKey}
                      />
                    </td>
                    <td className="px-4 py-4 align-top text-slate-700">{extrasText(offer)}</td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${availabilityClass(offer.availabilityState)}`}>
                        {availabilityLabels[offer.availabilityState] ?? "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right align-top text-base">
                      <div className="flex justify-end"><OfferPriceLink offer={offer} /></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {offers.length > 1 ? (
        <p className="mt-3 text-xs text-slate-500">
          Ordered by product price. Shipping and bundle contents do not affect this order.
        </p>
      ) : null}
    </section>
  );
}
