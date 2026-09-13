import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { prisma } from "../../packages/database/src/index.ts";
import { buildPriceHistorySeries } from "../../packages/domain/src/price-history.ts";
import { loadFixture } from "../import/adapters.ts";
import { ingestNormalizedListing } from "../import/ingestion-service.ts";
import { PrismaIngestionRepository } from "../import/prisma-ingestion-repository.ts";

class VerificationRollback extends Error {
  readonly report: Record<string, unknown>;

  constructor(report: Record<string, unknown>) {
    super("ROLLBACK_INGESTION_VERIFICATION");
    this.report = report;
  }
}

async function main() {
  const suffix = randomUUID();
  const externalListingId = `qa-ingestion-${suffix}`;
  const firstUrl = `https://example.invalid/otoku-ingestion/${suffix}`;
  const changedUrl = `${firstUrl}?revision=2`;
  const base = {
    ...(await loadFixture("well-round-lab")),
    externalListingId,
    sourceUrl: firstUrl,
    availableMarkets: ["JP"],
    amount: 17.99,
    observedAt: "2099-01-01T00:00:00.000Z",
    bundleItems: null,
  };

  let report: Record<string, unknown> = {};
  try {
    await prisma.$transaction(
      async (transaction) => {
        const repository = new PrismaIngestionRepository(transaction);
        const catalogueBefore = await Promise.all([
          transaction.brand.count(),
          transaction.productFamily.count(),
          transaction.productVersion.count(),
          transaction.productVariant.count(),
        ]);
        const stateBeforeDryRun = await Promise.all([
          transaction.offer.count(),
          transaction.priceObservation.count(),
          transaction.offerItem.count(),
        ]);
        const dryRun = await ingestNormalizedListing(repository, base, { dryRun: true });
        const stateAfterDryRun = await Promise.all([
          transaction.offer.count(),
          transaction.priceObservation.count(),
          transaction.offerItem.count(),
        ]);
        assert.deepEqual(stateAfterDryRun, stateBeforeDryRun, "dry-run must perform no writes");

        const first = await ingestNormalizedListing(repository, base, { dryRun: false });
        const second = await ingestNormalizedListing(repository, base, { dryRun: false });
        const beforeChangeCount = await transaction.priceObservation.count({
          where: { offer: { retailerListingId: externalListingId } },
        });
        const changed = await ingestNormalizedListing(
          repository,
          { ...base, sourceUrl: changedUrl, amount: 15.99, observedAt: "2099-01-02T00:00:00.000Z" },
          { dryRun: false },
        );
        const offers = await transaction.offer.findMany({
          where: { retailerListingId: externalListingId },
          include: { priceObservations: { orderBy: { observedAt: "asc" } }, retailer: true },
        });
        const catalogueAfter = await Promise.all([
          transaction.brand.count(),
          transaction.productFamily.count(),
          transaction.productVersion.count(),
          transaction.productVariant.count(),
        ]);

        assert.equal(dryRun.offer.action, "created");
        assert.equal(dryRun.observation.action, "created");
        assert.equal(first.status, "created");
        assert.equal(second.status, "unchanged");
        assert.equal(second.observation.action, "unchanged");
        assert.equal(beforeChangeCount, 1);
        assert.equal(changed.status, "updated");
        assert.equal(changed.observation.action, "created");
        assert.equal(offers.length, 1);
        assert.equal(offers[0]?.listingUrl, changedUrl);
        assert.deepEqual(offers[0]?.availableMarkets, ["JP"]);
        assert.equal(offers[0]?.retailer.country, "CA");
        assert.equal(offers[0]?.priceObservations.length, 2);
        assert.deepEqual(
          offers[0]?.priceObservations.map((observation) => Number(observation.amount)),
          [17.99, 15.99],
        );
        assert.deepEqual(catalogueAfter, catalogueBefore, "ingestion must not create catalogue identities");

        throw new VerificationRollback({
          dryRun: { plannedOffer: dryRun.offer.action, plannedObservation: dryRun.observation.action, writes: 0 },
          firstRun: { offer: first.offer.action, observation: first.observation.action },
          identicalRerun: { offer: second.offer.action, observation: second.observation.action },
          changedPriceRun: { offer: changed.offer.action, observation: changed.observation.action },
          catalogueIdentityCountsUnchanged: true,
          offerCount: offers.length,
          observationCount: offers[0]?.priceObservations.length,
          urlUpdatedOnStableExternalId: offers[0]?.listingUrl === changedUrl,
          servedMarketIndependentOfRetailerCountry:
            offers[0]?.availableMarkets[0] === "JP" && offers[0]?.retailer.country === "CA",
          rolledBack: true,
        });
      },
      { isolationLevel: "Serializable", timeout: 20_000 },
    );
  } catch (error) {
    if (!(error instanceof VerificationRollback)) throw error;
    report = error.report;
  }

  const residue = await prisma.offer.count({ where: { retailerListingId: externalListingId } });
  assert.equal(residue, 0, "verification transaction must roll back all writes");

  const legacy = await prisma.priceObservation.findFirst({
    where: { offerId: null, retailerId: { not: null }, sourceUrl: { not: null } },
    include: { retailer: true },
    orderBy: [{ observedAt: "asc" }, { id: "asc" }],
  });
  assert.ok(legacy, "expected at least one legacy null-offer observation in the current seeded database");
  const legacyOffer = await prisma.offer.findFirst({
    where: {
      productVariantId: legacy.productVariantId,
      retailerId: legacy.retailerId!,
      listingUrl: legacy.sourceUrl!,
    },
    include: { retailer: true },
  });
  assert.ok(legacyOffer, "legacy observation should still resolve through variant + retailer + source URL");
  const legacySeries = buildPriceHistorySeries({
    selectedVariantId: legacy.productVariantId,
    offers: [{
      id: legacyOffer.id,
      productVariantId: legacyOffer.productVariantId,
      retailerId: legacyOffer.retailerId,
      retailerName: legacyOffer.retailer.name,
      listingUrl: legacyOffer.listingUrl,
      amount: Number(legacyOffer.productPrice),
      nativeCurrency: legacyOffer.nativeCurrency,
      lastVerifiedAt: legacyOffer.lastVerifiedAt,
    }],
    observations: [{
      id: legacy.id,
      offerId: null,
      productVariantId: legacy.productVariantId,
      retailerId: legacy.retailerId,
      retailerName: legacy.retailer?.name ?? legacy.retailerName,
      sourceUrl: legacy.sourceUrl,
      amount: Number(legacy.amount),
      nativeCurrency: legacy.nativeCurrency,
      observedAt: legacy.observedAt,
      verificationType: legacy.verificationType,
    }],
  });
  assert.equal(legacySeries[0]?.observations[0]?.id, legacy.id);

  console.log(JSON.stringify({ ...report, cleanupResidueOffers: residue, legacyFallbackRendered: true }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());