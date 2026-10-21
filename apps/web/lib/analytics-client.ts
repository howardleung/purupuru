import { analyticsPageUrl, analyticsRoute, CONSENT_MAX_AGE, type AnalyticsEvents, type LikeTransition, type ProductIdentity } from "./analytics-contract";
import { analyticsSessionId, ANALYTICS_SESSION_IDLE_MS, ANALYTICS_SESSION_MAX_MS } from "./analytics-session";

type Envelope = { api_key: string; distinct_id: string; event: keyof AnalyticsEvents; timestamp: string; properties: Record<string, string | number | boolean> };
type Transport = (host: string, payload: Envelope) => void;

/** Explicit Capture API only: no SDK, autocapture, automatic URLs, forms, replay or identify. */
export class AnalyticsClient {
  private enabled = false;
  private consent = false;
  private consentExpires = 0;
  private key = "";
  private host = "";
  private visitor: string | null = null;
  private session: { id: string; startedAt: number; lastActivity: number } | null = null;
  private navigation = "";
  private pathname = "";
  private pageId = "";
  private pageSent = false;
  private products = new Set<string>();
  private currentProduct: ProductIdentity | null = null;
  private transitions = new Set<string>();

  private transport: Transport;
  private uuid: () => string;
  private now: () => number;

  constructor(transport: Transport, uuid: () => string, now = Date.now) {
    this.transport = transport;
    this.uuid = uuid;
    this.now = now;
  }

  configure(key: string | undefined, host: string | undefined, production: boolean) {
    this.key = key ?? "";
    this.host = host?.replace(/\/$/, "") ?? "";
    this.enabled = production && Boolean(this.key) && this.host === "https://us.i.posthog.com";
  }

  setConsent(accepted: boolean, expires = this.now() + CONSENT_MAX_AGE) {
    this.consentExpires = expires;
    if (this.consent === accepted) return;
    this.consent = accepted;
    this.visitor = null;
    this.session = null;
    this.pageSent = false;
    this.products.clear();
    this.transitions.clear();
    if (accepted) this.flushViews();
  }

  navigate(pathname: string, search: string) {
    // Navigation keys stay in memory; queries and real paths never reach the transport.
    const key = `${pathname}?${search}`;
    if (key !== this.navigation) {
      this.navigation = key;
      this.pathname = pathname;
      this.pageId = "";
      this.pageSent = false;
      this.products.clear();
      this.currentProduct = null;
    }
    this.flushViews();
  }

  product(pathname: string, search: string, product: ProductIdentity) {
    this.navigate(pathname, search);
    this.currentProduct = product;
    this.flushViews();
  }

  private flushViews() {
    const route = analyticsRoute(this.pathname);
    if (!route || !this.enabled || !this.consent || this.now() >= this.consentExpires) return;
    if (!this.pageSent) {
      this.send("$pageview", route);
      this.pageSent = true;
    }
    if (route.route_type !== "product" || !this.currentProduct) return;
    const p = this.currentProduct;
    const key = `${p.product_family_id}:${p.product_version_id}:${p.product_variant_id}`;
    if (this.products.has(key)) return;
    this.products.add(key);
    this.send("product_viewed", { product_family_id: p.product_family_id, product_version_id: p.product_version_id, product_variant_id: p.product_variant_id });
  }

  like(transition: LikeTransition | undefined) {
    if (!transition || this.transitions.has(transition.transitionId)) return;
    this.transitions.add(transition.transitionId);
    this.send(transition.liked ? "like_added" : "like_removed", {
      product_family_id: transition.productFamilyId, product_version_id: transition.productVersionId,
    });
  }

  outbound(value: AnalyticsEvents["retailer_outbound_clicked"]) {
    // Reconstruct the allowlist rather than spreading caller input (URLs and names are forbidden).
    this.send("retailer_outbound_clicked", {
      product_family_id: value.product_family_id, product_version_id: value.product_version_id,
      product_variant_id: value.product_variant_id, offer_id: value.offer_id,
      retailer_id: value.retailer_id, placement: value.placement,
    });
  }

  private send<E extends keyof AnalyticsEvents>(event: E, properties: AnalyticsEvents[E]) {
    const now = this.now();
    const route = analyticsRoute(this.pathname);
    const currentUrl = analyticsPageUrl(this.pathname);
    if (!this.enabled || !this.consent || now >= this.consentExpires || !route || !currentUrl) return;
    try {
      this.visitor ??= this.uuid();
      this.pageId ||= this.uuid();
      if (!this.session || now < this.session.lastActivity ||
        now - this.session.lastActivity >= ANALYTICS_SESSION_IDLE_MS || now - this.session.startedAt >= ANALYTICS_SESSION_MAX_MS) {
        this.session = { id: analyticsSessionId(now), startedAt: now, lastActivity: now };
      }
      this.session.lastActivity = now;
      this.transport(this.host, { api_key: this.key, distinct_id: this.visitor, event, timestamp: new Date(now).toISOString(), properties: {
        ...properties, schema_version: 2, page_view_id: this.pageId, $insert_id: this.uuid(),
        $current_url: currentUrl, $pathname: route.page_path, $host: new URL(currentUrl).hostname, $session_id: this.session.id,
        $process_person_profile: false, $geoip_disable: true,
      } });
    } catch { /* Optional analytics must never affect navigation or account operations. */ }
  }
}

const requests = new Set<AbortController>();
export const analytics = new AnalyticsClient((host, payload) => {
  const controller = new AbortController();
  requests.add(controller);
  void fetch(`${host}/i/v0/e/`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    credentials: "omit", referrerPolicy: "no-referrer", keepalive: true, signal: controller.signal,
  }).catch(() => undefined).finally(() => requests.delete(controller));
}, () => crypto.randomUUID());

export function stopAnalyticsRequests() {
  for (const request of requests) request.abort();
  requests.clear();
}
