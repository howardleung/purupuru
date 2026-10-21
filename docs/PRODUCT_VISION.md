# PuruPuru Product Vision

**Status:** Canonical product strategy and priority source

**Last updated:** 2026-10-14

## Purpose

PuruPuru is a Canada-first skincare shopping, discovery, and independent price-comparison platform. Its ambition is to become a place people prefer to browse skincare—even when they are not ready to buy—because discovery is enjoyable, retailer comparison is trustworthy, and selective recommendations are useful and understandable.

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

Catalogue inclusion and product-intelligence completeness are separate concerns. A product may be searchable and price-comparable without detailed skincare intelligence. Structured intelligence should be progressively enriched for selected products according to shopper interest and usefulness; missing intelligence must never be interpreted as negative evidence or block an otherwise trustworthy catalogue entry.

Product pages should progressively become premium shopping pages with curated imagery, product details, ratings and reviews, exact sizes, prominent tracked pricing, retailer alternatives, price history, reference-price context, and easy cart addition. A larger gallery remains valuable but is not the immediate priority.

## Guided discovery, Skin Map, and product intelligence

**Planned; not current functionality.**

PuruPuru should offer a lightweight `Help Me Choose` flow hosted by Theo that does not require an account, clinical assessment, or AI chatbot. A shopper may answer optional questions about product type, self-reported skin characteristics, priorities, and preferences, then receive a small set of relevant products with understandable reasons for each result. Completing the flow may establish a reusable **Skin Map** for signed-in users; it reflects what the shopper reports and must never be presented as skin measurement, diagnosis, or medical advice.

Recommendations must be explainable from reliable structured evidence. Product intelligence should track product function, relevant concerns, texture, supported benefits, compatibility evidence, cautions, provenance, and completeness. It may also include multiple applicable skin types, key ingredients, and fragrance information where supported. Each value must retain its source and evidence status, distinguish manufacturer claims from independently verified facts, respect meaningful `ProductVersion` formulation differences, and keep unknown information unknown.

Personalized product matches may use these shopper-facing tiers:

- **S — Excellent Match**
- **A — Great Match**
- **B — Good Match**

Every displayed tier requires a concise explanation grounded in the Skin Map and available product evidence. Show no tier when evidence is insufficient or alignment is too weak. Matching must be aware of product role: a cleanser, for example, should not be penalized for failing to address concerns that are irrelevant to cleansing. Suitability and price are separate dimensions; neither may silently substitute for the other.

Personalized discovery may consider Skin Map priorities, explicit preferences, liked products, and confirmed product experiences. Clearly distinguish preferences inferred from behavior from facts or preferences the shopper explicitly confirmed. Prioritize enrichment for products where shopper interest and recommendation usefulness justify the work rather than attempting exhaustive research on every catalogue item.

**Theo's Pick** is a selective platform-wide standout recommendation. It is distinct from personalized S/A/B match tiers, price drops, discounts, and other price-related badges. Its criteria must be supportable and transparent enough to avoid implying sponsorship, popularity, or universal suitability without evidence.

Reuse the existing catalogue, version, provenance, ingestion, and read-model boundaries. Exact persistence and schema design are deferred until implementation; do not pre-commit to a generalized recommendation engine or infer absent attributes.

Product pages should also offer explainable similar products and alternatives based initially on function, concern, texture, and price. Never call products equivalent without sufficient evidence, and explain the dimensions that made a suggestion relevant.

Dynamic shopping collections should prioritize useful discovery such as `Skincare Under $20`, `Best Deals Right Now`, `Popular Products`, and country/region-based exploration. They must use actual eligible tracked prices, reliable sale/history evidence, and attributable popularity signals. Brand origin is not evidence of popularity in that country or region.

The current personal save experience is a private heart-based Liked Products collection. Likes express interest or preference, not purchase, experience, endorsement, or effectiveness. Previous Collection history remains preserved as a secondary legacy view. They must not displace storefront discovery or the smart cart. Purchase verification, manual purchase-history analytics, and annual Wrapped-style summaries are not active priorities.

## Homepage and visual direction

The homepage should be search-first, price-forward, visually appealing, and uncluttered. It should feature prominent product imagery and readable CAD pricing, compelling verified deals, and a personalized discovery area that initially invites visitors to complete Theo's quiz. It must communicate shopping value before exposing the evidence and data-model complexity that makes the experience trustworthy.

The visual identity is **Theo + Sage**: cute, friendly, and distinctive without sacrificing shopping clarity. Use clean product grids, generous product photography, clear hierarchy, and restrained characterful interactions. Avoid generic beauty-store styling, clutter, excessive badges, tiny pricing, and decorative complexity that competes with products or purchase decisions.

## Catalogue acquisition and retailer coverage

Catalogue acquisition should prioritize products with at least one verified retailer offer available to Canadian shoppers. Minimize products with zero active eligible offers, and prioritize candidates according to Canadian availability, shopper demand, accurate product/variant identity, and the opportunity for useful multi-retailer comparison.

A product does not need comprehensive skincare intelligence to enter the catalogue, but ingestion should preferentially establish at least one genuine Canadian-eligible offer. Distinguish single-offer products from multi-offer, comparison-ready products. Products without active eligible offers may remain internally or appear selectively, but should not dominate normal catalogue browsing or shopping recommendations.

Offer coverage, freshness, and exact-variant matching are core catalogue-quality metrics. Future authorized retailer APIs, product feeds, and affiliate feeds may help scale acquisition and maintenance, but an affiliate relationship must never be assumed to include catalogue or pricing API access.

## Price intelligence and trust

Price comparison is independent and exact-variant specific, including exact size. PuruPuru should show:

- reputable Canadian-accessible retailer offers;
- prominent CAD prices, the lowest tracked available eligible price, and useful alternatives;
- transparent availability and verification age;
- native-currency source data with approximate CAD presentation;
- recorded price history, verified price drops, and honest price-change context;
- clearly defined discounts against an appropriate verified reference price;
- authoritative international manufacturer or retail reference prices where useful.

**Passport Deals** may compare Canadian offers with appropriately labelled home-country benchmarks. International reference prices remain valuable even when a shopper will not travel because they provide context about domestic-market pricing and import markups, but they are informational benchmarks—not delivered Canadian offers. Preserve the distinction among verified MSRP, Retail Price, Reference Price, an actual retailer-advertised sale, an observed price decrease, and a low price relative to other tracked retailers.

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

Analytics must use privacy-conscious collection, appropriate consent, and explicit retention. Reliable aggregate behavior may later support transparent labels such as `Most Viewed on PuruPuru`, `Trending on PuruPuru`, or `Popular This Week`, plus curated and personalized discovery. Measured popularity is not product quality or editorial endorsement, and it must remain distinct from the selective editorial/evidence-based meaning of `Theo's Pick`.

## Market, business, and differentiation

Canada is the initial home market. Catalogue breadth should include Korean, Japanese, French pharmacy and prestige skincare, plus other relevant domestic and international brands. Skincare is the specialization; makeup and fragrance are possible later expansions, not current priorities.

PuruPuru has competitors and useful references. These include Cosmetify for beauty comparison and unified-checkout direction, SkinSort and SkinCompass for discovery/comparison, and Sephora and Olive Young for visual shopping patterns. These are references, not claims that PuruPuru has no competition or that their capabilities are already implemented here. PuruPuru aims to differentiate through:

1. exceptional skincare-first browsing;
2. independent and accurate retailer price comparison;
3. a flexible multi-retailer smart cart;
4. Canadian-focused retailer and price intelligence;
5. explainable, evidence-supported personalized discovery.

Near-term monetization may include affiliate referrals, retailer or brand partnerships, better product feeds, and performance-based commercial relationships. Commercial relationships must never change which offer is presented as cheapest or how price-ranked offers are ordered.

A unified multi-retailer checkout—where participating retailers fulfill their own items—is a long-term business possibility, not current functionality or an MVP promise. It would require commercial agreements, payments, order integrations, inventory synchronization, and operational policies. Nonparticipating retailers should remain visible in unbiased comparisons.

## Capability status

### Current

- Responsive public skincare catalogue and category/brand discovery.
- `ProductFamily → ProductVersion → ProductVariant → Offer` identity with exact-size pricing.
- Retailer comparison, benchmarks, native prices, CAD conversion, and tracked price history.
- Ratings/reviews, private version-scoped Likes, preserved legacy Collection history, profiles, authentication, and Shopping Lists.
- Conservative staged `product-import-v1` ingestion with provenance and admin review.

### Planned priorities

1. Storefront Browse and navigation redesign.
2. Structured product intelligence with provenance, completeness, and evidence-aware ingestion.
3. Guided `Help Me Choose`, optional Skin Maps, explainable similar products, and trustworthy dynamic collections.
4. Basic analytics instrumentation.
5. Persistent smart cart with per-item retailer selection.
6. Internal analytics dashboard.
7. Better Canadian-eligible retailer coverage, offer freshness, availability, and verified sale/price-drop presentation.
8. Enhanced product galleries and details.
9. Shipping-aware basket optimization and price alerts.
10. Ongoing catalogue expansion where it materially improves coverage.

These priorities are directional rather than a promise to implement each in isolation or in exact sequence.

### Deferred or unresolved

- Unified PuruPuru checkout and direct retail.
- Shipping-aware basket optimization until data quality supports it.
- Personalized recommendations for products without sufficient structured evidence.
- Exact product-intelligence schema and metadata verification workflow.
- Skin houses, expanded quiz animations, and deeper gamification.
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
- separation between price signals and suitability signals;
- unknown product intelligence as unknown rather than negative evidence;
- affiliate-neutral raw-price ordering;
- price history, ratings/reviews, profiles, authentication, privacy, and user isolation.

Complexity exists to make shopping comparisons accurate. It should remain invisible unless it materially helps a shopper decide what or where to buy.
