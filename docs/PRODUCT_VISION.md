# PuruPuru Product Vision

**Status:** Canonical product strategy and priority source

**Last updated:** 2026-10-12

## Purpose

PuruPuru is a skincare shopping, discovery, and independent price-comparison platform for Canadian shoppers. Its ambition is to become a place people prefer to browse skincare—even when they are not ready to buy—because discovery is enjoyable and retailer comparison is trustworthy.

PuruPuru combines two advantages:

1. **An exceptional skincare storefront.** Browsing is image-first, fast, mobile-friendly, and organized around intuitive category and brand discovery rather than database structure.
2. **Independent shopping intelligence.** PuruPuru compares tracked offers for the exact product and size, makes the lowest eligible tracked price easy to understand, preserves retailer alternatives and price history, and helps shoppers spend more deliberately.

PuruPuru never promises the absolute lowest price on the internet. Coverage and freshness are finite, and affiliate or commercial relationships must never influence price ranking.

## Shopper experience

The normal shopper-facing identity is **Brand + Product Name + Size**. Discovery presents one default card per `ProductFamily`; exact `ProductVariant` selection remains explicit wherever a price, offer, cart item, or outbound retailer link depends on size. `ProductVersion` appears only when a formula, performance, SPF/PA, regional formulation, or concurrently sold generation materially changes the purchase.

The desired experience is a modern skincare storefront, not a technical product database or PCPartPicker clone:

- image-first product browsing;
- simple Shop All, Categories, and Brands navigation;
- clear ratings and lowest tracked eligible prices;
- fluid movement from discovery to exact-size comparison and saving;
- strong mobile usability;
- purposeful recommendations and curated collections once supported by reliable data;
- advanced factual comparison tools where they help, without making the default browse experience dense.

Skin-concern, skin-type, ingredient, popularity, and personalized discovery may follow only when reliable structured or behavioral data supports them.

Product pages should progressively become premium shopping pages with curated imagery, product details, ratings and reviews, exact sizes, prominent tracked pricing, retailer alternatives, price history, reference-price context, and easy cart addition. A larger gallery remains valuable but is not the immediate priority.

## Guided discovery and product intelligence

**Planned; not current functionality.**

PuruPuru should offer a lightweight `Help Me Choose` flow that does not require an account or AI chatbot. A shopper may answer a few optional questions about product type, skin concerns, preferences, and budget, then receive a small set of relevant products with understandable reasons for each result.

Recommendations must be deterministic and explainable from reliable structured product information. Planned metadata includes multiple applicable skin concerns and skin types, texture, key ingredients, benefits, and fragrance information. Every value retains source/provenance and distinguishes manufacturer claims from independently verified facts. Metadata and recommendations must respect meaningful `ProductVersion` formulation differences.

Reuse the existing catalogue, version, provenance, ingestion, and read-model boundaries. Exact persistence and schema design are deferred until implementation; do not pre-commit to a generalized recommendation engine or infer absent attributes.

Product pages should also offer explainable similar products and alternatives based initially on function, concern, texture, and price. Never call products equivalent without sufficient evidence, and explain the dimensions that made a suggestion relevant.

Dynamic shopping collections should prioritize useful discovery such as `Skincare Under $20`, `Best Deals Right Now`, `Popular Products`, and country/region-based exploration. They must use actual eligible tracked prices, reliable sale/history evidence, and attributable popularity signals. Brand origin is not evidence of popularity in that country or region.

Personal shelves such as Favourites, Want to Try, and Currently Using remain useful secondary experiences. They must not displace storefront discovery or the smart cart. Purchase verification, manual purchase-history analytics, and annual Wrapped-style summaries are not active priorities.

## Price intelligence and trust

Price comparison is independent and exact-size specific. PuruPuru should show:

- reputable Canadian-accessible retailer offers;
- the lowest tracked available eligible price and useful alternatives;
- transparent availability and verification age;
- native-currency source data with approximate CAD presentation;
- recorded price history and honest price-change context;
- authoritative international manufacturer or retail reference prices where useful.

International reference prices remain valuable to Canadian shoppers even when they will not travel. They provide context about domestic-market pricing and import markups, but are informational benchmarks—not delivered Canadian offers. Preserve the distinction among verified MSRP, Retail Price, Reference Price, an actual retailer-advertised sale, an observed price decrease, and a low price relative to other tracked retailers.

Never invent an MSRP, discount, original price, availability state, or savings percentage. Keep item price separate from shipping, tax, and delivered-basket cost unless those components are supported by reliable data.

## Smart shopping cart

**Planned strategic feature; not current functionality.**

The next personal shopping direction is a persistent smart cart. It should eventually let users:

- add exact `ProductVariant` items and keep them between visits;
- default each item to its lowest eligible tracked offer while allowing retailer overrides;
- see item subtotals and a CAD basket total;
- group selections by retailer and follow exact outbound listing links;
- see changed or unavailable prices on return;
- distinguish item subtotal from shipping and tax.

There is no initial PuruPuru-hosted checkout, and adding an item does not reserve or purchase it. Later cart intelligence may consider shipping thresholds, delivered-basket optimization, price alerts, saved baskets, alternatives, and routines. The cheapest individual offers do not necessarily form the cheapest delivered basket.

The currently implemented Shopping Lists remain supported. Their travel/target-market framing is no longer a flagship product strategy; they may be reused or migrated into the smart-cart experience through a future, data-safe product decision. Do not delete or reinterpret existing user data implicitly.

## Analytics and data-driven discovery

**Planned; not current functionality.**

PuruPuru should instrument product impressions as well as interactions so internal analytics can measure unique visitors, sessions, page views, returning visitors, traffic sources, searches, filters, product views, cart behavior, outbound retailer clicks, popular products and brands, empty searches, and retailer-offer performance without confusing placement with preference or clicks with purchases.

Analytics must use privacy-conscious collection, appropriate consent, and explicit retention. Reliable aggregate behavior may later support transparent labels such as `Most Viewed on PuruPuru`, `Trending on PuruPuru`, or `Popular This Week`, plus curated and personalized discovery. Measured popularity is not product quality or editorial endorsement; `PuruPuru Choice` remains an unresolved future concept.

## Market, business, and differentiation

Canada is the initial home market. Catalogue breadth should include Korean, Japanese, French pharmacy and prestige skincare, plus other relevant domestic and international brands. Skincare is the specialization; makeup and fragrance are possible later expansions, not current priorities.

PuruPuru has competitors and useful references. These include Cosmetify for beauty comparison and unified-checkout direction, SkinSort and SkinCompass for discovery/comparison, and Sephora and Olive Young for visual shopping patterns. These are references, not claims that PuruPuru has no competition or that their capabilities are already implemented here. PuruPuru aims to differentiate through:

1. exceptional skincare-first browsing;
2. independent and accurate retailer price comparison;
3. a flexible multi-retailer smart cart;
4. Canadian-focused retailer and price intelligence;
5. useful data-driven discovery.

Near-term monetization may include affiliate referrals, retailer or brand partnerships, better product feeds, and performance-based commercial relationships. Commercial relationships must never change which offer is presented as cheapest or how price-ranked offers are ordered.

A unified multi-retailer checkout—where participating retailers fulfill their own items—is a long-term business possibility, not current functionality or an MVP promise. It would require commercial agreements, payments, order integrations, inventory synchronization, and operational policies. Nonparticipating retailers should remain visible in unbiased comparisons.

## Capability status

### Current

- Responsive public skincare catalogue and category/brand discovery.
- `ProductFamily → ProductVersion → ProductVariant → Offer` identity with exact-size pricing.
- Retailer comparison, benchmarks, native prices, CAD conversion, and tracked price history.
- Ratings/reviews, private Collection state, profiles, authentication, and Shopping Lists.
- Conservative staged `product-import-v1` ingestion with provenance and admin review.

### Planned priorities

1. Storefront Browse and navigation redesign.
2. Structured product intelligence with provenance-aware ingestion.
3. Guided `Help Me Choose`, explainable similar products, and trustworthy dynamic collections.
4. Basic analytics instrumentation.
5. Persistent smart cart with per-item retailer selection.
6. Internal analytics dashboard.
7. Better online retailer coverage, offer freshness, availability, and sale/price-drop presentation.
8. Enhanced product galleries and details.
9. Shipping-aware basket optimization and price alerts.
10. Ongoing catalogue expansion where it materially improves coverage.

These priorities are directional rather than a promise to implement each in isolation or in exact sequence.

### Deferred or unresolved

- Unified PuruPuru checkout and direct retail.
- Shipping-aware basket optimization until data quality supports it.
- Personalized recommendations before sufficient behavioral data exists.
- Exact product-intelligence schema and metadata verification workflow.
- `PuruPuru Choice` rules and meaning.
- Makeup, fragrance, and other category expansion.

### Superseded strategic direction

- PCPartPicker-style table-first catalogue browsing as the default experience.
- Travel shopping lists and Japan/Korea trip workflows as flagship priorities.
- Treating international reference prices as a travel-only feature.
- Receipt scanning/OCR, purchase verification, and manual purchase-history analytics as active product priorities.

Historical implementation notes remain valid records of what was built and why. Superseding a strategy does not delete current functionality, user data, technical invariants, or past decisions.

## Durable technical principles

The strategy does not replace the existing architecture. Preserve:

- `ProductFamily → ProductVersion → ProductVariant → Offer`;
- family-level discovery with exact-variant price and link context;
- meaningful-version-only product modeling;
- retailer identity, provenance, conservative ingestion, and idempotency;
- native currency as source truth and CAD as presentation;
- distinct MSRP, Retail Price, and Reference Price semantics;
- affiliate-neutral raw-price ordering;
- price history, ratings/reviews, profiles, authentication, privacy, and user isolation.

Complexity exists to make shopping comparisons accurate. It should remain invisible unless it materially helps a shopper decide what or where to buy.
