-- Additive only: legacy Collection, purchases, ratings, reviews and lists are untouched.
CREATE TABLE "ProductLike" (
    "userId" TEXT NOT NULL,
    "productVersionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductLike_pkey" PRIMARY KEY ("userId", "productVersionId")
);
CREATE INDEX "ProductLike_userId_createdAt_idx" ON "ProductLike"("userId", "createdAt");
CREATE INDEX "ProductLike_productVersionId_idx" ON "ProductLike"("productVersionId");
ALTER TABLE "ProductLike" ADD CONSTRAINT "ProductLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductLike" ADD CONSTRAINT "ProductLike_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "ProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
