import type { OfferPrice } from "@beauty-platform/domain";

import { RetailerLink } from "./retailer-link";

export type OfferView = OfferPrice & {
  id: string;
  listingUrl: string;
  availabilityState: string;
  shippingState: string | null;
  shippingAmount: number | null;
  shippingCurrency: string | null;
  shippingConditions: string | null;
  deliveryMethod: string | null;
  deliveryEstimate: string | null;
  lastVerifiedAt: Date;
  retailer: { sourceKey: string; name: string; country: string | null };
  items: Array<{ id: string; label: string; quantity: number; isPromotional: boolean }>;
};

const availabilityLabels: Record<string, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Out of stock",
  PREORDER: "Pre-order",
  UNKNOWN: "Availability unverified",
};

function formatMoney(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "CAD" ? 2 : 0,
    maximumFractionDigits: currency === "CAD" ? 2 : 0,
  }).format(value)} ${currency}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(value);
}

function shippingText(offer: OfferView) {
  if (!offer.shippingState || offer.shippingState === "UNKNOWN") return null;
  if (offer.shippingState === "FREE") return "Free";
  if (offer.shippingState === "CALCULATED") return offer.shippingConditions ?? "Calculated at checkout";
  if (offer.shippingState === "PICKUP_ONLY") return "Pickup only";
  if (offer.shippingState === "NOT_APPLICABLE") return "Not applicable";
  if (offer.shippingAmount !== null && offer.shippingCurrency) {
    return formatMoney(offer.shippingAmount, offer.shippingCurrency);
  }
  return offer.shippingConditions;
}

function extrasText(offer: OfferView) {
  return offer.items.length > 0
    ? offer.items.map((item) => `${item.quantity} × ${item.label}`).join(", ")
    : "None recorded";
}

function OfferPriceDisplay({ offer }: { offer: OfferView }) {
  return (
    <>
      <span className="font-medium">{formatMoney(offer.productPrice, offer.nativeCurrency)}</span>
      {offer.nativeCurrency !== "CAD" ? (
        offer.cadConvertedPrice !== null ? (
          <span className="mt-1 block text-xs text-slate-500">
            Approx. {formatMoney(offer.cadConvertedPrice, "CAD")}
          </span>
        ) : (
          <span className="mt-1 block text-xs text-slate-500">Approx. CAD conversion unavailable</span>
        )
      ) : null}
    </>
  );
}

export function OfferSection({
  title,
  description,
  offers,
  emptyMessage = "No currently verified offers are available for this version and size.",
  compact = false,
}: {
  title: string;
  description: string;
  offers: OfferView[];
  emptyMessage?: string;
  compact?: boolean;
}) {
  const showShipping = offers.some((offer) => shippingText(offer));

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
          <div className={compact ? "mt-4 grid gap-3" : "mt-4 grid gap-3 sm:hidden"}>
            {offers.map((offer) => (
              <article className="rounded-xl border border-slate-200 p-4" key={offer.id}>
                <div className="flex items-start justify-between gap-3">
                  <RetailerLink
                    className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-2"
                    href={offer.listingUrl}
                    name={offer.retailer.name}
                    sourceKey={offer.retailer.sourceKey}
                  />
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                    {availabilityLabels[offer.availabilityState] ?? "Availability unverified"}
                  </span>
                </div>
                <div className="mt-3 text-sm"><OfferPriceDisplay offer={offer} /></div>
                <dl className="mt-4 grid gap-2 text-xs">
                  <div>
                    <dt className="font-medium text-slate-500">Extras</dt>
                    <dd className="mt-0.5 text-slate-700">{extrasText(offer)}</dd>
                  </div>
                  {showShipping ? (
                    <div>
                      <dt className="font-medium text-slate-500">Shipping</dt>
                      <dd className="mt-0.5 text-slate-700">
                        {shippingText(offer) ?? "Not reliably available"}
                        {offer.deliveryMethod ? (
                          <span className="block text-slate-500">
                            {offer.deliveryMethod}
                            {offer.deliveryEstimate ? ` · ${offer.deliveryEstimate}` : ""}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="font-medium text-slate-500">Verified</dt>
                    <dd className="mt-0.5 text-slate-700">{formatDate(offer.lastVerifiedAt)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className={compact ? "hidden" : "mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 sm:block"}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Retailer</th>
                  <th className="px-4 py-3 font-medium">Product price</th>
                  <th className="px-4 py-3 font-medium">Availability</th>
                  <th className="px-4 py-3 font-medium">Extras</th>
                  {showShipping ? <th className="px-4 py-3 font-medium">Shipping</th> : null}
                  <th className="px-4 py-3 font-medium">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {offers.map((offer) => (
                  <tr key={offer.id}>
                    <td className="px-4 py-4 align-top">
                      <RetailerLink
                        href={offer.listingUrl}
                        name={offer.retailer.name}
                        sourceKey={offer.retailer.sourceKey}
                      />
                    </td>
                    <td className="px-4 py-4 align-top"><OfferPriceDisplay offer={offer} /></td>
                    <td className="px-4 py-4 align-top text-slate-700">
                      {availabilityLabels[offer.availabilityState] ?? "Availability unverified"}
                    </td>
                    <td className="px-4 py-4 align-top text-slate-700">{extrasText(offer)}</td>
                    {showShipping ? (
                      <td className="max-w-xs px-4 py-4 align-top text-slate-700">
                        {shippingText(offer) ?? "—"}
                        {offer.deliveryMethod ? (
                          <span className="mt-1 block text-xs text-slate-500">
                            {offer.deliveryMethod}
                            {offer.deliveryEstimate ? ` · ${offer.deliveryEstimate}` : ""}
                          </span>
                        ) : null}
                      </td>
                    ) : null}
                    <td className="px-4 py-4 align-top text-slate-500">{formatDate(offer.lastVerifiedAt)}</td>
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
