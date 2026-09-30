export const PRODUCT_IMPORT_SCHEMA_VERSION = "1.0" as const;

export const importSourceTypes = [
  "CHATGPT_WORK", "JSON", "CSV", "AFFILIATE_FEED", "RETAILER_API", "MANUAL_CORRECTION", "OTHER",
] as const;
export type ProductImportSourceType = (typeof importSourceTypes)[number];

export const verificationStatuses = ["VERIFIED", "UNVERIFIED", "CONFLICTING"] as const;
export type ImportVerificationStatus = (typeof verificationStatuses)[number];

export type ImportProvenance = {
  sourceUrl: string;
  sourceType: "MANUFACTURER" | "RETAILER" | "EDITORIAL" | "OTHER";
  retrievedAt: string;
  verifiedAt: string | null;
  verificationStatus: ImportVerificationStatus;
  notes: string | null;
};

export type ProductImportImage = {
  url: string;
  altText: string;
  sourceType: "LOCAL_CURATED" | "BRAND_APPROVED" | "RETAILER_APPROVED";
  sourceName: string;
  sourcePageUrl: string | null;
  isPrimary: boolean;
  sortOrder: number;
  provenance: ImportProvenance;
};

export type ProductImportBenchmark = {
  market: string;
  type: "MSRP" | "RETAIL_PRICE" | "REFERENCE_PRICE";
  amount: number;
  nativeCurrency: string;
  sourceKey: string;
  sourceDisplayName: string;
  sourceUrl: string;
  observedAt: string | null;
  verifiedAt: string;
  provenance: ImportProvenance;
};

export type ProductImportOfferItem = {
  label: string;
  quantity: number;
  itemType: "SAME_PRODUCT" | "OTHER_PRODUCT" | "MINI" | "GIFT_ACCESSORY";
  isPromotional: boolean;
  relatedGtin: string | null;
};

export type ProductImportOffer = {
  retailer: {
    sourceKey: string;
    name: string;
    country: string | null;
    websiteUrl: string | null;
  };
  externalListingId: string | null;
  listingUrl: string;
  isActive: boolean;
  productPrice: number;
  nativeCurrency: string;
  availableMarkets: string[];
  availabilityState: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER" | "UNKNOWN";
  observedAt: string;
  shipping: {
    state: "FREE" | "FIXED" | "CALCULATED" | "UNKNOWN" | "NOT_APPLICABLE" | "PICKUP_ONLY";
    amount: number | null;
    currency: string | null;
    method: string | null;
    estimate: string | null;
    conditions: string | null;
  } | null;
  items: ProductImportOfferItem[];
  provenance: ImportProvenance;
};

export type ProductImportVariant = {
  displaySize: string;
  normalizedQuantity: number;
  normalizedUnit: string;
  gtin: string | null;
  manufacturerSku: string | null;
  isDefault: boolean;
  provenance: ImportProvenance;
  images: ProductImportImage[];
  benchmarks: ProductImportBenchmark[];
  offers: ProductImportOffer[];
};

export type ProductImportProduct = {
  brand: { name: string; slug: string; originMarket: string | null; aliases: string[] };
  family: {
    canonicalName: string;
    slug: string;
    categorySlug: string;
    originMarket: string | null;
    commonEnglishAliases: string[];
  };
  version: {
    versionName: string;
    versionCode: string | null;
    releaseDate: string | null;
    status: "CURRENT" | "PREVIOUS" | "DISCONTINUED" | "UNKNOWN";
    manufacturerVersionCode: string | null;
    formulationFingerprint: string | null;
    packagingDescription: string | null;
    provenance: ImportProvenance;
    images: ProductImportImage[];
  };
  variants: ProductImportVariant[];
};

export type ProductImportPayload = {
  schemaVersion: typeof PRODUCT_IMPORT_SCHEMA_VERSION;
  idempotencyKey: string;
  source: {
    type: ProductImportSourceType;
    label: string;
    url: string | null;
    retrievedAt: string;
    notes: string | null;
  };
  products: ProductImportProduct[];
};

export type ImportValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type ProductImportValidation =
  | { ok: true; value: ProductImportPayload; errors: []; warnings: ImportValidationIssue[] }
  | { ok: false; value: null; errors: ImportValidationIssue[]; warnings: ImportValidationIssue[] };

export type ProductImportVariantCandidate = {
  id: string;
  productVersionId: string;
  productFamilySlug: string;
  brandId: string;
  normalizedQuantity: number;
  normalizedUnit: string;
  gtin: string | null;
  manufacturerSku: string | null;
};

export type ProductImportVariantResolution =
  | { status: "CREATE"; existingId: null }
  | { status: "REUSE"; existingId: string }
  | { status: "AMBIGUOUS" | "CONFLICT"; existingId: null };

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

export function productImportPayloadsEqual(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

export function resolveProductImportVariant(input: {
  gtin: string | null;
  manufacturerSku: string | null;
  normalizedQuantity: number;
  normalizedUnit: string;
  expectedVersionId: string | null;
  expectedFamilySlug: string;
  expectedBrandId: string | null;
}, candidates: readonly ProductImportVariantCandidate[]): ProductImportVariantResolution {
  const identifierMatches = candidates.filter((candidate) =>
    Boolean(input.gtin && candidate.gtin === input.gtin) ||
    Boolean(input.expectedBrandId && input.manufacturerSku && candidate.brandId === input.expectedBrandId &&
      candidate.manufacturerSku?.toLowerCase() === input.manufacturerSku.toLowerCase()));
  const identifierIds = new Set(identifierMatches.map((candidate) => candidate.id));
  if (identifierIds.size > 1) return { status: "AMBIGUOUS", existingId: null };
  const identifierCandidate = identifierMatches[0];
  if (identifierCandidate) {
    if (
      (input.expectedVersionId ? identifierCandidate.productVersionId !== input.expectedVersionId : identifierCandidate.productFamilySlug !== input.expectedFamilySlug) ||
      identifierCandidate.normalizedQuantity !== input.normalizedQuantity || identifierCandidate.normalizedUnit !== input.normalizedUnit
    ) return { status: "CONFLICT", existingId: null };
    return { status: "REUSE", existingId: identifierCandidate.id };
  }

  const sizeMatches = candidates.filter((candidate) =>
    (input.expectedVersionId ? candidate.productVersionId === input.expectedVersionId : candidate.productFamilySlug === input.expectedFamilySlug) &&
    candidate.normalizedQuantity === input.normalizedQuantity && candidate.normalizedUnit === input.normalizedUnit);
  const compatible = sizeMatches.filter((candidate) =>
    (!input.gtin || !candidate.gtin || candidate.gtin === input.gtin) &&
    (!input.manufacturerSku || !candidate.manufacturerSku || candidate.manufacturerSku.toLowerCase() === input.manufacturerSku.toLowerCase()));
  const ids = new Set(compatible.map((candidate) => candidate.id));
  if (ids.size > 1) return { status: "AMBIGUOUS", existingId: null };
  const candidate = compatible[0];
  if (!candidate && sizeMatches.length > 0) return { status: "CONFLICT", existingId: null };
  if (!candidate) return { status: "CREATE", existingId: null };
  if (
    (input.expectedVersionId ? candidate.productVersionId !== input.expectedVersionId : candidate.productFamilySlug !== input.expectedFamilySlug) ||
    candidate.normalizedQuantity !== input.normalizedQuantity || candidate.normalizedUnit !== input.normalizedUnit) {
    return { status: "CONFLICT", existingId: null };
  }
  return { status: "REUSE", existingId: candidate.id };
}

const sourceKeyPattern = /^[a-z0-9]+:[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const idempotencyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const gtinPattern = /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/;
const currencyPattern = /^[A-Z]{3}$/;
const marketPattern = /^[A-Z]{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function issue(path: string, code: string, message: string): ImportValidationIssue {
  return { path, code, message };
}

function rejectUnknown(record: Record<string, unknown>, allowed: readonly string[], path: string, errors: ImportValidationIssue[]) {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) errors.push(issue(`${path}.${key}`, "UNKNOWN_FIELD", "This field is not part of schema version 1.0."));
  }
}

function stringValue(
  record: Record<string, unknown>, key: string, path: string, errors: ImportValidationIssue[],
  maximum = 500,
) {
  const value = record[key];
  if (typeof value !== "string" || cleanText(value).length === 0 || value.length > maximum) {
    errors.push(issue(`${path}.${key}`, "INVALID_STRING", `Must be a non-empty string of at most ${maximum} characters.`));
    return "";
  }
  return cleanText(value);
}

function nullableString(
  record: Record<string, unknown>, key: string, path: string, errors: ImportValidationIssue[],
  maximum = 1000,
) {
  const value = record[key];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > maximum) {
    errors.push(issue(`${path}.${key}`, "INVALID_STRING", `Must be null or a string of at most ${maximum} characters.`));
    return null;
  }
  return cleanText(value);
}

function enumValue<T extends string>(
  record: Record<string, unknown>, key: string, allowed: readonly T[], path: string,
  errors: ImportValidationIssue[], fallback: T,
) {
  const value = record[key];
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    errors.push(issue(`${path}.${key}`, "INVALID_ENUM", `Must be one of: ${allowed.join(", ")}.`));
    return fallback;
  }
  return value as T;
}

function booleanValue(record: Record<string, unknown>, key: string, path: string, errors: ImportValidationIssue[]) {
  const value = record[key];
  if (typeof value !== "boolean") {
    errors.push(issue(`${path}.${key}`, "INVALID_BOOLEAN", "Must be a boolean."));
    return false;
  }
  return value;
}

function numberValue(
  record: Record<string, unknown>, key: string, path: string, errors: ImportValidationIssue[],
  options: { positive?: boolean; integer?: boolean } = {},
) {
  const value = record[key];
  const valid = typeof value === "number" && Number.isFinite(value) &&
    (options.positive ? value > 0 : value >= 0) && (!options.integer || Number.isSafeInteger(value));
  if (!valid) {
    errors.push(issue(`${path}.${key}`, "INVALID_NUMBER", options.positive ? "Must be a positive number." : "Must be a non-negative number."));
    return 0;
  }
  return value;
}

function dateValue(value: string | null, path: string, errors: ImportValidationIssue[], required = true) {
  if (!value) {
    if (required) errors.push(issue(path, "INVALID_DATE", "A valid ISO date or timestamp is required."));
    return null;
  }
  const isoPattern = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2}))?$/;
  const date = new Date(value);
  if (!isoPattern.test(value) || Number.isNaN(date.getTime())) {
    errors.push(issue(path, "INVALID_DATE", "Must be a valid ISO date or timestamp."));
    return null;
  }
  return date.toISOString();
}

function urlValue(value: string | null, path: string, errors: ImportValidationIssue[], required = true) {
  if (!value) {
    if (required) errors.push(issue(path, "INVALID_URL", "An absolute HTTP(S) URL is required."));
    return null;
  }
  const UrlConstructor = (globalThis as unknown as { URL?: new (input: string) => {
    protocol: string; username: string; password: string; hostname: string; href: string;
  } }).URL;
  try {
    if (!UrlConstructor || value.length > 2048) throw new Error("URL parser unavailable");
    const parsed = new UrlConstructor(value);
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || !parsed.hostname) throw new Error("Unsafe URL");
    return parsed.href;
  } catch {
    errors.push(issue(path, "INVALID_URL", "Must be an absolute HTTP(S) URL without embedded credentials."));
    return null;
  }
}

function provenanceValue(value: unknown, path: string, errors: ImportValidationIssue[], warnings: ImportValidationIssue[]): ImportProvenance {
  if (!isRecord(value)) {
    errors.push(issue(path, "INVALID_PROVENANCE", "Provenance is required."));
    value = {};
  }
  const record = value as Record<string, unknown>;
  rejectUnknown(record, ["sourceUrl", "sourceType", "retrievedAt", "verifiedAt", "verificationStatus", "notes"], path, errors);
  const sourceUrl = urlValue(nullableString(record, "sourceUrl", path, errors, 2048), `${path}.sourceUrl`, errors) ?? "";
  const sourceType = enumValue(record, "sourceType", ["MANUFACTURER", "RETAILER", "EDITORIAL", "OTHER"] as const, path, errors, "OTHER");
  const retrievedAt = dateValue(nullableString(record, "retrievedAt", path, errors, 64), `${path}.retrievedAt`, errors) ?? "";
  const rawVerifiedAt = nullableString(record, "verifiedAt", path, errors, 64);
  const verifiedAt = dateValue(rawVerifiedAt, `${path}.verifiedAt`, errors, false);
  const verificationStatus = enumValue(record, "verificationStatus", verificationStatuses, path, errors, "UNVERIFIED");
  const notes = nullableString(record, "notes", path, errors, 2000);
  if (verificationStatus !== "VERIFIED") {
    warnings.push(issue(path, "UNVERIFIED_SOURCE", "This fact requires explicit review before commit."));
  }
  if (verificationStatus === "VERIFIED" && !verifiedAt) {
    errors.push(issue(`${path}.verifiedAt`, "MISSING_VERIFIED_AT", "Verified provenance requires verifiedAt."));
  }
  return { sourceUrl, sourceType, retrievedAt, verifiedAt, verificationStatus, notes };
}

function stringArray(value: unknown, path: string, errors: ImportValidationIssue[], maximum = 20) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > maximum || value.some((item) => typeof item !== "string" || item.length > 200)) {
    errors.push(issue(path, "INVALID_ARRAY", `Must be an array of at most ${maximum} short strings.`));
    return [];
  }
  return [...new Set(value.map((item) => cleanText(item as string)).filter(Boolean))];
}

function imageValue(value: unknown, path: string, errors: ImportValidationIssue[], warnings: ImportValidationIssue[]): ProductImportImage {
  const record = isRecord(value) ? value : {};
  if (!isRecord(value)) errors.push(issue(path, "INVALID_IMAGE", "Image must be an object."));
  rejectUnknown(record, ["url", "altText", "sourceType", "sourceName", "sourcePageUrl", "isPrimary", "sortOrder", "provenance"], path, errors);
  return {
    url: urlValue(nullableString(record, "url", path, errors, 2048), `${path}.url`, errors) ?? "",
    altText: stringValue(record, "altText", path, errors, 500),
    sourceType: enumValue(record, "sourceType", ["LOCAL_CURATED", "BRAND_APPROVED", "RETAILER_APPROVED"] as const, path, errors, "LOCAL_CURATED"),
    sourceName: stringValue(record, "sourceName", path, errors, 200),
    sourcePageUrl: urlValue(nullableString(record, "sourcePageUrl", path, errors, 2048), `${path}.sourcePageUrl`, errors, false),
    isPrimary: booleanValue(record, "isPrimary", path, errors),
    sortOrder: numberValue(record, "sortOrder", path, errors, { integer: true }),
    provenance: provenanceValue(record.provenance, `${path}.provenance`, errors, warnings),
  };
}

function benchmarkValue(value: unknown, path: string, errors: ImportValidationIssue[], warnings: ImportValidationIssue[]): ProductImportBenchmark {
  const record = isRecord(value) ? value : {};
  if (!isRecord(value)) errors.push(issue(path, "INVALID_BENCHMARK", "Benchmark must be an object."));
  rejectUnknown(record, ["market", "type", "amount", "nativeCurrency", "sourceKey", "sourceDisplayName", "sourceUrl", "observedAt", "verifiedAt", "provenance"], path, errors);
  const market = stringValue(record, "market", path, errors, 2).toUpperCase();
  if (!marketPattern.test(market)) errors.push(issue(`${path}.market`, "INVALID_MARKET", "Must be an uppercase two-letter market code."));
  const nativeCurrency = stringValue(record, "nativeCurrency", path, errors, 3).toUpperCase();
  if (!currencyPattern.test(nativeCurrency)) errors.push(issue(`${path}.nativeCurrency`, "INVALID_CURRENCY", "Must be an uppercase three-letter currency code."));
  const sourceUrl = urlValue(nullableString(record, "sourceUrl", path, errors, 2048), `${path}.sourceUrl`, errors) ?? "";
  const sourceKey = stringValue(record, "sourceKey", path, errors, 128).toLowerCase();
  if (!sourceKeyPattern.test(sourceKey)) {
    errors.push(issue(`${path}.sourceKey`, "INVALID_SOURCE_KEY", "Must be a lowercase namespaced slug."));
  }
  return {
    market,
    type: enumValue(record, "type", ["MSRP", "RETAIL_PRICE", "REFERENCE_PRICE"] as const, path, errors, "REFERENCE_PRICE"),
    amount: numberValue(record, "amount", path, errors, { positive: true }),
    nativeCurrency,
    sourceKey,
    sourceDisplayName: stringValue(record, "sourceDisplayName", path, errors, 200),
    sourceUrl,
    observedAt: dateValue(nullableString(record, "observedAt", path, errors, 64), `${path}.observedAt`, errors, false),
    verifiedAt: dateValue(nullableString(record, "verifiedAt", path, errors, 64), `${path}.verifiedAt`, errors) ?? "",
    provenance: provenanceValue(record.provenance, `${path}.provenance`, errors, warnings),
  };
}

function offerValue(value: unknown, path: string, errors: ImportValidationIssue[], warnings: ImportValidationIssue[]): ProductImportOffer {
  const record = isRecord(value) ? value : {};
  if (!isRecord(value)) errors.push(issue(path, "INVALID_OFFER", "Offer must be an object."));
  rejectUnknown(record, ["retailer", "externalListingId", "listingUrl", "isActive", "productPrice", "nativeCurrency", "availableMarkets", "availabilityState", "observedAt", "shipping", "items", "provenance"], path, errors);
  const retailerRecord = isRecord(record.retailer) ? record.retailer : {};
  if (!isRecord(record.retailer)) errors.push(issue(`${path}.retailer`, "INVALID_RETAILER", "Retailer must be an object."));
  rejectUnknown(retailerRecord, ["sourceKey", "name", "country", "websiteUrl"], `${path}.retailer`, errors);
  const sourceKey = stringValue(retailerRecord, "sourceKey", `${path}.retailer`, errors, 128).toLowerCase();
  if (!sourceKeyPattern.test(sourceKey)) errors.push(issue(`${path}.retailer.sourceKey`, "INVALID_SOURCE_KEY", "Must be a lowercase namespaced slug."));
  const currency = stringValue(record, "nativeCurrency", path, errors, 3).toUpperCase();
  if (!currencyPattern.test(currency)) errors.push(issue(`${path}.nativeCurrency`, "INVALID_CURRENCY", "Must be an uppercase three-letter currency code."));
  const markets = stringArray(record.availableMarkets, `${path}.availableMarkets`, errors, 50).map((market) => market.toUpperCase());
  if (markets.some((market) => !marketPattern.test(market))) errors.push(issue(`${path}.availableMarkets`, "INVALID_MARKET", "Every market must be a two-letter code."));
  const shippingRecord = record.shipping === null || record.shipping === undefined ? null : isRecord(record.shipping) ? record.shipping : {};
  if (record.shipping !== null && record.shipping !== undefined && !isRecord(record.shipping)) {
    errors.push(issue(`${path}.shipping`, "INVALID_SHIPPING", "Shipping must be null or an object."));
  }
  const itemsRaw = Array.isArray(record.items) ? record.items : [];
  if (record.items !== undefined && !Array.isArray(record.items)) errors.push(issue(`${path}.items`, "INVALID_ARRAY", "Items must be an array."));
  const items = itemsRaw.map((item, index) => {
    const itemRecord = isRecord(item) ? item : {};
    if (!isRecord(item)) errors.push(issue(`${path}.items[${index}]`, "INVALID_ITEM", "Offer item must be an object."));
    rejectUnknown(itemRecord, ["label", "quantity", "itemType", "isPromotional", "relatedGtin"], `${path}.items[${index}]`, errors);
    const related = nullableString(itemRecord, "relatedGtin", `${path}.items[${index}]`, errors, 14)?.replace(/[\s-]/g, "") ?? null;
    if (related && !gtinPattern.test(related)) errors.push(issue(`${path}.items[${index}].relatedGtin`, "INVALID_GTIN", "Must be a GTIN containing 8, 12, 13, or 14 digits."));
    return {
      label: stringValue(itemRecord, "label", `${path}.items[${index}]`, errors, 300),
      quantity: numberValue(itemRecord, "quantity", `${path}.items[${index}]`, errors, { positive: true, integer: true }),
      itemType: enumValue(itemRecord, "itemType", ["SAME_PRODUCT", "OTHER_PRODUCT", "MINI", "GIFT_ACCESSORY"] as const, `${path}.items[${index}]`, errors, "OTHER_PRODUCT"),
      isPromotional: booleanValue(itemRecord, "isPromotional", `${path}.items[${index}]`, errors),
      relatedGtin: related,
    };
  });
  let shipping: ProductImportOffer["shipping"] = null;
  if (shippingRecord) {
    rejectUnknown(shippingRecord, ["state", "amount", "currency", "method", "estimate", "conditions"], `${path}.shipping`, errors);
    const shippingCurrency = nullableString(shippingRecord, "currency", `${path}.shipping`, errors, 3)?.toUpperCase() ?? null;
    if (shippingCurrency && !currencyPattern.test(shippingCurrency)) errors.push(issue(`${path}.shipping.currency`, "INVALID_CURRENCY", "Must be an uppercase three-letter currency code."));
    const amount = shippingRecord.amount === null || shippingRecord.amount === undefined
      ? null : numberValue(shippingRecord, "amount", `${path}.shipping`, errors);
    if ((amount === null) !== (shippingCurrency === null)) {
      errors.push(issue(`${path}.shipping`, "INCOMPLETE_SHIPPING_PRICE", "Shipping amount and currency must be supplied together."));
    }
    shipping = {
      state: enumValue(shippingRecord, "state", ["FREE", "FIXED", "CALCULATED", "UNKNOWN", "NOT_APPLICABLE", "PICKUP_ONLY"] as const, `${path}.shipping`, errors, "UNKNOWN"),
      amount,
      currency: shippingCurrency,
      method: nullableString(shippingRecord, "method", `${path}.shipping`, errors, 200),
      estimate: nullableString(shippingRecord, "estimate", `${path}.shipping`, errors, 200),
      conditions: nullableString(shippingRecord, "conditions", `${path}.shipping`, errors, 1000),
    };
  }
  const retailerCountry = nullableString(retailerRecord, "country", `${path}.retailer`, errors, 2)?.toUpperCase() ?? null;
  if (retailerCountry && !marketPattern.test(retailerCountry)) {
    errors.push(issue(`${path}.retailer.country`, "INVALID_MARKET", "Must be a two-letter country code."));
  }
  return {
    retailer: {
      sourceKey,
      name: stringValue(retailerRecord, "name", `${path}.retailer`, errors, 200),
      country: retailerCountry,
      websiteUrl: urlValue(nullableString(retailerRecord, "websiteUrl", `${path}.retailer`, errors, 2048), `${path}.retailer.websiteUrl`, errors, false),
    },
    externalListingId: nullableString(record, "externalListingId", path, errors, 200),
    listingUrl: urlValue(nullableString(record, "listingUrl", path, errors, 2048), `${path}.listingUrl`, errors) ?? "",
    isActive: record.isActive === undefined ? true : booleanValue(record, "isActive", path, errors),
    productPrice: numberValue(record, "productPrice", path, errors),
    nativeCurrency: currency,
    availableMarkets: [...new Set(markets)].sort(),
    availabilityState: enumValue(record, "availabilityState", ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "PREORDER", "UNKNOWN"] as const, path, errors, "UNKNOWN"),
    observedAt: dateValue(nullableString(record, "observedAt", path, errors, 64), `${path}.observedAt`, errors) ?? "",
    shipping,
    items,
    provenance: provenanceValue(record.provenance, `${path}.provenance`, errors, warnings),
  };
}

export function validateProductImportPayload(input: unknown): ProductImportValidation {
  const errors: ImportValidationIssue[] = [];
  const warnings: ImportValidationIssue[] = [];
  if (!isRecord(input)) return { ok: false, value: null, errors: [issue("$", "INVALID_PAYLOAD", "Payload must be an object.")], warnings };
  rejectUnknown(input, ["schemaVersion", "idempotencyKey", "source", "products"], "$", errors);
  const schemaVersion = input.schemaVersion;
  if (schemaVersion !== PRODUCT_IMPORT_SCHEMA_VERSION) {
    errors.push(issue("$.schemaVersion", "UNSUPPORTED_SCHEMA_VERSION", `Only schema version ${PRODUCT_IMPORT_SCHEMA_VERSION} is supported.`));
  }
  const idempotencyKey = typeof input.idempotencyKey === "string" ? input.idempotencyKey.trim() : "";
  if (!idempotencyPattern.test(idempotencyKey)) errors.push(issue("$.idempotencyKey", "INVALID_IDEMPOTENCY_KEY", "Use 8–128 letters, digits, dots, colons, underscores, or hyphens."));
  const sourceRecord = isRecord(input.source) ? input.source : {};
  if (!isRecord(input.source)) errors.push(issue("$.source", "INVALID_SOURCE", "Source must be an object."));
  rejectUnknown(sourceRecord, ["type", "label", "url", "retrievedAt", "notes"], "$.source", errors);
  const sourceUrl = urlValue(nullableString(sourceRecord, "url", "$.source", errors, 2048), "$.source.url", errors, false);
  const productsRaw = Array.isArray(input.products) ? input.products : [];
  if (!Array.isArray(input.products) || input.products.length < 1 || input.products.length > 50) {
    errors.push(issue("$.products", "INVALID_PRODUCTS", "Products must contain between 1 and 50 entries."));
  }
  const seenGtins = new Map<string, string>();
  const products = productsRaw.slice(0, 50).map((productValue, productIndex): ProductImportProduct => {
    const path = `$.products[${productIndex}]`;
    const product = isRecord(productValue) ? productValue : {};
    if (!isRecord(productValue)) errors.push(issue(path, "INVALID_PRODUCT", "Product must be an object."));
    rejectUnknown(product, ["brand", "family", "version", "variants"], path, errors);
    const brand = isRecord(product.brand) ? product.brand : {};
    const family = isRecord(product.family) ? product.family : {};
    const version = isRecord(product.version) ? product.version : {};
    if (!isRecord(product.brand)) errors.push(issue(`${path}.brand`, "INVALID_BRAND", "Brand must be an object."));
    if (!isRecord(product.family)) errors.push(issue(`${path}.family`, "INVALID_FAMILY", "Family must be an object."));
    if (!isRecord(product.version)) errors.push(issue(`${path}.version`, "INVALID_VERSION", "Version must be an object."));
    rejectUnknown(brand, ["name", "slug", "originMarket", "aliases"], `${path}.brand`, errors);
    rejectUnknown(family, ["canonicalName", "slug", "categorySlug", "originMarket", "commonEnglishAliases"], `${path}.family`, errors);
    rejectUnknown(version, ["versionName", "versionCode", "releaseDate", "status", "manufacturerVersionCode", "formulationFingerprint", "packagingDescription", "provenance", "images"], `${path}.version`, errors);
    const brandSlug = stringValue(brand, "slug", `${path}.brand`, errors, 200).toLowerCase();
    const familySlug = stringValue(family, "slug", `${path}.family`, errors, 200).toLowerCase();
    const categorySlug = stringValue(family, "categorySlug", `${path}.family`, errors, 200).toLowerCase();
    for (const [fieldPath, slug] of [[`${path}.brand.slug`, brandSlug], [`${path}.family.slug`, familySlug], [`${path}.family.categorySlug`, categorySlug]] as const) {
      if (!slugPattern.test(slug)) errors.push(issue(fieldPath, "INVALID_SLUG", "Must be a lowercase hyphenated slug."));
    }
    const versionImagesRaw = Array.isArray(version.images) ? version.images : [];
    if (version.images !== undefined && !Array.isArray(version.images)) errors.push(issue(`${path}.version.images`, "INVALID_ARRAY", "Images must be an array."));
    const variantsRaw = Array.isArray(product.variants) ? product.variants : [];
    if (!Array.isArray(product.variants) || product.variants.length < 1 || product.variants.length > 30) {
      errors.push(issue(`${path}.variants`, "INVALID_VARIANTS", "Variants must contain between 1 and 30 entries."));
    }
    const variants = variantsRaw.slice(0, 30).map((variantValue, variantIndex): ProductImportVariant => {
      const variantPath = `${path}.variants[${variantIndex}]`;
      const variant = isRecord(variantValue) ? variantValue : {};
      if (!isRecord(variantValue)) errors.push(issue(variantPath, "INVALID_VARIANT", "Variant must be an object."));
      rejectUnknown(variant, ["displaySize", "normalizedQuantity", "normalizedUnit", "gtin", "manufacturerSku", "isDefault", "provenance", "images", "benchmarks", "offers"], variantPath, errors);
      const gtinRaw = nullableString(variant, "gtin", variantPath, errors, 32);
      const gtin = gtinRaw?.replace(/[\s-]/g, "") ?? null;
      if (gtin && !gtinPattern.test(gtin)) errors.push(issue(`${variantPath}.gtin`, "INVALID_GTIN", "Must contain 8, 12, 13, or 14 digits."));
      if (gtin) {
        const firstPath = seenGtins.get(gtin);
        if (firstPath) errors.push(issue(`${variantPath}.gtin`, "DUPLICATE_GTIN", `GTIN is already used at ${firstPath}.`));
        else seenGtins.set(gtin, `${variantPath}.gtin`);
      }
      const manufacturerSku = nullableString(variant, "manufacturerSku", variantPath, errors, 200);
      const benchmarksRaw = Array.isArray(variant.benchmarks) ? variant.benchmarks : [];
      const offersRaw = Array.isArray(variant.offers) ? variant.offers : [];
      const imagesRaw = Array.isArray(variant.images) ? variant.images : [];
      for (const [key, raw] of [["benchmarks", variant.benchmarks], ["offers", variant.offers], ["images", variant.images]] as const) {
        if (raw !== undefined && !Array.isArray(raw)) errors.push(issue(`${variantPath}.${key}`, "INVALID_ARRAY", `${key} must be an array.`));
      }
      const normalizedUnit = stringValue(variant, "normalizedUnit", variantPath, errors, 32).toLowerCase();
      if (!/^[a-z][a-z0-9_-]*$/.test(normalizedUnit)) errors.push(issue(`${variantPath}.normalizedUnit`, "INVALID_UNIT", "Use a stable lowercase unit such as ml or g."));
      return {
        displaySize: stringValue(variant, "displaySize", variantPath, errors, 100),
        normalizedQuantity: numberValue(variant, "normalizedQuantity", variantPath, errors, { positive: true }),
        normalizedUnit,
        gtin,
        manufacturerSku,
        isDefault: booleanValue(variant, "isDefault", variantPath, errors),
        provenance: provenanceValue(variant.provenance, `${variantPath}.provenance`, errors, warnings),
        images: imagesRaw.map((image, index) => imageValue(image, `${variantPath}.images[${index}]`, errors, warnings)),
        benchmarks: benchmarksRaw.map((benchmark, index) => benchmarkValue(benchmark, `${variantPath}.benchmarks[${index}]`, errors, warnings)),
        offers: offersRaw.map((offer, index) => offerValue(offer, `${variantPath}.offers[${index}]`, errors, warnings)),
      };
    });
    if (variants.filter((variant) => variant.isDefault).length > 1) errors.push(issue(`${path}.variants`, "MULTIPLE_DEFAULTS", "Only one variant may be the default."));
    const brandOriginMarket = nullableString(brand, "originMarket", `${path}.brand`, errors, 2)?.toUpperCase() ?? null;
    const familyOriginMarket = nullableString(family, "originMarket", `${path}.family`, errors, 2)?.toUpperCase() ?? null;
    if (brandOriginMarket && !marketPattern.test(brandOriginMarket)) {
      errors.push(issue(`${path}.brand.originMarket`, "INVALID_MARKET", "Must be a two-letter market code."));
    }
    if (familyOriginMarket && !marketPattern.test(familyOriginMarket)) {
      errors.push(issue(`${path}.family.originMarket`, "INVALID_MARKET", "Must be a two-letter market code."));
    }
    return {
      brand: {
        name: stringValue(brand, "name", `${path}.brand`, errors, 200),
        slug: brandSlug,
        originMarket: brandOriginMarket,
        aliases: stringArray(brand.aliases, `${path}.brand.aliases`, errors),
      },
      family: {
        canonicalName: stringValue(family, "canonicalName", `${path}.family`, errors, 300),
        slug: familySlug,
        categorySlug,
        originMarket: familyOriginMarket,
        commonEnglishAliases: stringArray(family.commonEnglishAliases, `${path}.family.commonEnglishAliases`, errors),
      },
      version: {
        versionName: stringValue(version, "versionName", `${path}.version`, errors, 200),
        versionCode: nullableString(version, "versionCode", `${path}.version`, errors, 100),
        releaseDate: dateValue(nullableString(version, "releaseDate", `${path}.version`, errors, 64), `${path}.version.releaseDate`, errors, false),
        status: enumValue(version, "status", ["CURRENT", "PREVIOUS", "DISCONTINUED", "UNKNOWN"] as const, `${path}.version`, errors, "UNKNOWN"),
        manufacturerVersionCode: nullableString(version, "manufacturerVersionCode", `${path}.version`, errors, 200),
        formulationFingerprint: nullableString(version, "formulationFingerprint", `${path}.version`, errors, 500),
        packagingDescription: nullableString(version, "packagingDescription", `${path}.version`, errors, 1000),
        provenance: provenanceValue(version.provenance, `${path}.version.provenance`, errors, warnings),
        images: versionImagesRaw.map((image, index) => imageValue(image, `${path}.version.images[${index}]`, errors, warnings)),
      },
      variants,
    };
  });
  const familyIdentities = new Map<string, string>();
  const versionIdentities = new Map<string, string>();
  const skuIdentities = new Map<string, string>();
  const retailerIdentities = new Map<string, string>();
  const offerIdentities = new Map<string, string>();
  products.forEach((product, productIndex) => {
    const familyIdentity = `${product.brand.slug}|${product.family.categorySlug}|${product.family.canonicalName}`;
    const previousFamily = familyIdentities.get(product.family.slug);
    if (previousFamily && previousFamily !== familyIdentity) errors.push(issue(`$.products[${productIndex}].family`, "CONTRADICTORY_FAMILY", "The same family slug has contradictory brand, category, or name facts."));
    familyIdentities.set(product.family.slug, familyIdentity);
    const versionKey = `${product.family.slug}|${product.version.versionName}`;
    const versionIdentity = `${product.version.versionCode ?? ""}|${product.version.manufacturerVersionCode ?? ""}`;
    const previousVersion = versionIdentities.get(versionKey);
    if (previousVersion && previousVersion !== versionIdentity) errors.push(issue(`$.products[${productIndex}].version`, "CONTRADICTORY_VERSION", "The same family/version name has contradictory version identifiers."));
    versionIdentities.set(versionKey, versionIdentity);
    product.variants.forEach((variant, variantIndex) => {
      if (variant.manufacturerSku) {
        const skuKey = `${product.brand.slug}|${variant.manufacturerSku.toLowerCase()}`;
        const variantIdentity = `${versionKey}|${variant.normalizedQuantity}|${variant.normalizedUnit}`;
        const previousSku = skuIdentities.get(skuKey);
        if (previousSku && previousSku !== variantIdentity) errors.push(issue(`$.products[${productIndex}].variants[${variantIndex}].manufacturerSku`, "DUPLICATE_SKU", "This manufacturer SKU identifies more than one imported version/variant."));
        skuIdentities.set(skuKey, variantIdentity);
      }
      variant.offers.forEach((offer, offerIndex) => {
        const retailerIdentity = `${offer.retailer.name}|${offer.retailer.country ?? ""}`;
        const previousRetailer = retailerIdentities.get(offer.retailer.sourceKey);
        if (previousRetailer && previousRetailer !== retailerIdentity) errors.push(issue(`$.products[${productIndex}].variants[${variantIndex}].offers[${offerIndex}].retailer`, "CONTRADICTORY_RETAILER", "The same retailer source key has contradictory name or country facts."));
        retailerIdentities.set(offer.retailer.sourceKey, retailerIdentity);
        const offerKey = `${offer.retailer.sourceKey}|${offer.externalListingId ?? offer.listingUrl}`;
        const offerIdentity = `${versionKey}|${variant.gtin ?? variant.manufacturerSku ?? `${variant.normalizedQuantity}${variant.normalizedUnit}`}|${offer.nativeCurrency}`;
        const previousOffer = offerIdentities.get(offerKey);
        if (previousOffer && previousOffer !== offerIdentity) errors.push(issue(`$.products[${productIndex}].variants[${variantIndex}].offers[${offerIndex}]`, "CONTRADICTORY_OFFER", "One retailer listing identity cannot represent multiple variants or currencies."));
        offerIdentities.set(offerKey, offerIdentity);
      });
    });
  });
  const value: ProductImportPayload = {
    schemaVersion: PRODUCT_IMPORT_SCHEMA_VERSION,
    idempotencyKey,
    source: {
      type: enumValue(sourceRecord, "type", importSourceTypes, "$.source", errors, "OTHER"),
      label: stringValue(sourceRecord, "label", "$.source", errors, 200),
      url: sourceUrl,
      retrievedAt: dateValue(nullableString(sourceRecord, "retrievedAt", "$.source", errors, 64), "$.source.retrievedAt", errors) ?? "",
      notes: nullableString(sourceRecord, "notes", "$.source", errors, 2000),
    },
    products,
  };
  return errors.length > 0 ? { ok: false, value: null, errors, warnings } : { ok: true, value, errors: [], warnings };
}
