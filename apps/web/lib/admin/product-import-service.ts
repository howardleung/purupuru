import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@beauty-platform/database";
import type { Prisma } from "@beauty-platform/database";
import {
  importSourceTypes,
  productImportPayloadsEqual,
  resolveProductImportVariant,
  validateProductImportPayload,
  type ImportValidationIssue,
  type ProductImportPayload,
} from "@beauty-platform/domain/product-import";
import { runSerializable } from "../transactions";

export type ImportPlanAction = "CREATE" | "REUSE" | "UPDATE" | "DEACTIVATE" | "REACTIVATE" | "CONFLICT" | "AMBIGUOUS";
export type ImportPlanStep = {
  path: string;
  entity: "CATEGORY" | "BRAND" | "FAMILY" | "VERSION" | "VARIANT" | "IMAGE" | "BENCHMARK" | "RETAILER" | "OFFER";
  label: string;
  action: ImportPlanAction;
  existingId: string | null;
  reason: string;
};
export type ProductImportPlan = {
  schemaVersion: "1.0";
  steps: ImportPlanStep[];
  errors: ImportValidationIssue[];
  warnings: ImportValidationIssue[];
  summary: Record<ImportPlanAction, number>;
};

const batchSelect = {
  id: true, idempotencyKey: true, schemaVersion: true, sourceType: true, sourceLabel: true,
  sourceUrl: true, retrievedAt: true, submittedByClerkUserId: true, status: true,
  rawPayload: true, normalizedPayload: true, plan: true, validationErrors: true, warnings: true,
  commitResult: true, approvedByClerkUserId: true, approvedAt: true, committedAt: true,
  failureReason: true, createdAt: true, updatedAt: true,
} satisfies Prisma.ImportBatchSelect;

const batchSummarySelect = {
  id: true, idempotencyKey: true, schemaVersion: true, sourceType: true, sourceLabel: true,
  sourceUrl: true, retrievedAt: true, status: true, createdAt: true, updatedAt: true,
  approvedAt: true, committedAt: true, failureReason: true,
} satisfies Prisma.ImportBatchSelect;

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value === null ? { value: null } : value)) as Prisma.InputJsonValue;
}

export class ProductImportIdempotencyConflict extends Error {
  constructor() {
    super("This idempotency key is already associated with a different payload.");
    this.name = "ProductImportIdempotencyConflict";
  }
}

function issue(path: string, code: string, message: string): ImportValidationIssue {
  return { path, code, message };
}

function sameText(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
}

function summarize(steps: ImportPlanStep[]): ProductImportPlan["summary"] {
  return steps.reduce<ProductImportPlan["summary"]>((summary, step) => {
    summary[step.action] += 1;
    return summary;
  }, { CREATE: 0, REUSE: 0, UPDATE: 0, DEACTIVATE: 0, REACTIVATE: 0, CONFLICT: 0, AMBIGUOUS: 0 });
}

async function buildImportPlan(tx: Prisma.TransactionClient, payload: ProductImportPayload): Promise<ProductImportPlan> {
  const steps: ImportPlanStep[] = [];
  const errors: ImportValidationIssue[] = [];
  const warnings: ImportValidationIssue[] = [];
  const categorySlugs = [...new Set(payload.products.map((product) => product.family.categorySlug))];
  const brandSlugs = [...new Set(payload.products.map((product) => product.brand.slug))];
  const brandNames = [...new Set(payload.products.map((product) => product.brand.name))];
  const familySlugs = [...new Set(payload.products.map((product) => product.family.slug))];
  const gtins = payload.products.flatMap((product) => product.variants.flatMap((variant) => variant.gtin ? [variant.gtin] : []));
  const skus = payload.products.flatMap((product) => product.variants.flatMap((variant) => variant.manufacturerSku ? [variant.manufacturerSku] : []));
  const retailerKeys = payload.products.flatMap((product) => product.variants.flatMap((variant) => variant.offers.map((offer) => offer.retailer.sourceKey)));
  const retailerNames = payload.products.flatMap((product) => product.variants.flatMap((variant) => variant.offers.map((offer) => offer.retailer.name)));
  const offerExternalIds = payload.products.flatMap((product) => product.variants.flatMap((variant) => variant.offers.flatMap((offer) => offer.externalListingId ? [offer.externalListingId] : [])));
  const offerUrls = payload.products.flatMap((product) => product.variants.flatMap((variant) => variant.offers.map((offer) => offer.listingUrl)));
  const benchmarkKeys = payload.products.flatMap((product) => product.variants.flatMap((variant) => variant.benchmarks.map((benchmark) => benchmark.sourceKey)));
  const imageUrls = payload.products.flatMap((product) => [
    ...product.version.images.map((image) => image.url),
    ...product.variants.flatMap((variant) => variant.images.map((image) => image.url)),
  ]);
  const [categories, brands, families, variants, retailers, offers, benchmarks, images] = await Promise.all([
    tx.canonicalCategory.findMany({ where: { slug: { in: categorySlugs }, isActive: true } }),
    tx.brand.findMany({ where: { OR: [{ slug: { in: brandSlugs } }, { name: { in: brandNames, mode: "insensitive" } }] } }),
    tx.productFamily.findMany({ where: { slug: { in: familySlugs } }, include: { brand: true, primaryCanonicalCategory: true, versions: true } }),
    tx.productVariant.findMany({
      where: { OR: [
        ...(gtins.length ? [{ gtin: { in: gtins } }] : []),
        ...(skus.length ? [{ manufacturerSku: { in: skus, mode: "insensitive" as const } }] : []),
        { productVersion: { productFamily: { slug: { in: familySlugs } } } },
      ] },
      include: { productVersion: { include: { productFamily: true } } },
    }),
    tx.retailer.findMany({ where: { OR: [{ sourceKey: { in: retailerKeys } }, { name: { in: retailerNames, mode: "insensitive" } }] } }),
    tx.offer.findMany({ where: { OR: [
      ...(offerExternalIds.length ? [{ retailerListingId: { in: offerExternalIds } }] : []),
      ...(offerUrls.length ? [{ listingUrl: { in: offerUrls } }] : []),
    ] }, include: { retailer: true } }),
    tx.benchmarkPrice.findMany({ where: { sourceKey: { in: benchmarkKeys }, productVariant: { productVersion: { productFamily: { slug: { in: familySlugs } } } } } }),
    tx.productImage.findMany({ where: { url: { in: imageUrls }, productVersion: { productFamily: { slug: { in: familySlugs } } } } }),
  ]);

  for (const [productIndex, product] of payload.products.entries()) {
    const path = `$.products[${productIndex}]`;
    const category = categories.find((item) => item.slug === product.family.categorySlug);
    steps.push({ path: `${path}.family.categorySlug`, entity: "CATEGORY", label: product.family.categorySlug,
      action: category ? "REUSE" : "CONFLICT", existingId: category?.id ?? null,
      reason: category ? "Exact active canonical category slug." : "Canonical categories are curated and are never created by imports." });
    if (!category) errors.push(issue(`${path}.family.categorySlug`, "UNKNOWN_CATEGORY", "No active canonical category has this slug."));

    const brandMatches = brands.filter((item) => item.slug === product.brand.slug || sameText(item.name, product.brand.name));
    const brandIds = new Set(brandMatches.map((item) => item.id));
    const brand = brandMatches[0];
    let brandAction: ImportPlanAction = brand ? "REUSE" : "CREATE";
    if (brandIds.size > 1) brandAction = "AMBIGUOUS";
    else if (brand && (brand.slug !== product.brand.slug || !sameText(brand.name, product.brand.name))) brandAction = "CONFLICT";
    steps.push({ path: `${path}.brand`, entity: "BRAND", label: product.brand.name, action: brandAction,
      existingId: brandIds.size === 1 ? brand?.id ?? null : null, reason: brand ? "Exact brand slug or name evidence." : "No exact brand exists." });
    if (brandAction === "AMBIGUOUS" || brandAction === "CONFLICT") errors.push(issue(`${path}.brand`, `BRAND_${brandAction}`, "Brand slug and name do not resolve to one consistent record."));

    const family = families.find((item) => item.slug === product.family.slug);
    let familyAction: ImportPlanAction = family ? "REUSE" : "CREATE";
    if (family && (family.brand.slug !== product.brand.slug || family.primaryCanonicalCategory.slug !== product.family.categorySlug || !sameText(family.canonicalName, product.family.canonicalName))) {
      familyAction = "CONFLICT";
      errors.push(issue(`${path}.family`, "FAMILY_IDENTITY_CONFLICT", "Existing family differs in brand, category, or canonical name."));
    }
    steps.push({ path: `${path}.family`, entity: "FAMILY", label: product.family.canonicalName, action: familyAction,
      existingId: family?.id ?? null, reason: family ? "Exact family slug." : "No exact family slug exists." });

    const versionMatches = family?.versions.filter((item) => item.versionName === product.version.versionName ||
      Boolean(product.version.versionCode && item.versionCode === product.version.versionCode) ||
      Boolean(product.version.manufacturerVersionCode && item.manufacturerVersionCode === product.version.manufacturerVersionCode)) ?? [];
    const versionIds = new Set(versionMatches.map((item) => item.id));
    const version = versionMatches[0];
    let versionAction: ImportPlanAction = version ? "REUSE" : "CREATE";
    if (versionIds.size > 1) versionAction = "AMBIGUOUS";
    else if (version && (version.versionName !== product.version.versionName ||
      Boolean(version.versionCode && product.version.versionCode && version.versionCode !== product.version.versionCode) ||
      Boolean(version.manufacturerVersionCode && product.version.manufacturerVersionCode && version.manufacturerVersionCode !== product.version.manufacturerVersionCode))) versionAction = "CONFLICT";
    if (versionAction === "AMBIGUOUS" || versionAction === "CONFLICT") errors.push(issue(`${path}.version`, `VERSION_${versionAction}`, "Version evidence is not one consistent identity."));
    steps.push({ path: `${path}.version`, entity: "VERSION", label: product.version.versionName, action: versionAction,
      existingId: versionIds.size === 1 ? version?.id ?? null : null, reason: version ? "Exact version evidence." : "No exact version exists." });

    for (const [imageIndex, image] of product.version.images.entries()) {
      const existing = version ? images.find((item) => item.productVersionId === version.id && item.url === image.url) : undefined;
      steps.push({ path: `${path}.version.images[${imageIndex}]`, entity: "IMAGE", label: image.url,
        action: existing ? "UPDATE" : "CREATE", existingId: existing?.id ?? null,
        reason: existing ? "Exact version and source URL." : "No image with this URL exists on the version." });
    }

    for (const [variantIndex, incoming] of product.variants.entries()) {
      const variantPath = `${path}.variants[${variantIndex}]`;
      const resolution = resolveProductImportVariant({
        gtin: incoming.gtin, manufacturerSku: incoming.manufacturerSku,
        normalizedQuantity: incoming.normalizedQuantity, normalizedUnit: incoming.normalizedUnit,
        expectedVersionId: version?.id ?? null, expectedFamilySlug: product.family.slug,
        expectedBrandId: brand?.id ?? null,
      }, variants.map((candidate) => ({ id: candidate.id, productVersionId: candidate.productVersionId,
        productFamilySlug: candidate.productVersion.productFamily.slug, brandId: candidate.productVersion.productFamily.brandId,
        normalizedQuantity: Number(candidate.normalizedQuantity), normalizedUnit: candidate.normalizedUnit,
        gtin: candidate.gtin, manufacturerSku: candidate.manufacturerSku })));
      const candidate = resolution.existingId ? variants.find((item) => item.id === resolution.existingId) : undefined;
      const action: ImportPlanAction = resolution.status;
      if (action === "AMBIGUOUS" || action === "CONFLICT") errors.push(issue(variantPath, `VARIANT_${action}`, "Variant evidence conflicts or resolves to multiple records."));
      steps.push({ path: variantPath, entity: "VARIANT", label: incoming.displaySize, action,
        existingId: resolution.existingId, reason: candidate ? "GTIN, scoped SKU, or exact version size matched." : "No exact variant identity exists." });

      for (const [imageIndex, image] of incoming.images.entries()) {
        const existing = version ? images.find((item) => item.productVersionId === version.id && item.url === image.url) : undefined;
        steps.push({ path: `${variantPath}.images[${imageIndex}]`, entity: "IMAGE", label: image.url,
          action: existing ? "UPDATE" : "CREATE", existingId: existing?.id ?? null,
          reason: existing ? "Exact version and source URL." : "No image with this URL exists on the version." });
      }
      for (const [benchmarkIndex, benchmark] of incoming.benchmarks.entries()) {
        const existing = candidate ? benchmarks.find((item) => item.productVariantId === candidate.id && item.market === benchmark.market &&
          item.type === benchmark.type && item.sourceKey === benchmark.sourceKey && item.verifiedAt.getTime() === new Date(benchmark.verifiedAt).getTime()) : undefined;
        let benchmarkAction: ImportPlanAction = existing ? "REUSE" : "CREATE";
        if (existing && (Number(existing.amount) !== benchmark.amount || existing.nativeCurrency !== benchmark.nativeCurrency || existing.sourceUrl !== benchmark.sourceUrl)) benchmarkAction = "CONFLICT";
        if (benchmarkAction === "CONFLICT") errors.push(issue(`${variantPath}.benchmarks[${benchmarkIndex}]`, "BENCHMARK_CONFLICT", "The same benchmark identity has different facts."));
        steps.push({ path: `${variantPath}.benchmarks[${benchmarkIndex}]`, entity: "BENCHMARK", label: `${benchmark.market} ${benchmark.type}`,
          action: benchmarkAction, existingId: existing?.id ?? null,
          reason: existing ? "Exact variant, market, type, source, and verification time." : "No exact benchmark identity exists." });
      }

      for (const [offerIndex, offer] of incoming.offers.entries()) {
        const offerPath = `${variantPath}.offers[${offerIndex}]`;
        const matches = retailers.filter((item) => item.sourceKey === offer.retailer.sourceKey || sameText(item.name, offer.retailer.name));
        const ids = new Set(matches.map((item) => item.id));
        const retailer = matches[0];
        let retailerAction: ImportPlanAction = retailer ? "REUSE" : "CREATE";
        if (ids.size > 1) retailerAction = "AMBIGUOUS";
        else if (retailer && (retailer.sourceKey !== offer.retailer.sourceKey || !sameText(retailer.name, offer.retailer.name))) retailerAction = "CONFLICT";
        steps.push({ path: `${offerPath}.retailer`, entity: "RETAILER", label: offer.retailer.name, action: retailerAction,
          existingId: ids.size === 1 ? retailer?.id ?? null : null, reason: retailer ? "Exact retailer key or name." : "No exact retailer exists." });
        if (retailerAction === "AMBIGUOUS" || retailerAction === "CONFLICT") errors.push(issue(`${offerPath}.retailer`, `RETAILER_${retailerAction}`, "Retailer key and name do not resolve consistently."));
        const byId = retailer && offer.externalListingId ? offers.find((item) => item.retailerId === retailer.id && item.retailerListingId === offer.externalListingId) : undefined;
        const byUrl = retailer ? offers.find((item) => item.retailerId === retailer.id && item.listingUrl === offer.listingUrl) : undefined;
        const existingOffer = byId ?? byUrl;
        let offerAction: ImportPlanAction = existingOffer ? "UPDATE" : "CREATE";
        const identityConflict = Boolean((byId && byUrl && byId.id !== byUrl.id) ||
          (existingOffer && (!candidate || existingOffer.productVariantId !== candidate.id || existingOffer.nativeCurrency !== offer.nativeCurrency)));
        if (identityConflict) {
          offerAction = "CONFLICT";
          errors.push(issue(offerPath, "OFFER_IDENTITY_CONFLICT", "Offer identifiers conflict with each other, its exact variant, or native currency."));
        } else if (!offer.isActive) {
          if (!existingOffer) {
            offerAction = "CONFLICT";
            errors.push(issue(offerPath, "OFFER_DEACTIVATION_NOT_FOUND", "Offer deactivation requires an exact existing retailer/listing or retailer/URL match."));
          } else {
            offerAction = "DEACTIVATE";
            warnings.push(issue(offerPath, "OFFER_DEACTIVATION_REQUIRES_REVIEW", `Existing offer ${existingOffer.id} will be soft-deactivated.`));
          }
        } else if (existingOffer && !existingOffer.isActive) {
          offerAction = "REACTIVATE";
        }
        steps.push({ path: offerPath, entity: "OFFER", label: offer.externalListingId ?? offer.listingUrl,
          action: offerAction, existingId: existingOffer?.id ?? null,
          reason: offerAction === "DEACTIVATE" ? "Exact existing offer will be soft-deactivated; catalogue identity and history remain intact."
            : offerAction === "REACTIVATE" ? "Exact existing inactive offer will be reactivated."
            : offer.externalListingId ? "Identity uses retailer plus external listing ID." : "Fallback identity uses retailer, exact variant, and URL." });
      }
    }
  }
  return { schemaVersion: "1.0", steps, errors, warnings, summary: summarize(steps) };
}

function metadataFor(input: unknown, valid: ProductImportPayload | null) {
  if (valid) return { idempotencyKey: valid.idempotencyKey, schemaVersion: valid.schemaVersion,
    sourceType: valid.source.type, sourceLabel: valid.source.label, sourceUrl: valid.source.url,
    retrievedAt: new Date(valid.source.retrievedAt) };
  const record = typeof input === "object" && input !== null ? input as Record<string, unknown> : {};
  const source = typeof record.source === "object" && record.source !== null ? record.source as Record<string, unknown> : {};
  const sourceType = typeof source.type === "string" && importSourceTypes.includes(source.type as (typeof importSourceTypes)[number])
    ? source.type as (typeof importSourceTypes)[number] : "OTHER";
  const rawDate = typeof source.retrievedAt === "string" ? new Date(source.retrievedAt) : new Date(0);
  return {
    idempotencyKey: typeof record.idempotencyKey === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(record.idempotencyKey.trim()) ? record.idempotencyKey.trim() : `invalid:${randomUUID()}`,
    schemaVersion: typeof record.schemaVersion === "string" ? record.schemaVersion.slice(0, 32) : "unknown",
    sourceType,
    sourceLabel: typeof source.label === "string" && source.label.trim() ? source.label.trim().slice(0, 200) : "Invalid import payload",
    sourceUrl: typeof source.url === "string" && /^https?:\/\//i.test(source.url) ? source.url.slice(0, 2048) : null,
    retrievedAt: Number.isNaN(rawDate.getTime()) ? new Date(0) : rawDate,
  };
}

export async function stageProductImport(input: unknown, clerkUserId: string) {
  const validation = validateProductImportPayload(input);
  const metadata = metadataFor(input, validation.ok ? validation.value : null);
  try {
    return await runSerializable(async (tx) => {
      const existing = await tx.importBatch.findUnique({ where: { idempotencyKey: metadata.idempotencyKey }, select: batchSelect });
      if (existing) {
        if (!productImportPayloadsEqual(existing.rawPayload, input)) throw new ProductImportIdempotencyConflict();
        return { batch: existing, replayed: true };
      }
      const created = await tx.importBatch.create({ data: { ...metadata, submittedByClerkUserId: clerkUserId,
        rawPayload: jsonValue(input), status: "PENDING" }, select: { id: true } });
      if (!validation.ok) {
        const batch = await tx.importBatch.update({ where: { id: created.id }, data: { status: "REJECTED",
          validationErrors: jsonValue(validation.errors), warnings: jsonValue(validation.warnings) }, select: batchSelect });
        return { batch, replayed: false };
      }
      const plan = await buildImportPlan(tx, validation.value);
      const warnings = [...validation.warnings, ...plan.warnings];
      const batch = await tx.importBatch.update({ where: { id: created.id }, data: {
        status: plan.errors.length || warnings.length ? "NEEDS_REVIEW" : "VALIDATED",
        normalizedPayload: jsonValue(validation.value), plan: jsonValue(plan),
        validationErrors: jsonValue(plan.errors), warnings: jsonValue(warnings),
      }, select: batchSelect });
      return { batch, replayed: false };
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      const batch = await prisma.importBatch.findUnique({ where: { idempotencyKey: metadata.idempotencyKey }, select: batchSelect });
      if (batch) {
        if (!productImportPayloadsEqual(batch.rawPayload, input)) throw new ProductImportIdempotencyConflict();
        return { batch, replayed: true };
      }
    }
    throw error;
  }
}

class ImportConflictError extends Error {}

function assertCompatible(actual: string | null, expected: string | null, message: string) {
  if (actual && expected && actual !== expected) throw new ImportConflictError(message);
}

export async function commitValidatedProductImportGraph(tx: Prisma.TransactionClient, payload: ProductImportPayload) {
  const committedProducts: Array<{ familyId: string; versionId: string; variantIds: string[] }> = [];
  for (const product of payload.products) {
    const category = await tx.canonicalCategory.findFirst({ where: { slug: product.family.categorySlug, isActive: true } });
    if (!category) throw new ImportConflictError(`Unknown canonical category: ${product.family.categorySlug}.`);
    const [brandBySlug, brandByName] = await Promise.all([
      tx.brand.findUnique({ where: { slug: product.brand.slug } }),
      tx.brand.findFirst({ where: { name: { equals: product.brand.name, mode: "insensitive" } } }),
    ]);
    if (brandBySlug && brandByName && brandBySlug.id !== brandByName.id) throw new ImportConflictError(`Ambiguous brand: ${product.brand.name}.`);
    let brand = brandBySlug ?? brandByName;
    if (brand && (brand.slug !== product.brand.slug || !sameText(brand.name, product.brand.name))) throw new ImportConflictError(`Brand identity conflict: ${product.brand.name}.`);
    brand ??= await tx.brand.create({ data: { name: product.brand.name, slug: product.brand.slug,
      originMarket: product.brand.originMarket, aliases: product.brand.aliases } });

    let family = await tx.productFamily.findUnique({ where: { slug: product.family.slug } });
    if (family && (family.brandId !== brand.id || family.primaryCanonicalCategoryId !== category.id || !sameText(family.canonicalName, product.family.canonicalName))) {
      throw new ImportConflictError(`Product family identity conflict: ${product.family.slug}.`);
    }
    family ??= await tx.productFamily.create({ data: { brandId: brand.id, primaryCanonicalCategoryId: category.id,
      canonicalName: product.family.canonicalName, slug: product.family.slug, originMarket: product.family.originMarket,
      commonEnglishAliases: product.family.commonEnglishAliases } });

    const versionMatches = await tx.productVersion.findMany({ where: { productFamilyId: family.id, OR: [
      { versionName: product.version.versionName },
      ...(product.version.versionCode ? [{ versionCode: product.version.versionCode }] : []),
      ...(product.version.manufacturerVersionCode ? [{ manufacturerVersionCode: product.version.manufacturerVersionCode }] : []),
    ] } });
    if (new Set(versionMatches.map((item) => item.id)).size > 1) throw new ImportConflictError(`Ambiguous version: ${product.version.versionName}.`);
    let version = versionMatches[0];
    if (version) {
      if (version.versionName !== product.version.versionName) throw new ImportConflictError(`Version name conflict: ${product.version.versionName}.`);
      assertCompatible(version.versionCode, product.version.versionCode, "Version code conflicts with the existing record.");
      assertCompatible(version.manufacturerVersionCode, product.version.manufacturerVersionCode, "Manufacturer version code conflicts with the existing record.");
    } else {
      version = await tx.productVersion.create({ data: { productFamilyId: family.id, versionName: product.version.versionName,
        versionCode: product.version.versionCode, releaseDate: product.version.releaseDate ? new Date(product.version.releaseDate) : null,
        status: product.version.status, manufacturerVersionCode: product.version.manufacturerVersionCode,
        formulationFingerprint: product.version.formulationFingerprint, packagingDescription: product.version.packagingDescription } });
    }

    const variantIds: string[] = [];
    let requestedDefaultId: string | null = null;
    for (const incoming of product.variants) {
      const matches = await tx.productVariant.findMany({ where: { OR: [
        ...(incoming.gtin ? [{ gtin: incoming.gtin }] : []),
        ...(incoming.manufacturerSku ? [{ manufacturerSku: { equals: incoming.manufacturerSku, mode: "insensitive" as const },
          productVersion: { productFamily: { brandId: brand.id } } }] : []),
        { productVersionId: version.id, normalizedQuantity: incoming.normalizedQuantity, normalizedUnit: incoming.normalizedUnit },
      ] } });
      if (new Set(matches.map((item) => item.id)).size > 1) throw new ImportConflictError(`Ambiguous variant: ${incoming.displaySize}.`);
      let variant = matches[0];
      if (variant && (variant.productVersionId !== version.id || Number(variant.normalizedQuantity) !== incoming.normalizedQuantity || variant.normalizedUnit !== incoming.normalizedUnit)) {
        throw new ImportConflictError(`Variant identity conflict: ${incoming.displaySize}.`);
      }
      if (variant) {
        assertCompatible(variant.gtin, incoming.gtin, "GTIN conflicts with the existing variant.");
        assertCompatible(variant.manufacturerSku, incoming.manufacturerSku, "Manufacturer SKU conflicts with the existing variant.");
      } else {
        variant = await tx.productVariant.create({ data: { productVersionId: version.id, displaySize: incoming.displaySize,
          normalizedQuantity: incoming.normalizedQuantity, normalizedUnit: incoming.normalizedUnit,
          gtin: incoming.gtin, manufacturerSku: incoming.manufacturerSku } });
      }
      variantIds.push(variant.id);
      if (incoming.isDefault) requestedDefaultId = variant.id;

      for (const image of incoming.images) {
        await tx.productImage.upsert({ where: { productVersionId_url: { productVersionId: version.id, url: image.url } },
          create: { productVersionId: version.id, productVariantId: variant.id, url: image.url, altText: image.altText,
            sourceType: image.sourceType, sourceName: image.sourceName, sourcePageUrl: image.sourcePageUrl,
            isPrimary: image.isPrimary, sortOrder: image.sortOrder },
          update: { productVariantId: variant.id, altText: image.altText, sourceType: image.sourceType,
            sourceName: image.sourceName, sourcePageUrl: image.sourcePageUrl, isPrimary: image.isPrimary, sortOrder: image.sortOrder } });
      }
      for (const benchmark of incoming.benchmarks) {
        const exactIdentity = { productVariantId: variant.id, market: benchmark.market, type: benchmark.type,
          sourceKey: benchmark.sourceKey, verifiedAt: new Date(benchmark.verifiedAt) };
        const existing = await tx.benchmarkPrice.findFirst({ where: exactIdentity });
        if (existing && (Number(existing.amount) !== benchmark.amount || existing.nativeCurrency !== benchmark.nativeCurrency || existing.sourceUrl !== benchmark.sourceUrl)) {
          throw new ImportConflictError(`Benchmark collision for ${incoming.displaySize} from ${benchmark.sourceKey}.`);
        }
        if (!existing) await tx.benchmarkPrice.create({ data: { ...exactIdentity, amount: benchmark.amount,
          nativeCurrency: benchmark.nativeCurrency, sourceDisplayName: benchmark.sourceDisplayName, sourceUrl: benchmark.sourceUrl,
          observedAt: benchmark.observedAt ? new Date(benchmark.observedAt) : null } });
      }
      for (const incomingOffer of incoming.offers) {
        const [retailerByKey, retailerByName] = await Promise.all([
          tx.retailer.findUnique({ where: { sourceKey: incomingOffer.retailer.sourceKey } }),
          tx.retailer.findFirst({ where: { name: { equals: incomingOffer.retailer.name, mode: "insensitive" } } }),
        ]);
        if (retailerByKey && retailerByName && retailerByKey.id !== retailerByName.id) throw new ImportConflictError(`Ambiguous retailer: ${incomingOffer.retailer.name}.`);
        let retailer = retailerByKey ?? retailerByName;
        if (retailer && (retailer.sourceKey !== incomingOffer.retailer.sourceKey || !sameText(retailer.name, incomingOffer.retailer.name))) {
          throw new ImportConflictError(`Retailer identity conflict: ${incomingOffer.retailer.name}.`);
        }
        retailer ??= await tx.retailer.create({ data: { sourceKey: incomingOffer.retailer.sourceKey,
          name: incomingOffer.retailer.name, country: incomingOffer.retailer.country, websiteUrl: incomingOffer.retailer.websiteUrl } });
        const [byListingId, byUrl] = await Promise.all([
          incomingOffer.externalListingId ? tx.offer.findUnique({ where: { retailerId_retailerListingId: {
            retailerId: retailer.id, retailerListingId: incomingOffer.externalListingId } } }) : null,
          tx.offer.findUnique({ where: { retailerId_listingUrl: { retailerId: retailer.id, listingUrl: incomingOffer.listingUrl } } }),
        ]);
        if (byListingId && byUrl && byListingId.id !== byUrl.id) throw new ImportConflictError(`Offer identifiers conflict at ${retailer.name}.`);
        let offer = byListingId ?? byUrl;
        if (offer && (offer.productVariantId !== variant.id || offer.nativeCurrency !== incomingOffer.nativeCurrency)) {
          throw new ImportConflictError(`Offer identity conflicts with its exact variant or native currency at ${retailer.name}.`);
        }
        if (!incomingOffer.isActive) {
          if (!offer) throw new ImportConflictError(`Offer deactivation requires an exact existing offer at ${retailer.name}.`);
          await tx.offer.update({ where: { id: offer.id }, data: { isActive: false } });
          continue;
        }
        const observedAt = new Date(incomingOffer.observedAt);
        const offerData = { retailerId: retailer.id, productVariantId: variant.id,
          retailerListingId: incomingOffer.externalListingId, listingUrl: incomingOffer.listingUrl,
          isActive: true,
          productPrice: incomingOffer.productPrice, nativeCurrency: incomingOffer.nativeCurrency,
          availableMarkets: incomingOffer.availableMarkets, availabilityState: incomingOffer.availabilityState,
          shippingState: incomingOffer.shipping?.state ?? null, shippingAmount: incomingOffer.shipping?.amount ?? null,
          shippingCurrency: incomingOffer.shipping?.currency ?? null, deliveryMethod: incomingOffer.shipping?.method ?? null,
          deliveryEstimate: incomingOffer.shipping?.estimate ?? null, shippingConditions: incomingOffer.shipping?.conditions ?? null,
          observedAt, lastVerifiedAt: new Date(incomingOffer.provenance.verifiedAt ?? incomingOffer.provenance.retrievedAt) };
        if (!offer) offer = await tx.offer.create({ data: offerData });
        else if (observedAt >= offer.observedAt) {
          const priceChanged = Number(offer.productPrice) !== incomingOffer.productPrice;
          offer = await tx.offer.update({ where: { id: offer.id }, data: { ...offerData,
            ...(priceChanged ? { cadConvertedPrice: null, cadFxTimestamp: null } : {}) } });
        }
        await tx.offerItem.deleteMany({ where: { offerId: offer.id } });
        for (const item of incomingOffer.items) {
          const related = item.relatedGtin ? await tx.productVariant.findUnique({ where: { gtin: item.relatedGtin }, select: { id: true } }) : null;
          await tx.offerItem.create({ data: { offerId: offer.id, relatedProductVariantId: related?.id ?? null,
            label: item.label, quantity: item.quantity, itemType: item.itemType, isPromotional: item.isPromotional } });
        }
        const observation = await tx.priceObservation.findUnique({ where: { offerId_observedAt: { offerId: offer.id, observedAt } } });
        if (observation && (Number(observation.amount) !== incomingOffer.productPrice || observation.nativeCurrency !== incomingOffer.nativeCurrency)) {
          throw new ImportConflictError(`Price observation collision at ${retailer.name} on ${incomingOffer.observedAt}.`);
        }
        if (!observation) {
          const legacy = await tx.priceObservation.findFirst({ where: { offerId: null, productVariantId: variant.id,
            retailerId: retailer.id, amount: incomingOffer.productPrice, nativeCurrency: incomingOffer.nativeCurrency,
            observedAt, sourceUrl: incomingOffer.listingUrl }, orderBy: { id: "asc" } });
          if (legacy) await tx.priceObservation.update({ where: { id: legacy.id }, data: { offerId: offer.id } });
          else await tx.priceObservation.create({ data: { offerId: offer.id, productVariantId: variant.id,
            retailerId: retailer.id, retailerName: retailer.name, amount: incomingOffer.productPrice,
            nativeCurrency: incomingOffer.nativeCurrency, observedAt, verificationType: "RETAILER_SOURCE",
            sourceUrl: incomingOffer.listingUrl, proofUrl: incomingOffer.provenance.sourceUrl } });
        }
      }
    }

    for (const image of product.version.images) {
      await tx.productImage.upsert({ where: { productVersionId_url: { productVersionId: version.id, url: image.url } },
        create: { productVersionId: version.id, url: image.url, altText: image.altText, sourceType: image.sourceType,
          sourceName: image.sourceName, sourcePageUrl: image.sourcePageUrl, isPrimary: image.isPrimary, sortOrder: image.sortOrder },
        update: { altText: image.altText, sourceType: image.sourceType, sourceName: image.sourceName,
          sourcePageUrl: image.sourcePageUrl, isPrimary: image.isPrimary, sortOrder: image.sortOrder } });
    }
    const defaultVariantId = requestedDefaultId ?? (version.defaultVariantId ? null : variantIds[0] ?? null);
    if (defaultVariantId) await tx.productVersion.update({ where: { id: version.id }, data: { defaultVariantId } });
    if (product.version.status === "CURRENT" && !family.currentVersionId) {
      await tx.productFamily.update({ where: { id: family.id }, data: { currentVersionId: version.id } });
    }
    committedProducts.push({ familyId: family.id, versionId: version.id, variantIds });
  }
  return { products: committedProducts };
}

export async function commitProductImport(batchId: string, clerkUserId: string) {
  try {
    return await runSerializable(async (tx) => {
      const batch = await tx.importBatch.findUnique({ where: { id: batchId }, select: batchSelect });
      if (!batch) return { status: "NOT_FOUND" as const, batch: null };
      if (batch.status === "COMMITTED") return { status: "COMMITTED" as const, batch };
      if (!(["VALIDATED", "NEEDS_REVIEW", "APPROVED"] as string[]).includes(batch.status)) {
        return { status: "INVALID_STATUS" as const, batch };
      }
      const validation = validateProductImportPayload(batch.normalizedPayload ?? batch.rawPayload);
      if (!validation.ok) throw new ImportConflictError("The staged payload no longer satisfies schema version 1.0.");
      const plan = await buildImportPlan(tx, validation.value);
      if (plan.errors.length) throw new ImportConflictError(plan.errors.map((item) => item.message).join(" "));
      await tx.importBatch.update({ where: { id: batch.id }, data: { status: "APPROVED",
        approvedByClerkUserId: clerkUserId, approvedAt: new Date(), plan: jsonValue(plan) } });
      const result = await commitValidatedProductImportGraph(tx, validation.value);
      const committed = await tx.importBatch.update({ where: { id: batch.id }, data: { status: "COMMITTED",
        committedAt: new Date(), commitResult: jsonValue(result), failureReason: null }, select: batchSelect });
      return { status: "COMMITTED" as const, batch: committed };
    });
  } catch (error) {
    if (error instanceof ImportConflictError) {
      const batch = await prisma.importBatch.update({ where: { id: batchId }, data: { status: "NEEDS_REVIEW",
        failureReason: error.message }, select: batchSelect });
      return { status: "CONFLICT" as const, batch };
    }
    await prisma.importBatch.update({ where: { id: batchId }, data: { status: "FAILED",
      failureReason: "Commit failed without persisting catalogue changes." } }).catch(() => undefined);
    throw error;
  }
}

export function rejectProductImport(batchId: string, clerkUserId: string) {
  return prisma.importBatch.updateMany({ where: { id: batchId,
    status: { in: ["PENDING", "VALIDATED", "NEEDS_REVIEW", "APPROVED"] } },
    data: { status: "REJECTED", approvedByClerkUserId: clerkUserId,
      approvedAt: new Date(), failureReason: "Rejected by an administrator." } });
}

export function listProductImports() {
  return prisma.importBatch.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: batchSummarySelect });
}

export function getProductImport(id: string) {
  return prisma.importBatch.findUnique({ where: { id }, select: batchSelect });
}
