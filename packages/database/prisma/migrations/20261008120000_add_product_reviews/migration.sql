-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productFamilyId" TEXT NOT NULL,
    "productVersionId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "skinTypeSnapshot" "SkinType",
    "sensitiveSkinSnapshot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "review_rating_range" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX "Review_userId_productFamilyId_key" ON "Review"("userId", "productFamilyId");
CREATE INDEX "Review_productFamilyId_createdAt_idx" ON "Review"("productFamilyId", "createdAt");
CREATE INDEX "Review_productVariantId_idx" ON "Review"("productVariantId");
CREATE INDEX "Review_productVersionId_idx" ON "Review"("productVersionId");

ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_productFamilyId_fkey" FOREIGN KEY ("productFamilyId") REFERENCES "ProductFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "ProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
