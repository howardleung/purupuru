-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('PENDING', 'VALIDATED', 'NEEDS_REVIEW', 'APPROVED', 'COMMITTED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ImportSourceType" AS ENUM ('CHATGPT_WORK', 'JSON', 'CSV', 'AFFILIATE_FEED', 'RETAILER_API', 'MANUAL_CORRECTION', 'OTHER');

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "sourceType" "ImportSourceType" NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "submittedByClerkUserId" TEXT NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'PENDING',
    "rawPayload" JSONB NOT NULL,
    "normalizedPayload" JSONB,
    "plan" JSONB,
    "validationErrors" JSONB,
    "warnings" JSONB,
    "commitResult" JSONB,
    "approvedByClerkUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "committedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_idempotencyKey_key" ON "ImportBatch"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ImportBatch_status_createdAt_idx" ON "ImportBatch"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ImportBatch_submittedByClerkUserId_createdAt_idx" ON "ImportBatch"("submittedByClerkUserId", "createdAt");
