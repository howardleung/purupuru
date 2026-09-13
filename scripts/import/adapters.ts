import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type {
  IngestionAvailabilityState,
  IngestionShippingState,
  NormalizedOfferItem,
  NormalizedSourceListing,
} from "../../packages/domain/src/ingestion.ts";

export const fixtureNames = ["well-round-lab", "shiseido-anessa"] as const;
export type FixtureName = (typeof fixtureNames)[number];

type JsonObject = Record<string, unknown>;

function object(value: unknown, field: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} must be an object`);
  return value as JsonObject;
}
function text(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  return value;
}
function nullableText(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  return text(value, field);
}
function numberOrNull(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number") throw new Error(`${field} must be a number`);
  return value;
}
function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${field} must be a string array`);
  }
  return value as string[];
}
function availability(value: unknown, field: string): IngestionAvailabilityState {
  const parsed = text(value, field);
  if (!["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "PREORDER", "UNKNOWN"].includes(parsed)) {
    throw new Error(`${field} has an unsupported value`);
  }
  return parsed as IngestionAvailabilityState;
}
function shipping(value: unknown, field: string): NormalizedSourceListing["shipping"] {
  if (value === null || value === undefined) return null;
  const source = object(value, field);
  const state = text(source.state, `${field}.state`);
  if (!["FREE", "FIXED", "CALCULATED", "UNKNOWN", "NOT_APPLICABLE", "PICKUP_ONLY"].includes(state)) {
    throw new Error(`${field}.state has an unsupported value`);
  }
  return {
    state: state as IngestionShippingState,
    amount: numberOrNull(source.amount, `${field}.amount`),
    currency: nullableText(source.currency, `${field}.currency`),
    method: nullableText(source.method, `${field}.method`),
    estimate: nullableText(source.estimate, `${field}.estimate`),
    conditions: nullableText(source.conditions, `${field}.conditions`),
  };
}
function offerItems(value: unknown, field: string): NormalizedOfferItem[] | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) throw new Error(`${field} must be an array or null`);
  return value.map((entry, index) => {
    const item = object(entry, `${field}[${index}]`);
    const itemType = text(item.itemType, `${field}[${index}].itemType`);
    if (!["SAME_PRODUCT", "OTHER_PRODUCT", "MINI", "GIFT_ACCESSORY"].includes(itemType)) {
      throw new Error(`${field}[${index}].itemType has an unsupported value`);
    }
    return {
      label: text(item.label, `${field}[${index}].label`),
      quantity: numberOrNull(item.quantity, `${field}[${index}].quantity`) ?? 1,
      itemType: itemType as NormalizedOfferItem["itemType"],
      isPromotional: item.isPromotional === true,
      relatedGtin: nullableText(item.relatedGtin, `${field}[${index}].relatedGtin`),
    };
  });
}

export function adaptWellFixture(raw: unknown): NormalizedSourceListing {
  const root = object(raw, "fixture");
  const store = object(root.store, "store");
  const product = object(root.product, "product");
  const commerce = object(root.commerce, "commerce");
  const price = object(commerce.price, "commerce.price");
  const size = object(product.size, "product.size");
  return {
    sourceKey: text(store.sourceKey, "store.sourceKey"),
    externalListingId: nullableText(store.listingId, "store.listingId"),
    sourceUrl: text(store.url, "store.url"),
    productTitle: text(product.title, "product.title"),
    brandName: nullableText(product.brand, "product.brand"),
    gtin: nullableText(product.gtin, "product.gtin"),
    manufacturerSku: nullableText(product.manufacturerSku, "product.manufacturerSku"),
    versionCode: nullableText(product.versionCode, "product.versionCode"),
    releaseDate: nullableText(product.releaseDate, "product.releaseDate"),
    releaseYear: null,
    formulationFingerprint: nullableText(product.formulaFingerprint, "product.formulaFingerprint"),
    packagingEvidence: nullableText(product.packaging, "product.packaging"),
    displaySize: nullableText(size.label, "product.size.label"),
    normalizedQuantity: numberOrNull(size.quantity, "product.size.quantity"),
    normalizedUnit: nullableText(size.unit, "product.size.unit"),
    amount: numberOrNull(price.amount, "commerce.price.amount"),
    nativeCurrency: nullableText(price.currency, "commerce.price.currency"),
    availabilityState: availability(commerce.availability, "commerce.availability"),
    availableMarkets: stringArray(commerce.deliveryMarkets, "commerce.deliveryMarkets"),
    shipping: shipping(commerce.shipping, "commerce.shipping"),
    bundleItems: offerItems(commerce.bundleItems, "commerce.bundleItems"),
    observedAt: nullableText(root.capturedAt, "capturedAt"),
    verificationType: "RETAILER_SOURCE",
  };
}

export function adaptShiseidoFixture(raw: unknown): NormalizedSourceListing {
  const root = object(raw, "fixture");
  const edition = object(root.edition, "edition");
  const size = object(root.net_content, "net_content");
  return {
    sourceKey: text(root.source_key, "source_key"),
    externalListingId: nullableText(root.item_code, "item_code"),
    sourceUrl: text(root.canonical_url, "canonical_url"),
    productTitle: text(root.name, "name"),
    brandName: nullableText(root.maker, "maker"),
    gtin: nullableText(root.barcode, "barcode"),
    manufacturerSku: nullableText(root.sku, "sku"),
    versionCode: nullableText(edition.code, "edition.code"),
    releaseDate: nullableText(edition.released, "edition.released"),
    releaseYear: null,
    formulationFingerprint: nullableText(edition.formula, "edition.formula"),
    packagingEvidence: nullableText(edition.package_note, "edition.package_note"),
    displaySize: nullableText(size.text, "net_content.text"),
    normalizedQuantity: numberOrNull(size.value, "net_content.value"),
    normalizedUnit: nullableText(size.uom, "net_content.uom"),
    amount: numberOrNull(root.yen_price, "yen_price"),
    nativeCurrency: "JPY",
    availabilityState: availability(root.stock, "stock"),
    availableMarkets: stringArray(root.serves, "serves"),
    shipping: shipping(root.delivery, "delivery"),
    bundleItems: offerItems(root.included_items, "included_items"),
    observedAt: nullableText(root.observed_at, "observed_at"),
    verificationType: "RETAILER_SOURCE",
  };
}

export async function loadFixture(name: FixtureName): Promise<NormalizedSourceListing> {
  const url = new URL(`../../data/import/fixtures/${name}.json`, import.meta.url);
  const raw = JSON.parse(await readFile(fileURLToPath(url), "utf8")) as unknown;
  const adapter = text(object(raw, "fixture").adapter, "adapter");
  if (adapter === "well") return adaptWellFixture(raw);
  if (adapter === "shiseido") return adaptShiseidoFixture(raw);
  throw new Error(`Unsupported fixture adapter: ${adapter}`);
}