-- Add offer-specific purchasing markets so storefront eligibility is not inferred from retailer headquarters.
ALTER TABLE "Offer"
ADD COLUMN "availableMarkets" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
