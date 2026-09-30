import assert from "node:assert/strict";
import test from "node:test";

import {
  matchCanonicalVariant,
  type MatchCandidate,
  type NormalizedSourceListing,
} from "../../packages/domain/src/ingestion.ts";
import {
  ingestNormalizedListing,
  type ExistingObservation,
  type ExistingOffer,
  type IngestionRepository,
  type ObservationWrite,
  type OfferWrite,
} from "../../scripts/import/ingestion-service.ts";

const candidate: MatchCandidate = {
  variantId: "variant-dokdo-200",
  productFamilyId: "family-dokdo",
  productVersionId: "version-current",
  productName: "1025 Dokdo Toner",
  brandName: "Round Lab",
  gtin: "8809657114731",
  manufacturerSku: null,
  versionCode: "current",
  manufacturerVersionCode: null,
  releaseDate: null,
  formulationFingerprint: null,
  packagingDescription: "Clear bottle with blue 1025 Dokdo label.",
  normalizedQuantity: 200,
  normalizedUnit: "ml",
};

function listing(overrides: Partial<NormalizedSourceListing> = {}): NormalizedSourceListing {
  return {
    sourceKey: "retailer:well-ca",
    externalListingId: "327666",
    sourceUrl: "https://example.test/well/327666",
    productTitle: "1025 Dokdo Toner",
    brandName: "Round Lab",
    gtin: "8809657114731",
    manufacturerSku: null,
    versionCode: "current",
    releaseDate: null,
    releaseYear: null,
    formulationFingerprint: null,
    packagingEvidence: "blue 1025 Dokdo label",
    displaySize: "200 mL",
    normalizedQuantity: 200,
    normalizedUnit: "ml",
    amount: 17.99,
    nativeCurrency: "CAD",
    availabilityState: "IN_STOCK",
    availableMarkets: ["CA"],
    shipping: null,
    bundleItems: [],
    observedAt: "2026-09-12T00:00:00.000Z",
    verificationType: "RETAILER_SOURCE",
    ...overrides,
  };
}

class MemoryRepository implements IngestionRepository {
  retailers = new Map([
    ["retailer:well-ca", { id: "retailer-well", name: "Well.ca", sourceKey: "retailer:well-ca", country: "CA" }],
    ["retailer:well-us", { id: "retailer-well-us", name: "Well US", sourceKey: "retailer:well-us", country: "US" }],
  ]);
  offers: ExistingOffer[] = [];
  observations: ExistingObservation[] = [];
  writes = 0;

  async findRetailer(sourceKey: string) { return this.retailers.get(sourceKey) ?? null; }
  async findMatchCandidates() { return [candidate]; }
  async findOfferByExternalId(retailerId: string, externalListingId: string) {
    return this.offers.find((offer) => offer.retailerId === retailerId && offer.retailerListingId === externalListingId) ?? null;
  }
  async findOfferByUrl(retailerId: string, listingUrl: string) {
    return this.offers.find((offer) => offer.retailerId === retailerId && offer.listingUrl === listingUrl) ?? null;
  }
  async createOffer(data: OfferWrite) {
    this.writes += 1;
    const offer = { id: `offer-${this.offers.length + 1}`, ...data } as ExistingOffer;
    this.offers.push(offer);
    return offer;
  }
  async updateOffer(id: string, data: OfferWrite) {
    this.writes += 1;
    const index = this.offers.findIndex((offer) => offer.id === id);
    const offer = { id, ...data } as ExistingOffer;
    this.offers[index] = offer;
    return offer;
  }
  async replaceOfferItems() { this.writes += 1; }
  async findObservation(offerId: string, observedAt: Date) {
    return this.observations.find(
      (observation) => observation.offerId === offerId && observation.observedAt.getTime() === observedAt.getTime(),
    ) ?? null;
  }
  async findLegacyObservation(input: ObservationWrite) {
    return this.observations.find(
      (observation) =>
        observation.offerId === null &&
        observation.amount === input.amount &&
        observation.nativeCurrency === input.nativeCurrency &&
        observation.observedAt.getTime() === input.observedAt.getTime(),
    ) ?? null;
  }
  async linkLegacyObservation(observationId: string, offerId: string) {
    this.writes += 1;
    const observation = this.observations.find((value) => value.id === observationId)!;
    observation.offerId = offerId;
  }
  async createObservation(data: ObservationWrite) {
    this.writes += 1;
    const observation = { id: `observation-${this.observations.length + 1}`, ...data } as ExistingObservation;
    this.observations.push(observation);
    return observation;
  }
}

test("GTIN is the highest-confidence exact match and conflicting size is rejected", () => {
  const matched = matchCanonicalVariant(listing(), [candidate]);
  assert.equal(matched.status, "matched");
  if (matched.status === "matched") assert.deepEqual(matched.evidence, ["GTIN"]);

  const conflict = matchCanonicalVariant(listing({ normalizedQuantity: 500, displaySize: "500 mL" }), [candidate]);
  assert.equal(conflict.status, "rejected");
});

test("brand, product, and exact size match without requiring release or barcode evidence", () => {
  const versionMatch = matchCanonicalVariant(listing({ gtin: null }), [candidate]);
  assert.equal(versionMatch.status, "matched");

  const bioreStyleMatch = matchCanonicalVariant(
    listing({ gtin: null, versionCode: null, packagingEvidence: null }),
    [candidate],
  );
  assert.equal(bioreStyleMatch.status, "matched");
  if (bioreStyleMatch.status === "matched") {
    assert.deepEqual(bioreStyleMatch.evidence, ["brand", "product title", "exact size"]);
  }

  const unverifiedRelease = matchCanonicalVariant(
    listing({ gtin: null, versionCode: null, packagingEvidence: null, releaseDate: "2025-01-01" }),
    [candidate],
  );
  assert.equal(unverifiedRelease.status, "matched");

  const changedReleaseLabels = matchCanonicalVariant(
    listing({
      gtin: null,
      versionCode: "retailer-2025",
      releaseDate: "2025-01-01",
      releaseYear: 2025,
      packagingEvidence: "minor refreshed package",
    }),
    [candidate],
  );
  assert.equal(changedReleaseLabels.status, "matched");
});

test("conflicting identifiers remain rejected even when brand, product, and size match", () => {
  const conflict = matchCanonicalVariant(listing({ gtin: "8800000000002" }), [candidate]);
  assert.equal(conflict.status, "rejected");
});

test("same-size meaningful versions remain ambiguous without distinguishing evidence", () => {
  const otherVersion = {
    ...candidate,
    variantId: "variant-dokdo-previous-200",
    productVersionId: "version-previous",
    gtin: "8800000000002",
    versionCode: "previous",
    packagingDescription: "Previous package",
  };
  const ambiguous = matchCanonicalVariant(
    listing({ gtin: null, versionCode: null, packagingEvidence: null }),
    [candidate, otherVersion],
  );
  assert.equal(ambiguous.status, "ambiguous");

  const distinguished = matchCanonicalVariant(
    listing({ gtin: null, versionCode: "current", packagingEvidence: null }),
    [candidate, otherVersion],
  );
  assert.equal(distinguished.status, "matched");
  if (distinguished.status === "matched") assert.equal(distinguished.candidate.productVersionId, "version-current");
});

test("multiple candidates with the same exact identifier are ambiguous", () => {
  const result = matchCanonicalVariant(listing(), [
    candidate,
    { ...candidate, variantId: "variant-duplicate" },
  ]);
  assert.equal(result.status, "ambiguous");
});

test("dry-run reports planned writes but performs none", async () => {
  const repository = new MemoryRepository();
  const result = await ingestNormalizedListing(repository, listing(), { dryRun: true });
  assert.equal(result.offer.action, "created");
  assert.equal(result.observation.action, "created");
  assert.equal(repository.writes, 0);
  assert.equal(repository.offers.length, 0);
  assert.equal(repository.observations.length, 0);
});

test("identical reruns are idempotent and changed price creates exactly one new observation", async () => {
  const repository = new MemoryRepository();
  const first = await ingestNormalizedListing(repository, listing(), { dryRun: false });
  const writesAfterFirst = repository.writes;
  const second = await ingestNormalizedListing(repository, listing(), { dryRun: false });

  assert.equal(first.status, "created");
  assert.equal(second.status, "unchanged");
  assert.equal(second.observation.action, "unchanged");
  assert.equal(repository.writes, writesAfterFirst);
  assert.equal(repository.offers.length, 1);
  assert.equal(repository.observations.length, 1);

  const changed = await ingestNormalizedListing(
    repository,
    listing({
      sourceUrl: "https://example.test/well/327666-new-url",
      amount: 15.99,
      observedAt: "2026-09-13T00:00:00.000Z",
    }),
    { dryRun: false },
  );
  assert.equal(changed.status, "updated");
  assert.equal(changed.observation.action, "created");
  assert.equal(repository.offers.length, 1, "stable external ID survives a URL change");
  assert.equal(repository.observations.length, 2, "changed source timestamp adds exactly one observation");
  assert.equal(repository.offers[0]?.listingUrl, "https://example.test/well/327666-new-url");
});

test("storefront identities remain separate and served markets do not come from retailer country", async () => {
  const repository = new MemoryRepository();
  await ingestNormalizedListing(repository, listing({ availableMarkets: ["JP"] }), { dryRun: false });
  await ingestNormalizedListing(
    repository,
    listing({ sourceKey: "retailer:well-us", availableMarkets: ["CA"], sourceUrl: "https://example.test/us/327666" }),
    { dryRun: false },
  );
  assert.equal(repository.offers.length, 2);
  assert.deepEqual(repository.offers[0]?.availableMarkets, ["JP"]);
  assert.equal(repository.retailers.get("retailer:well-ca")?.country, "CA");
});

test("a matching legacy null-offer observation is linked instead of duplicated", async () => {
  const repository = new MemoryRepository();
  repository.observations.push({
    id: "legacy-observation",
    offerId: null,
    amount: 17.99,
    nativeCurrency: "CAD",
    observedAt: new Date("2026-09-12T00:00:00.000Z"),
  });
  const result = await ingestNormalizedListing(repository, listing(), { dryRun: false });
  assert.equal(result.observation.action, "linked");
  assert.equal(repository.observations.length, 1);
  assert.equal(repository.observations[0]?.offerId, repository.offers[0]?.id);
});
