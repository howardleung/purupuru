/** Only canonical public catalogue IDs belong in analytics, never account or list IDs. */
export type ProductIdentity = { product_family_id: string; product_version_id: string; product_variant_id: string };
export type OutboundIdentity = ProductIdentity & {
  offer_id: string;
  retailer_id: string;
  placement: "product_offer_retailer" | "product_offer_price" | "price_history" | "shopping_list";
};
export type LikeTransition = {
  transitionId: string;
  productFamilyId: string;
  productVersionId: string;
  liked: boolean;
};

const staticRoutes: Record<string, string> = {
  "/": "home", "/catalogue": "catalogue", "/compare": "comparison",
  "/categories": "categories", "/brands": "brands", "/likes": "likes",
  "/collection": "collection", "/collection/legacy": "collection",
  "/shopping-lists": "shopping_lists", "/about": "information", "/contact": "information",
  "/privacy": "information", "/terms": "information", "/affiliate-disclosure": "information",
};

export function analyticsRoute(pathname: string) {
  if (Object.hasOwn(staticRoutes, pathname)) return { page_path: pathname, route_type: staticRoutes[pathname] };
  for (const [prefix, type, parameter] of [
    ["products", "product", "slug"], ["categories", "category", "slug"], ["shopping-lists", "shopping_list", "id"],
  ]) {
    if (new RegExp(`^/${prefix}/[^/]+/?$`).test(pathname)) return { page_path: `/${prefix}/[${parameter}]`, route_type: type };
  }
  // Closed allowlist excludes admin, design, auth callbacks, Skin Map and unknown routes.
  return null;
}

export type AnalyticsEvents = {
  page_viewed: { page_path: string; route_type: string };
  product_viewed: ProductIdentity;
  retailer_outbound_clicked: OutboundIdentity;
  like_added: { product_family_id: string; product_version_id: string };
  like_removed: { product_family_id: string; product_version_id: string };
};

export const CONSENT_KEY = "purupuru.analytics-consent.v1";
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
export function readAnalyticsConsent(value: string | null, now = Date.now()): boolean | null {
  try {
    const record: unknown = JSON.parse(value ?? "null");
    if (!record || typeof record !== "object" || !("version" in record) || record.version !== 1 ||
      !("accepted" in record) || typeof record.accepted !== "boolean" ||
      !("at" in record) || typeof record.at !== "number" || !Number.isFinite(record.at) || record.at > now || now - record.at >= CONSENT_MAX_AGE) return null;
    return record.accepted;
  } catch { return null; }
}
