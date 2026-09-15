export type CurrentTrackedOffer = {
  id: string;
  productVariantId: string;
  retailerId: string;
  retailerSourceKey?: string | null;
  retailerName: string;
  listingUrl: string;
  amount: number;
  nativeCurrency: string;
  lastVerifiedAt: Date | string;
};

export type HistoricalPriceObservation = {
  id: string;
  offerId?: string | null;
  productVariantId: string;
  retailerId: string | null;
  retailerName: string | null;
  sourceUrl: string | null;
  amount: number;
  nativeCurrency: string;
  observedAt: Date | string;
  verificationType: string;
};

export type PriceHistorySeries = {
  offerId: string;
  retailerId: string;
  retailerSourceKey: string | null;
  retailerName: string;
  listingUrl: string;
  currentPrice: {
    amount: number;
    nativeCurrency: string;
    lastVerifiedAt: string;
  };
  observations: Array<{
    id: string;
    amount: number;
    nativeCurrency: string;
    observedAt: string;
    verificationType: string;
  }>;
};

export type PriceHistoryChartSeries = Omit<PriceHistorySeries, "currentPrice"> & {
  currentPrice: PriceHistorySeries["currentPrice"] | null;
};

export type PriceHistoryCurrencyGroup = {
  nativeCurrency: string;
  series: PriceHistoryChartSeries[];
};

function timestamp(value: Date | string) {
  return new Date(value).getTime();
}

function isoString(value: Date | string) {
  return new Date(value).toISOString();
}

/**
 * Builds independently identifiable history for one exact variant.
 *
 * Ingestion-owned observations use their direct offer relation. Legacy/manual
 * observations with no offerId retain the conservative variant + retailer +
 * canonical source-URL fallback and are never folded into another offer line.
 */
export function buildPriceHistorySeries({
  selectedVariantId,
  offers,
  observations,
}: {
  selectedVariantId: string;
  offers: readonly CurrentTrackedOffer[];
  observations: readonly HistoricalPriceObservation[];
}): PriceHistorySeries[] {
  return offers
    .filter((offer) => offer.productVariantId === selectedVariantId)
    .map((offer): PriceHistorySeries | null => {
      const matching = observations
        .filter(
          (observation) =>
            observation.productVariantId === selectedVariantId &&
            (observation.offerId != null
              ? observation.offerId === offer.id
              : observation.retailerId === offer.retailerId &&
                observation.sourceUrl === offer.listingUrl),
        )
        .sort(
          (left, right) =>
            timestamp(left.observedAt) - timestamp(right.observedAt) ||
            left.id.localeCompare(right.id),
        )
        .map((observation) => ({
          id: observation.id,
          amount: observation.amount,
          nativeCurrency: observation.nativeCurrency,
          observedAt: isoString(observation.observedAt),
          verificationType: observation.verificationType,
        }));

      if (matching.length === 0) return null;

      return {
        offerId: offer.id,
        retailerId: offer.retailerId,
        retailerSourceKey: offer.retailerSourceKey ?? null,
        retailerName: offer.retailerName,
        listingUrl: offer.listingUrl,
        currentPrice: {
          amount: offer.amount,
          nativeCurrency: offer.nativeCurrency,
          lastVerifiedAt: isoString(offer.lastVerifiedAt),
        },
        observations: matching,
      };
    })
    .filter((series): series is PriceHistorySeries => series !== null)
    .sort(
      (left, right) =>
        left.retailerName.localeCompare(right.retailerName) ||
        left.offerId.localeCompare(right.offerId),
    );
}

/**
 * Keeps historical native currencies on independent axes. A listing can appear
 * in more than one group if its source currency changed over time, but its
 * observations are never converted or combined on a misleading scale.
 */
export function groupPriceHistoryByCurrency(
  series: readonly PriceHistorySeries[],
): PriceHistoryCurrencyGroup[] {
  const groups = new Map<string, PriceHistoryChartSeries[]>();

  for (const retailerSeries of series) {
    const currencies = [...new Set(retailerSeries.observations.map((value) => value.nativeCurrency))]
      .sort((left, right) => left.localeCompare(right));

    for (const nativeCurrency of currencies) {
      const currencySeries: PriceHistoryChartSeries = {
        ...retailerSeries,
        currentPrice:
          retailerSeries.currentPrice.nativeCurrency === nativeCurrency
            ? retailerSeries.currentPrice
            : null,
        observations: retailerSeries.observations.filter(
          (observation) => observation.nativeCurrency === nativeCurrency,
        ),
      };
      const current = groups.get(nativeCurrency) ?? [];
      current.push(currencySeries);
      groups.set(nativeCurrency, current);
    }
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([nativeCurrency, currencySeries]) => ({
      nativeCurrency,
      series: currencySeries.sort(
        (left, right) =>
          left.retailerName.localeCompare(right.retailerName) ||
          left.offerId.localeCompare(right.offerId),
      ),
    }));
}
