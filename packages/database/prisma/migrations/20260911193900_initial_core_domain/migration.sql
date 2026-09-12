-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProductVersionStatus" AS ENUM ('CURRENT', 'PREVIOUS', 'DISCONTINUED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AvailabilityState" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'PREORDER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ShippingState" AS ENUM ('FREE', 'FIXED', 'CALCULATED', 'UNKNOWN', 'NOT_APPLICABLE', 'PICKUP_ONLY');

-- CreateEnum
CREATE TYPE "OfferItemType" AS ENUM ('SAME_PRODUCT', 'OTHER_PRODUCT', 'MINI', 'GIFT_ACCESSORY');

-- CreateEnum
CREATE TYPE "BenchmarkPriceType" AS ENUM ('MSRP', 'RETAIL_PRICE', 'REFERENCE_PRICE');

-- CreateEnum
CREATE TYPE "PriceObservationVerificationType" AS ENUM ('RETAILER_SOURCE', 'RECEIPT_VERIFIED', 'COMMUNITY_REPORTED', 'OTHER');

-- CreateEnum
CREATE TYPE "CollectionTagKind" AS ENUM ('HOLY_GRAIL', 'WOULD_REPURCHASE');

-- CreateEnum
CREATE TYPE "PurchaseSource" AS ENUM ('MANUAL', 'SHOPPING_LIST', 'RECEIPT');

-- CreateEnum
CREATE TYPE "SkinType" AS ENUM ('DRY', 'OILY', 'COMBINATION', 'NORMAL', 'SENSITIVE', 'NOT_SURE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "skinType" "SkinType",
    "skinTypeVisibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "beautyInterests" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'SKINCARE',
    "parentCategoryId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceCategoryMapping" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "sourceCategoryPath" TEXT NOT NULL,
    "retailerId" TEXT,
    "canonicalCategoryId" TEXT NOT NULL,
    "confidence" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceCategoryMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "originMarket" TEXT,
    "logoUrl" TEXT,
    "aliases" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFamily" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "primaryCanonicalCategoryId" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "originMarket" TEXT,
    "commonEnglishAliases" TEXT[],
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVersion" (
    "id" TEXT NOT NULL,
    "productFamilyId" TEXT NOT NULL,
    "versionName" TEXT NOT NULL,
    "versionCode" TEXT,
    "releaseDate" TIMESTAMP(3),
    "status" "ProductVersionStatus" NOT NULL DEFAULT 'UNKNOWN',
    "manufacturerVersionCode" TEXT,
    "formulationFingerprint" TEXT,
    "packagingDescription" TEXT,
    "defaultVariantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productVersionId" TEXT NOT NULL,
    "normalizedQuantity" DECIMAL(12,3) NOT NULL,
    "normalizedUnit" TEXT NOT NULL,
    "displaySize" TEXT NOT NULL,
    "gtin" TEXT,
    "manufacturerSku" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Retailer" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "websiteUrl" TEXT,
    "isAffiliatePartner" BOOLEAN NOT NULL DEFAULT false,
    "reliabilityNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Retailer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "retailerListingId" TEXT,
    "listingUrl" TEXT NOT NULL,
    "productPrice" DECIMAL(14,4) NOT NULL,
    "nativeCurrency" CHAR(3) NOT NULL,
    "cadConvertedPrice" DECIMAL(14,4),
    "cadFxTimestamp" TIMESTAMP(3),
    "availabilityState" "AvailabilityState" NOT NULL DEFAULT 'UNKNOWN',
    "shippingState" "ShippingState",
    "shippingAmount" DECIMAL(14,4),
    "shippingCurrency" CHAR(3),
    "deliveryMethod" TEXT,
    "deliveryEstimate" TEXT,
    "shippingConditions" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "primaryQuantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferItem" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "relatedProductVariantId" TEXT,
    "label" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "itemType" "OfferItemType" NOT NULL,
    "isPromotional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceObservation" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "retailerId" TEXT,
    "retailerName" TEXT,
    "location" TEXT,
    "amount" DECIMAL(14,4) NOT NULL,
    "nativeCurrency" CHAR(3) NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "verificationType" "PriceObservationVerificationType" NOT NULL,
    "sourceUrl" TEXT,
    "proofUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkPrice" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "type" "BenchmarkPriceType" NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "nativeCurrency" CHAR(3) NOT NULL,
    "cadConvertedAmount" DECIMAL(14,4),
    "cadFxTimestamp" TIMESTAMP(3),
    "sourceKey" TEXT NOT NULL,
    "sourceDisplayName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "observedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BenchmarkPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalSignal" (
    "id" TEXT NOT NULL,
    "productVersionId" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "sourceDisplayName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "rating" DECIMAL(6,2),
    "ratingScale" DECIMAL(6,2),
    "reviewCount" INTEGER,
    "rankingLabel" TEXT,
    "observedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productVersionId" TEXT NOT NULL,
    "selectedVariantId" TEXT,
    "wants" BOOLEAN NOT NULL DEFAULT false,
    "tried" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionTag" (
    "id" TEXT NOT NULL,
    "collectionEntryId" TEXT NOT NULL,
    "kind" "CollectionTagKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productVersionId" TEXT NOT NULL,
    "contextualVariantId" TEXT,
    "ratingHalfSteps" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseInstance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "shoppingListItemId" TEXT,
    "retailerId" TEXT,
    "customRetailer" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "purchaseDate" TIMESTAMP(3),
    "location" TEXT,
    "amountPaid" DECIMAL(14,4),
    "currency" CHAR(3),
    "openedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "source" "PurchaseSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetMarket" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL,
    "shoppingListId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "purchasedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalCategory_slug_key" ON "CanonicalCategory"("slug");

-- CreateIndex
CREATE INDEX "CanonicalCategory_parentCategoryId_sortOrder_idx" ON "CanonicalCategory"("parentCategoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "SourceCategoryMapping_retailerId_idx" ON "SourceCategoryMapping"("retailerId");

-- CreateIndex
CREATE INDEX "SourceCategoryMapping_canonicalCategoryId_idx" ON "SourceCategoryMapping"("canonicalCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceCategoryMapping_sourceKey_sourceCategoryPath_key" ON "SourceCategoryMapping"("sourceKey", "sourceCategoryPath");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFamily_slug_key" ON "ProductFamily"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFamily_currentVersionId_key" ON "ProductFamily"("currentVersionId");

-- CreateIndex
CREATE INDEX "ProductFamily_brandId_idx" ON "ProductFamily"("brandId");

-- CreateIndex
CREATE INDEX "ProductFamily_primaryCanonicalCategoryId_idx" ON "ProductFamily"("primaryCanonicalCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVersion_defaultVariantId_key" ON "ProductVersion"("defaultVariantId");

-- CreateIndex
CREATE INDEX "ProductVersion_productFamilyId_status_idx" ON "ProductVersion"("productFamilyId", "status");

-- CreateIndex
CREATE INDEX "ProductVersion_manufacturerVersionCode_idx" ON "ProductVersion"("manufacturerVersionCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVersion_productFamilyId_versionName_key" ON "ProductVersion"("productFamilyId", "versionName");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_gtin_key" ON "ProductVariant"("gtin");

-- CreateIndex
CREATE INDEX "ProductVariant_manufacturerSku_idx" ON "ProductVariant"("manufacturerSku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productVersionId_normalizedQuantity_normaliz_key" ON "ProductVariant"("productVersionId", "normalizedQuantity", "normalizedUnit");

-- CreateIndex
CREATE UNIQUE INDEX "Retailer_sourceKey_key" ON "Retailer"("sourceKey");

-- CreateIndex
CREATE UNIQUE INDEX "Retailer_name_key" ON "Retailer"("name");

-- CreateIndex
CREATE INDEX "Offer_productVariantId_availabilityState_idx" ON "Offer"("productVariantId", "availabilityState");

-- CreateIndex
CREATE INDEX "Offer_retailerId_retailerListingId_idx" ON "Offer"("retailerId", "retailerListingId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_retailerId_listingUrl_key" ON "Offer"("retailerId", "listingUrl");

-- CreateIndex
CREATE INDEX "OfferItem_offerId_idx" ON "OfferItem"("offerId");

-- CreateIndex
CREATE INDEX "OfferItem_relatedProductVariantId_idx" ON "OfferItem"("relatedProductVariantId");

-- CreateIndex
CREATE INDEX "PriceObservation_productVariantId_observedAt_idx" ON "PriceObservation"("productVariantId", "observedAt");

-- CreateIndex
CREATE INDEX "PriceObservation_retailerId_idx" ON "PriceObservation"("retailerId");

-- CreateIndex
CREATE INDEX "BenchmarkPrice_productVariantId_market_type_verifiedAt_idx" ON "BenchmarkPrice"("productVariantId", "market", "type", "verifiedAt");

-- CreateIndex
CREATE INDEX "ExternalSignal_productVersionId_idx" ON "ExternalSignal"("productVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalSignal_productVersionId_sourceKey_verifiedAt_key" ON "ExternalSignal"("productVersionId", "sourceKey", "verifiedAt");

-- CreateIndex
CREATE INDEX "CollectionEntry_userId_wants_idx" ON "CollectionEntry"("userId", "wants");

-- CreateIndex
CREATE INDEX "CollectionEntry_userId_tried_idx" ON "CollectionEntry"("userId", "tried");

-- CreateIndex
CREATE INDEX "CollectionEntry_selectedVariantId_idx" ON "CollectionEntry"("selectedVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionEntry_userId_productVersionId_key" ON "CollectionEntry"("userId", "productVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionTag_collectionEntryId_kind_key" ON "CollectionTag"("collectionEntryId", "kind");

-- CreateIndex
CREATE INDEX "UserRating_contextualVariantId_idx" ON "UserRating"("contextualVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRating_userId_productVersionId_key" ON "UserRating"("userId", "productVersionId");

-- CreateIndex
CREATE INDEX "PurchaseInstance_userId_productVariantId_idx" ON "PurchaseInstance"("userId", "productVariantId");

-- CreateIndex
CREATE INDEX "PurchaseInstance_shoppingListItemId_idx" ON "PurchaseInstance"("shoppingListItemId");

-- CreateIndex
CREATE INDEX "ShoppingList_userId_updatedAt_idx" ON "ShoppingList"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ShoppingListItem_productVariantId_idx" ON "ShoppingListItem"("productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingListItem_shoppingListId_productVariantId_key" ON "ShoppingListItem"("shoppingListId", "productVariantId");

-- AddForeignKey
ALTER TABLE "CanonicalCategory" ADD CONSTRAINT "CanonicalCategory_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "CanonicalCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceCategoryMapping" ADD CONSTRAINT "SourceCategoryMapping_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceCategoryMapping" ADD CONSTRAINT "SourceCategoryMapping_canonicalCategoryId_fkey" FOREIGN KEY ("canonicalCategoryId") REFERENCES "CanonicalCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFamily" ADD CONSTRAINT "ProductFamily_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFamily" ADD CONSTRAINT "ProductFamily_primaryCanonicalCategoryId_fkey" FOREIGN KEY ("primaryCanonicalCategoryId") REFERENCES "CanonicalCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFamily" ADD CONSTRAINT "ProductFamily_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "ProductVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_productFamilyId_fkey" FOREIGN KEY ("productFamilyId") REFERENCES "ProductFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_defaultVariantId_fkey" FOREIGN KEY ("defaultVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "ProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferItem" ADD CONSTRAINT "OfferItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferItem" ADD CONSTRAINT "OfferItem_relatedProductVariantId_fkey" FOREIGN KEY ("relatedProductVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceObservation" ADD CONSTRAINT "PriceObservation_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceObservation" ADD CONSTRAINT "PriceObservation_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkPrice" ADD CONSTRAINT "BenchmarkPrice_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalSignal" ADD CONSTRAINT "ExternalSignal_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "ProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionEntry" ADD CONSTRAINT "CollectionEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionEntry" ADD CONSTRAINT "CollectionEntry_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "ProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionEntry" ADD CONSTRAINT "CollectionEntry_selectedVariantId_fkey" FOREIGN KEY ("selectedVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionTag" ADD CONSTRAINT "CollectionTag_collectionEntryId_fkey" FOREIGN KEY ("collectionEntryId") REFERENCES "CollectionEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "ProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_contextualVariantId_fkey" FOREIGN KEY ("contextualVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInstance" ADD CONSTRAINT "PurchaseInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInstance" ADD CONSTRAINT "PurchaseInstance_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInstance" ADD CONSTRAINT "PurchaseInstance_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInstance" ADD CONSTRAINT "PurchaseInstance_shoppingListItemId_fkey" FOREIGN KEY ("shoppingListItemId") REFERENCES "ShoppingListItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enforce documented local quantity and rating bounds that Prisma schema syntax cannot express.
ALTER TABLE "UserRating"
  ADD CONSTRAINT "user_rating_half_steps_range"
  CHECK ("ratingHalfSteps" BETWEEN 2 AND 10);

ALTER TABLE "ShoppingListItem"
  ADD CONSTRAINT "shopping_list_item_quantity_positive"
  CHECK ("quantity" >= 1),
  ADD CONSTRAINT "shopping_list_item_purchased_quantity_nonnegative"
  CHECK ("purchasedQuantity" >= 0),
  ADD CONSTRAINT "shopping_list_item_purchased_quantity_lte_quantity"
  CHECK ("purchasedQuantity" <= "quantity");

ALTER TABLE "PurchaseInstance"
  ADD CONSTRAINT "purchase_instance_quantity_positive"
  CHECK ("quantity" >= 1);

