-- Add an optional direct offer link for precise ingestion-owned price history.
-- Existing/manual observations remain valid with a null offerId.
ALTER TABLE "PriceObservation"
ADD COLUMN "offerId" TEXT;

-- A retailer's stable source listing ID identifies one offer when supplied.
-- PostgreSQL permits multiple null values in this unique index.
CREATE UNIQUE INDEX "Offer_retailerId_retailerListingId_key"
ON "Offer"("retailerId", "retailerListingId");

-- One source observation per offer and source timestamp makes reruns idempotent.
-- Legacy observations with null offerId are unaffected.
CREATE UNIQUE INDEX "PriceObservation_offerId_observedAt_key"
ON "PriceObservation"("offerId", "observedAt");

ALTER TABLE "PriceObservation"
ADD CONSTRAINT "PriceObservation_offerId_fkey"
FOREIGN KEY ("offerId") REFERENCES "Offer"("id")
ON DELETE SET NULL ON UPDATE CASCADE;