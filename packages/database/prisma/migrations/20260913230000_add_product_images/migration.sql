-- CreateEnum
CREATE TYPE "ProductImageSourceType" AS ENUM ('LOCAL_CURATED', 'BRAND_APPROVED', 'RETAILER_APPROVED');

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productVersionId" TEXT NOT NULL,
    "productVariantId" TEXT,
    "url" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "sourceType" "ProductImageSourceType" NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourcePageUrl" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_productVersionId_url_key" ON "ProductImage"("productVersionId", "url");

-- CreateIndex
CREATE INDEX "ProductImage_productVersionId_isPrimary_sortOrder_idx" ON "ProductImage"("productVersionId", "isPrimary", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductImage_productVariantId_idx" ON "ProductImage"("productVariantId");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "ProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;