import type { OfferPrice } from "@beauty-platform/domain";

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
  retailer: { name: string; country: string | null };
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

export function OfferSection({
  title,
  description,
  offers,
}: {
  title: string;
  description: string;
  offers: OfferView[];
}) {
  const showShipping = offers.some((offer) => shippingText(offer));

  return (
    <section className="mt-12">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      {offers.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">
          No currently verified offers are available for this version and size.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[680px] text-left text-sm">
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
                    <a
                      className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-2"
                      href={offer.listingUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {offer.retailer.name}
                    </a>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className="font-medium">
                      {formatMoney(offer.productPrice, offer.nativeCurrency)}
                    </span>
                    {offer.nativeCurrency !== "CAD" && offer.cadConvertedPrice !== null ? (
                      <span className="mt-1 block text-xs text-slate-500">
                        About {formatMoney(offer.cadConvertedPrice, "CAD")}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {availabilityLabels[offer.availabilityState] ?? "Availability unverified"}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-700">
                    {offer.items.length > 0
                      ? offer.items.map((item) => `${item.quantity} × ${item.label}`).join(", ")
                      : "—"}
                  </td>
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
                  <td className="px-4 py-4 align-top text-slate-500">
                    {new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(
                      offer.lastVerifiedAt,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {offers.length > 1 ? (
        <p className="mt-3 text-xs text-slate-500">
          Ordered by product price. Shipping and bundle contents do not affect this order.
        </p>
      ) : null}
    </section>
  );
}
