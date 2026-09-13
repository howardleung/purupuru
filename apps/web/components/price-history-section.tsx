import type { PriceHistorySeries } from "@beauty-platform/domain/price-history";

const verificationLabels: Record<string, string> = {
  RETAILER_SOURCE: "Retailer source",
  RECEIPT_VERIFIED: "Receipt verified",
  COMMUNITY_REPORTED: "Community reported",
  OTHER: "Demo observation",
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "CAD" ? 2 : 0,
    maximumFractionDigits: currency === "CAD" ? 2 : 0,
  }).format(value) + " " + currency;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function PriceHistorySection({
  productContext,
  series,
}: {
  productContext: string;
  series: PriceHistorySeries[];
}) {
  return (
    <section className="mt-10 sm:mt-12" aria-labelledby="price-history-title">
      <div>
        <h2 className="text-xl font-semibold" id="price-history-title">Price History</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tracked observations for {productContext}. Retailer series remain separate.
        </p>
      </div>

      {series.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600 sm:p-6">
          <p>No price observations have been recorded for this version and size yet.</p>
          <p className="mt-1">More observations will appear as Otoku continues tracking this offer.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          {series.map((retailerSeries) => {
            const lastObservation =
              retailerSeries.observations[retailerSeries.observations.length - 1];

            return (
              <article className="rounded-xl border border-slate-200 p-4 sm:p-5" key={retailerSeries.offerId}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold">
                      <a
                        className="underline decoration-slate-300 underline-offset-2"
                        href={retailerSeries.listingUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {retailerSeries.retailerName}
                      </a>
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Last historical observation {formatDate(lastObservation.observedAt)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2 sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Current tracked offer
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatMoney(
                        retailerSeries.currentPrice.amount,
                        retailerSeries.currentPrice.nativeCurrency,
                      )}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Verified {formatDate(retailerSeries.currentPrice.lastVerifiedAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead className="border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-2 pr-4 font-medium">Observed</th>
                        <th className="py-2 pr-4 font-medium">Historical price</th>
                        <th className="py-2 font-medium">Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {retailerSeries.observations.map((observation) => (
                        <tr key={observation.id}>
                          <td className="py-3 pr-4 text-slate-600">
                            {formatDate(observation.observedAt)}
                          </td>
                          <td className="py-3 pr-4 font-medium">
                            {formatMoney(observation.amount, observation.nativeCurrency)}
                          </td>
                          <td className="py-3 text-slate-600">
                            {verificationLabels[observation.verificationType] ??
                              "Recorded observation"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {retailerSeries.observations.length === 1 ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Sparse history: only one observation has been recorded for this offer.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Price history is limited to tracked observations. Current offer prices are shown separately
        and are not backfilled as historical observations. Historical values stay in their native
        source currency because observation-date CAD rates are not yet stored.
      </p>
    </section>
  );
}
