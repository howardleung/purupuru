export type CurrentTrackedOffer = {
  id: string;
  productVariantId: string;
  retailerId: string;
  retailerName: string;
  listingUrl: string;
  amount: number;
  nativeCurrency: string;
  lastVerifiedAt: Date | string;
};

export type HistoricalPriceObservation = {
  id: string;
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

function timestamp(value: Date | string) {
  return new Date(value).getTime();
}

function isoString(value: Date | string) {
  return new Date(value).toISOString();
}

/**
 * Builds independently identifiable history for one exact variant.
 *
 * The current schema has no direct PriceObservation -> Offer relation, so a
 * tracked-offer observation must match the offer's variant, retailer, and
 * canonical listing/source URL. Unmatched observations are intentionally not
 * folded into another retailer's line.
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
            observation.retailerId === offer.retailerId &&
            observation.sourceUrl === offer.listingUrl,
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
