export type IngestionAvailabilityState =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "PREORDER"
  | "UNKNOWN";

export type IngestionShippingState =
  | "FREE"
  | "FIXED"
  | "CALCULATED"
  | "UNKNOWN"
  | "NOT_APPLICABLE"
  | "PICKUP_ONLY";

export type NormalizedOfferItem = {
  label: string;
  quantity: number;
  itemType: "SAME_PRODUCT" | "OTHER_PRODUCT" | "MINI" | "GIFT_ACCESSORY";
  isPromotional: boolean;
  relatedGtin: string | null;
};

/** Source-agnostic contract. Unknown values stay null; adapters must not guess. */
export type NormalizedSourceListing = {
  sourceKey: string;
  externalListingId: string | null;
  sourceUrl: string;
  productTitle: string;
  brandName: string | null;
  gtin: string | null;
  manufacturerSku: string | null;
  versionCode: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  formulationFingerprint: string | null;
  packagingEvidence: string | null;
  displaySize: string | null;
  normalizedQuantity: number | null;
  normalizedUnit: string | null;
  amount: number | null;
  nativeCurrency: string | null;
  availabilityState: IngestionAvailabilityState;
  availableMarkets: string[];
  shipping: {
    state: IngestionShippingState;
    amount: number | null;
    currency: string | null;
    method: string | null;
    estimate: string | null;
    conditions: string | null;
  } | null;
  bundleItems: NormalizedOfferItem[] | null;
  observedAt: string | null;
  verificationType: "RETAILER_SOURCE" | "OTHER";
};

export type MatchCandidate = {
  variantId: string;
  productFamilyId: string;
  productVersionId: string;
  productName: string;
  brandName: string;
  gtin: string | null;
  manufacturerSku: string | null;
  versionCode: string | null;
  manufacturerVersionCode: string | null;
  releaseDate: string | null;
  formulationFingerprint: string | null;
  packagingDescription: string | null;
  normalizedQuantity: number;
  normalizedUnit: string;
};

export type VariantMatchResult =
  | { status: "matched"; candidate: MatchCandidate; evidence: string[] }
  | { status: "unmatched" | "ambiguous" | "rejected"; reason: string; candidateIds: string[] };

const sourceKeyPattern = /^[a-z0-9]+:[a-z0-9]+(?:-[a-z0-9]+)*$/;
const marketPattern = /^[A-Z]{2}$/;
const currencyPattern = /^[A-Z]{3}$/;
const gtinPattern = /^\d{8,14}$/;

function normalizedText(value: string | null) {
  return value?.trim().toLocaleLowerCase("en") ?? null;
}

function normalizedCode(value: string | null) {
  return value?.trim().toLocaleUpperCase("en") ?? null;
}

function exactSize(record: NormalizedSourceListing, candidate: MatchCandidate) {
  return (
    record.normalizedQuantity !== null &&
    record.normalizedUnit !== null &&
    record.normalizedQuantity === candidate.normalizedQuantity &&
    normalizedCode(record.normalizedUnit) === normalizedCode(candidate.normalizedUnit)
  );
}

function dateYear(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getUTCFullYear();
}

function conflicts(record: NormalizedSourceListing, candidate: MatchCandidate) {
  const issues: string[] = [];
  if (record.gtin && candidate.gtin && record.gtin !== candidate.gtin) issues.push("GTIN");
  if (
    record.manufacturerSku &&
    candidate.manufacturerSku &&
    normalizedCode(record.manufacturerSku) !== normalizedCode(candidate.manufacturerSku)
  ) issues.push("manufacturer SKU");
  if (record.brandName && normalizedText(record.brandName) !== normalizedText(candidate.brandName)) {
    issues.push("brand");
  }
  if (record.normalizedQuantity !== null || record.normalizedUnit !== null) {
    if (!exactSize(record, candidate)) issues.push("exact size");
  }
  if (record.versionCode) {
    const source = normalizedCode(record.versionCode);
    if (
      source !== normalizedCode(candidate.versionCode) &&
      source !== normalizedCode(candidate.manufacturerVersionCode)
    ) issues.push("version code");
  }
  if (record.releaseDate && candidate.releaseDate) {
    const sourceDate = new Date(record.releaseDate).toISOString().slice(0, 10);
    const candidateDate = new Date(candidate.releaseDate).toISOString().slice(0, 10);
    if (sourceDate !== candidateDate) issues.push("release date");
  }
  if (record.releaseYear !== null) {
    const candidateYear = dateYear(candidate.releaseDate);
    if (candidateYear !== null && record.releaseYear !== candidateYear) issues.push("release year");
  }
  if (
    record.formulationFingerprint &&
    candidate.formulationFingerprint &&
    normalizedText(record.formulationFingerprint) !== normalizedText(candidate.formulationFingerprint)
  ) issues.push("formula fingerprint");
  if (
    record.packagingEvidence &&
    candidate.packagingDescription &&
    !normalizedText(candidate.packagingDescription)?.includes(normalizedText(record.packagingEvidence) ?? "")
  ) issues.push("packaging evidence");
  return issues;
}

const blockingConflictKinds = new Set(["GTIN", "manufacturer SKU", "brand", "exact size", "formula fingerprint"]);

function blockingConflicts(record: NormalizedSourceListing, candidate: MatchCandidate) {
  return conflicts(record, candidate).filter((issue) => blockingConflictKinds.has(issue));
}

function matchingVersionEvidence(record: NormalizedSourceListing, candidate: MatchCandidate) {
  const evidence: string[] = [];
  const sourceCode = normalizedCode(record.versionCode);
  if (
    sourceCode &&
    (sourceCode === normalizedCode(candidate.versionCode) ||
      sourceCode === normalizedCode(candidate.manufacturerVersionCode))
  ) evidence.push("version code");
  if (record.releaseDate && candidate.releaseDate) {
    const sourceDate = new Date(record.releaseDate).toISOString().slice(0, 10);
    const candidateDate = new Date(candidate.releaseDate).toISOString().slice(0, 10);
    if (sourceDate === candidateDate) evidence.push("release date");
  }
  if (record.releaseYear !== null && record.releaseYear === dateYear(candidate.releaseDate)) {
    evidence.push("release year");
  }
  if (
    record.formulationFingerprint &&
    candidate.formulationFingerprint &&
    normalizedText(record.formulationFingerprint) === normalizedText(candidate.formulationFingerprint)
  ) evidence.push("formula fingerprint");
  if (
    record.packagingEvidence &&
    candidate.packagingDescription &&
    normalizedText(candidate.packagingDescription)?.includes(normalizedText(record.packagingEvidence) ?? "")
  ) evidence.push("packaging evidence");
  return evidence;
}
export function validateNormalizedListing(record: NormalizedSourceListing): string[] {
  const errors: string[] = [];
  if (!sourceKeyPattern.test(record.sourceKey)) errors.push("sourceKey must be a lowercase namespaced slug");
  if (!/^https?:\/\/[^\s]+$/i.test(record.sourceUrl)) {
    errors.push("sourceUrl must be an absolute HTTP(S) URL");
  }
  if (!record.productTitle.trim()) errors.push("productTitle is required");
  if (record.gtin && !gtinPattern.test(record.gtin)) errors.push("gtin must contain 8 to 14 digits");
  if ((record.normalizedQuantity === null) !== (record.normalizedUnit === null)) {
    errors.push("normalizedQuantity and normalizedUnit must be provided together");
  }
  if (record.normalizedQuantity !== null && record.normalizedQuantity <= 0) {
    errors.push("normalizedQuantity must be greater than zero");
  }
  if (record.amount === null || !Number.isFinite(record.amount) || record.amount < 0) {
    errors.push("a non-negative native price is required");
  }
  if (!record.nativeCurrency || !currencyPattern.test(record.nativeCurrency)) {
    errors.push("nativeCurrency must be an uppercase ISO-style code");
  }
  if (record.shipping?.amount !== null && record.shipping && record.shipping.amount < 0) {
    errors.push("shipping amount cannot be negative");
  }
  if (record.shipping?.currency && !currencyPattern.test(record.shipping.currency)) {
    errors.push("shipping currency must be an uppercase ISO-style code");
  }
  if (record.availableMarkets.some((market) => !marketPattern.test(market))) {
    errors.push("availableMarkets entries must be uppercase two-letter market codes");
  }
  if (new Set(record.availableMarkets).size !== record.availableMarkets.length) {
    errors.push("availableMarkets cannot contain duplicates");
  }
  if (record.observedAt === null || Number.isNaN(new Date(record.observedAt).getTime())) {
    errors.push("a valid source observation timestamp is required");
  }
  if (record.releaseDate && Number.isNaN(new Date(record.releaseDate).getTime())) {
    errors.push("releaseDate must be a valid date when supplied");
  }
  return errors;
}

/**
 * Conservatively resolves one existing exact variant. Exact identifiers are
 * strongest, while an uncontradicted brand/product/exact-size match is enough
 * when it identifies one candidate. Conflicting evidence is never guessed.
 */
export function matchCanonicalVariant(
  record: NormalizedSourceListing,
  candidates: readonly MatchCandidate[],
): VariantMatchResult {
  const validationErrors = validateNormalizedListing(record);
  if (validationErrors.length > 0) {
    return { status: "rejected", reason: validationErrors.join("; "), candidateIds: [] };
  }

  const choose = (pool: MatchCandidate[], evidence: string[]): VariantMatchResult | null => {
    if (pool.length === 0) return null;
    const compatible = pool.filter((candidate) => blockingConflicts(record, candidate).length === 0);
    if (compatible.length === 1) return { status: "matched", candidate: compatible[0]!, evidence };
    if (compatible.length > 1) {
      return {
        status: "ambiguous",
        reason: `Multiple canonical variants match ${evidence.join(" + ")}`,
        candidateIds: compatible.map((candidate) => candidate.variantId).sort(),
      };
    }
    return {
      status: "rejected",
      reason: `Canonical identifier matched, but source evidence conflicts on ${[
          ...new Set(pool.flatMap((candidate) => blockingConflicts(record, candidate))),
      ].join(", ")}`,
      candidateIds: pool.map((candidate) => candidate.variantId).sort(),
    };
  };

  if (record.gtin) {
    const result = choose(candidates.filter((candidate) => candidate.gtin === record.gtin), ["GTIN"]);
    if (result) return result;
  }

  if (record.manufacturerSku) {
    const sku = normalizedCode(record.manufacturerSku);
    const result = choose(
      candidates.filter((candidate) => normalizedCode(candidate.manufacturerSku) === sku),
      ["manufacturer SKU"],
    );
    if (result) return result;
  }

  const hasExactSize = record.normalizedQuantity !== null && record.normalizedUnit !== null;
  const brandAndTitle = candidates.filter(
    (candidate) =>
      normalizedText(candidate.brandName) === normalizedText(record.brandName) &&
      normalizedText(candidate.productName) === normalizedText(record.productTitle) &&
      (!hasExactSize || exactSize(record, candidate)),
  );
  const hasVersionEvidence = Boolean(
    record.versionCode || record.releaseDate || record.releaseYear || record.formulationFingerprint || record.packagingEvidence,
  );
  const compatible = brandAndTitle.filter((candidate) => blockingConflicts(record, candidate).length === 0);
  if (hasVersionEvidence && compatible.length > 1) {
    const narrowed = compatible.filter((candidate) => matchingVersionEvidence(record, candidate).length > 0);
    if (narrowed.length === 1) {
      return {
        status: "matched",
        candidate: narrowed[0]!,
        evidence: ["brand", "product title", "version evidence", "exact size"],
      };
    }
    if (narrowed.length > 1) {
      return {
        status: "ambiguous",
        reason: "Version and size evidence still matches multiple canonical variants",
        candidateIds: narrowed.map((candidate) => candidate.variantId).sort(),
      };
    }
  }

  if (hasExactSize && compatible.length === 1) {
    return {
      status: "matched",
      candidate: compatible[0]!,
      evidence: ["brand", "product title", "exact size"],
    };
  }
  if (hasExactSize && compatible.length > 1) {
    return {
      status: "ambiguous",
      reason: "Brand, product, and exact size match multiple canonical versions",
      candidateIds: compatible.map((candidate) => candidate.variantId).sort(),
    };
  }
  if (hasExactSize && brandAndTitle.length > 0) {
    return {
      status: "rejected",
      reason: `Brand, product, and exact size matched, but source evidence conflicts on ${[
        ...new Set(brandAndTitle.flatMap((candidate) => blockingConflicts(record, candidate))),
      ].join(", ")}`,
      candidateIds: brandAndTitle.map((candidate) => candidate.variantId).sort(),
    };
  }

  return {
    status: "unmatched",
    reason: "No unique canonical variant match from exact identifiers or brand, product, and exact size",
    candidateIds: brandAndTitle.map((candidate) => candidate.variantId).sort(),
  };
}
