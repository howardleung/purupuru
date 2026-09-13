# Decision Log

This file records settled choices and the rationale behind them. New decisions should be appended rather than silently rewriting history.

### 2026-08 — Web-first product
**Status:** Accepted
**Decision:** Launch as a polished responsive website rather than a native mobile app.
**Why:** Better SEO, shareable public URLs, no install barrier, strong desktop research/trip-planning use case, faster iteration.
**Implications:** Native app is later and must be justified by mobile-native workflows such as camera/receipt/barcode, notifications, offline lists, or location awareness.

### 2026-08 — Initial market wedge
**Status:** Accepted
**Decision:** Canada is the home market; Korea and Japan are the primary beauty-origin/local-market contexts, with selective French/European skincare support.
**Why:** Focus is necessary for data quality and product polish. These markets map to the original user problem and strong beauty ecosystems.
**Implications:** Do not attempt global-market completeness in MVP.

### 2026-08 — Small catalogue first
**Status:** Accepted
**Decision:** Target roughly 100 curated products and 3–5 meaningful price sources for MVP.
**Why:** Depth, trust, version correctness, and UX matter more than database size.
**Implications:** Catalogue coverage is intentionally incomplete.

### 2026-08 — Price comparison is central but not omniscient
**Status:** Accepted
**Decision:** Show tracked buying options and local benchmarks; never claim all retailers have been searched.
**Why:** Legitimate feeds/APIs/affiliate partnerships are feasible but coverage will be incomplete.
**Implications:** Use language like `No Canadian buying options currently tracked`, not `Unavailable in Canada`.

### 2026-08 — Affiliate integrity
**Status:** Accepted
**Decision:** Affiliate commission never affects offer ordering or prominence.
**Why:** User trust is the core business asset.
**Implications:** Unaffiliated cheaper offers can rank above higher-paying affiliate partners.

### 2026-08 — Default offer sorting
**Status:** Superseded
**Decision:** Sort offers by product price ascending by default. Shipping is displayed separately and does not affect order.
**Why:** Users can make their own tradeoff; avoid opaque total-value scoring.
**Implications:** No MVP “best deal” score. Native-only price offers without CAD conversion cannot be numerically interleaved reliably.

### 2026-08 — Benchmark price hierarchy
**Status:** Accepted
**Decision:** Prefer MSRP, then authoritative Retail Price, then trusted Reference Price.
**Why:** These labels communicate different levels of authority and should not be conflated.
**Implications:** MSRP label requires manufacturer support. Show source, market, native currency, CAD conversion, and verification date.

### 2026-08 — Stable benchmark over fake live precision
**Status:** Accepted
**Decision:** Destination-market planning may use stable verified benchmark pricing rather than constantly changing physical-store prices.
**Why:** Trip planning benefits from a dependable expectation more than false exactness months in advance.
**Implications:** Recent observed prices can appear separately.

### 2026-08 — Savings exclude missing data
**Status:** Superseded
**Decision:** A product without both a verified destination benchmark and an exact Canadian comparison is excluded from savings calculations.
**Why:** Missing price is not zero.
**Implications:** Shopping-list totals disclose excluded unique product count and may be labeled Partial estimate.

### 2026-08 — Product versions are first-class
**Status:** Accepted
**Decision:** Model ProductFamily → ProductVersion → ProductVariant. Use deterministic identifiers to distinguish reformulations.
**Why:** Beauty products can retain almost identical names/packaging through formulation changes, making naive price/review comparisons misleading.
**Implications:** Never silently mix offers or ratings across versions.

### 2026-08 — Bundles are factual, not ranked
**Status:** Accepted
**Decision:** Keep bundles in the normal offer list with an Extras field. Do not value gifts/minis or reorder offers because of them in MVP.
**Why:** Users care about bundles, but assigning subjective monetary value creates misleading ranking logic.
**Implications:** Multipacks may show unit price; gifts remain descriptive.

### 2026-08 — Want means first-time wishlist
**Status:** Accepted
**Decision:** Want is for products/variants the user has not yet purchased. Moving/adding to Owned removes Want automatically.
**Why:** Repurchase intent is conceptually different from a wishlist.
**Implications:** Repeat purchase intent uses Would Repurchase and/or shopping-list quantity.

### 2026-08 — Holy Grail is an independent tag
**Status:** Accepted
**Decision:** Holy Grail can be applied without ownership or trial and may be aspirational.
**Why:** Users may treat “holy grail” as both a favorite and dream/wishlist-level standout.
**Implications:** Do not require Tried/Owned.

### 2026-08 — Would Repurchase requires experience
**Status:** Accepted
**Decision:** Would Repurchase is intended for Tried products.
**Why:** The phrase implies prior experience.
**Implications:** If selected before Tried, ask to apply Tried + Would Repurchase.

### 2026-08 — Purchase instances are separate from collection state
**Status:** Accepted
**Decision:** Multiple PurchaseInstances can exist for the same variant.
**Why:** Repeat purchases, shelf-life/open dates, receipts, and price-paid history require distinct acquisitions.
**Implications:** Finished is tied to a PurchaseInstance, not a product-level status.

### 2026-08 — Shopping-list quantities
**Status:** Accepted
**Decision:** ShoppingListItem supports quantity and purchasedQuantity. Re-adding the exact variant increases quantity rather than creating meaningless duplicates.
**Why:** Users may plan to buy multiple units, which also affects total savings.
**Implications:** Savings math is quantity-aware.

### 2026-08 — Skin type in MVP, private only
**Status:** Accepted
**Decision:** Ask optionally for skin type during lightweight onboarding; keep it private in MVP.
**Why:** Useful profile context/future personalization foundation without turning onboarding into diagnosis.
**Implications:** Schema keeps visibility control for future public profiles.

### 2026-08 — No AI skin diagnosis in MVP
**Status:** Accepted
**Decision:** Do not compete on AI skin analysis, ingredient diagnosis, medical recommendations, or daily routine tracking.
**Why:** Crowded territory, higher trust/medical complexity, not core differentiation.
**Implications:** AI may later help data normalization, translation, matching, or receipt extraction rather than determine medical suitability.

### 2026-08 — Search returns product families
**Status:** Accepted
**Decision:** Search results show brands and ProductFamilies, not separate versions/sizes.
**Why:** Cleaner discovery; version/variant complexity belongs on product page.
**Implications:** Local-language and version-specific search are post-MVP.

### 2026-08 — Continuous offer view
**Status:** Accepted
**Decision:** Do not hide market comparison behind tabs. `Buy in Canada` combines domestic and international retailers that can serve Canada; destination-market sections remain separate.
**Why:** Users should compare without remembering values across tabs.
**Implications:** Shipping/delivery, when shown, is supporting information rather than a separate `Ships to Canada` section.

### 2026-08 — Receipt import is post-MVP
**Status:** Accepted
**Decision:** Do not implement receipt OCR in initial MVP, but keep schema extensible.
**Why:** Powerful loop but adds OCR, confirmation, moderation, and data-quality scope.
**Implications:** Future receipt confirmation should always let users correct detected items before applying changes.

### 2026-08 — Future active-ingredient taxonomy
**Status:** Accepted
**Decision:** Vitamin C, Niacinamide, Retinol/Retinoids, AHA/BHA, etc. are future structured product attributes, not user tags.
**Why:** Useful browse/filter taxonomy, but reliable ingredient data is non-trivial and not core MVP.
**Implications:** Do not implement ingredient scanning now.

### 2026-08-30 — Core organization scope and benchmark terminology
**Status:** Accepted
**Decision:** `UserRating` is the canonical stored entity for a user's numeric rating; `CollectionEntry` may only reference or surface it. User-created thematic collections are post-MVP by default and optional only if they do not displace core collection states and shopping lists. Use `official MSRP`, `official/trusted Retail Price`, and `trusted Reference Price` according to source strength.
**Why:** This avoids duplicate rating storage, keeps MVP organization focused, and prevents generic reference prices from being presented with unwarranted authority.
**Implications:** Product and flow documentation must treat ratings as version-level `UserRating` records, thematic collections as optional post-MVP scope, and benchmark labels as source-sensitive.

### 2026-08-30 — Canonical skincare product taxonomy is MVP scope
**Status:** Accepted
**Decision:** Use a platform-owned hierarchical skincare taxonomy with stable parent-child categories. Every `ProductFamily` has one required primary canonical category; optional secondary categories may be supported without replacing that primary classification. Normalize retailer/source categories through separate mappings rather than treating external category strings as canonical.
**Why:** Consistent product-type browse, navigation, search, and data ingestion require a stable taxonomy independent of retailer-specific naming.
**Implications:** Canonical category is distinct from active ingredients, skin concerns, and skin type. MVP includes category browse, category search, and category display on product pages. The initial hierarchy is extensible rather than exhaustive.

### 2026-08-30 — Canonical-category breadcrumbs are MVP navigation
**Status:** Accepted
**Decision:** Product pages and category browse pages show compact clickable breadcrumbs derived from the canonical category path, such as `Skincare > Toners > Toner`.
**Why:** They provide lightweight orientation and back-navigation through the canonical taxonomy without competing with primary product content.
**Implications:** Breadcrumb labels and links use canonical taxonomy data rather than retailer categories and remain compatible with SEO-friendly web routes. Breadcrumbs are visually subordinate to primary page content.

### 2026-09-01 — Shipping/delivery is optional per-offer MVP information
**Status:** Accepted
**Decision:** Keep rich shipping/delivery metadata at the offer level, but do not require or guarantee a shipping/delivery column in MVP comparison tables. Surface it only when sufficiently reliable for the individual offer; otherwise omit it.
**Why:** Shipping/delivery can vary by marketplace seller, fulfillment method, Prime eligibility, threshold conditions, and destination, so retailer-level or incomplete data can mislead users.
**Implications:** Core MVP offer rows focus on retailer, product price, availability, and extras. Shipping/delivery never changes default product-price ordering or creates a shipping-adjusted “best” score. This supersedes the earlier assumption that shipping is always displayed separately.

### 2026-09-01 — First-build UI is functional, not final visual design
**Status:** Accepted
**Decision:** Treat the first MVP UI as a clean, usable implementation layout rather than final visual design. Prioritize application and repository setup, database, authentication, canonical catalogue/data models, offers and reference prices, search, collection behavior, shopping lists, product rendering, routing, and permissions.
**Why:** The first build must validate the product's operational foundation before substantial time is spent on final typography, visual identity, spacing polish, animation, or brand styling.
**Implications:** A simple two-column desktop product page or similarly straightforward layout is acceptable. Keep presentation components modular and do not tightly couple domain/business logic to the initial UI, so it can be redesigned later without major data-model or behavior changes. The existing premium, calm visual direction remains a later quality target.

### 2026-09-11 — Settled MVP technical stack
**Status:** Accepted
**Decision:** Use Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Prisma, Clerk, Vercel, and Neon for the MVP.
**Why:** This combination supports fast development, strong end-to-end TypeScript, SEO and server rendering, low operational overhead, and modular presentation that can be redesigned later.
**Implications:** Use PostgreSQL hosted on Neon with Prisma for persistence and data access; use Clerk for authentication; deploy the web application through Vercel. Tailwind CSS and shadcn/ui support the first-build functional UI without coupling domain/business logic to a particular visual layout.

### 2026-09-11 — Phase 1 workspace foundation
**Status:** Accepted
**Decision:** Scaffold the repository as a pnpm workspace with `apps/web` and placeholder `database`, `domain`, and `ui` packages. Initialize Prisma with only a non-domain bootstrap model until the documented product schema is implemented.
**Why:** This creates working boundaries for the settled stack without prematurely implementing catalogue, offer, authentication, or collection behavior.
**Implications:** Shared package boundaries and root scripts are available now. The temporary Prisma model is not product data and must be replaced as part of the later canonical domain-schema implementation.

### 2026-09-11 — Initial Prisma core-domain boundaries
**Status:** Superseded
**Decision:** Replace the temporary Prisma bootstrap model with the documented core catalogue, offer, benchmark, collection, purchase, rating, and shopping-list schema. Store one `CollectionEntry` per user and `ProductVersion`, retaining an optional selected variant for interaction context; keep purchases and shopping-list items variant-specific.
**Why:** Version-level relationship state prevents duplicate user state and matches version-level ratings, while variant-specific purchases and list rows preserve exact sellable-product history and intent.
**Implications:** Clerk identity is referenced by a unique external user ID, not duplicated auth credentials. Quantity and purchased-quantity bounds, Would Repurchase's Tried prerequisite, Want removal on ownership, and exact family/version pointer consistency are enforced by application/domain logic rather than this initial Prisma schema.

### 2026-09-11 — Pre-migration rating, source-key, and invariant rules
**Status:** Accepted
**Decision:** Store personal ratings as integer half-star values from 2 through 10, representing 1.0–5.0 stars in 0.5-star increments. Use stable lowercase namespaced source keys independent of display names. The first PostgreSQL migration must add database `CHECK` constraints for rating bounds, shopping-list quantities, purchased quantities, and purchase quantities.
**Why:** Integer half-steps avoid floating-point ambiguity; source keys make ingestion stable across display-name changes; simple local bounds belong in the database where Prisma cannot express them.
**Implications:** The first migration must include the documented `CHECK` constraints. Current-version family membership, default-variant version membership, Want removal on ownership, and Would Repurchase requiring Tried remain cross-record or behavioral domain/application invariants.

### 2026-09-11 — Costmetic is the temporary working name
**Status:** Superseded
**Decision:** Use `Costmetic` as the temporary development/internal working name. The name combines `cost + cosmetic` and reflects the product's beauty price-comparison focus.
**Why:** A concise working label helps internal communication while final naming is still being evaluated.
**Implications:** Do not treat this as final brand approval or rename generic technical identifiers. Revisit after domain, trademark, UI, and user-feedback review.
### 2026-09-12 — Otoku is the current working name
**Status:** Accepted
**Decision:** Use `Otoku` as the current development/internal working name, replacing Costmetic. The name comes from the Japanese concept of good value or a good deal.
**Why:** It better reflects the product's value-oriented shopping-intelligence focus while connecting to an initial core beauty market.
**Implications:** This remains a working name, not final brand approval. Keep package names, database identifiers, environment variables, migration history, and other generic technical identifiers unchanged so a future rename remains inexpensive.

### 2026-09-12 — Offer purchasing markets are explicit per listing
**Status:** Accepted
**Decision:** Store the markets served by an offer as explicit ISO market codes on that offer. Use these codes, not the retailer's home country, to populate `Buy in Canada` and destination-market sections.
**Why:** A retailer can operate internationally or expose market-specific storefronts, while two listings from the same retailer may serve different destinations.
**Implications:** The read-only catalogue adds `Offer.availableMarkets`. Empty means market availability is not verified, not global availability. Market membership remains separate from shipping cost and does not change raw product-price ordering.

### 2026-09-12 — Retailer storefront identity is separate from offer delivery markets
**Status:** Accepted
**Decision:** Treat market-facing storefronts with materially different pricing, currency, catalogue, or inventory as distinct `Retailer` records, such as `Amazon.ca` and `Amazon.jp`. Treat `Offer.availableMarkets` as the customer/delivery markets that an individual offer is known to serve, not as the retailer's home or storefront country.
**Why:** A storefront's identity and commercial catalogue are stable retailer metadata, while delivery eligibility belongs to a specific listing and can include markets outside the retailer's country, as with Stylevana or YesStyle serving Canada.
**Implications:** Do not infer offer placement from retailer country. An empty `availableMarkets` array means unverified market coverage, not worldwide coverage. The MVP keeps the array representation; a normalized offer-market model is deferred until market-specific availability, shipping, threshold, or verification attributes are required.

### 2026-09-12 — Benchmark CAD estimates use cached runtime exchange rates
**Status:** Accepted
**Decision:** Keep benchmark prices in their native currencies and calculate approximate CAD display values through a reusable server-side conversion layer. For MVP, use the latest available Bank of Canada daily exchange rate, cache responses for 24 hours, and show the rate source and date. Do not create a persistent exchange-rate model yet.
**Why:** CAD conversions are convenience estimates that can become stale independently of benchmark data. Runtime conversion avoids hardcoded seed values and duplicate benchmark records while keeping the native source value authoritative.
**Implications:** Non-CAD benchmarks display as native value followed by an approximate `CA$` value when a rate is available. A failed or unsupported conversion never hides the native benchmark. The conversion math is shared for later offer and shopping-list use. Existing nullable conversion snapshot fields remain optional and are not populated by the curated benchmark seed.

### 2026-09-12 — Authenticated collection mutations are version-scoped and transactional
**Status:** Accepted
**Decision:** Persist Want, Tried, Holy Grail, Would Repurchase, and personal rating per user and `ProductVersion`; retain the selected variant only as context and for variant-specific `PurchaseInstance` creation. Derive version-level Owned from the existence of a purchase for any variant in that version.
**Why:** Relationship state and ratings describe a formulation/version, while acquisitions must retain exact size/variant history. Compound invariants must remain correct under retries and concurrent requests.
**Implications:** The first Owned action transactionally removes Want and creates exactly one purchase. Repeating Owned is idempotent and exposes a separately confirmed Add another purchase action. Would Repurchase and rating require either existing Tried state or an explicit combined confirmation. Mutations use serializable Prisma transactions with bounded conflict retry, and Holy Grail is never cleared by lifecycle changes. Earlier wording that implied version relationship flags were variant-scoped is superseded by this clarification.

### 2026-09-12 — Shopping-list savings compare target-market offers with target-market benchmarks
**Status:** Accepted
**Decision:** Shopping-list destination cost and savings use an eligible offer whose availableMarkets contains the list target market and the strongest trustworthy benchmark for that same market and exact variant. The UI defaults to the lowest eligible raw product-price offer and lets the user choose another eligible offer, but that choice is temporary view state rather than a persisted retailer commitment.
**Why:** A shopping list represents exact-variant purchase intent while current retailer offers can change. Comparing a visible selected offer with an honestly labeled local benchmark makes the estimate inspectable without freezing stale offer data.
**Implications:** This supersedes the earlier Canada-offer comparison formula. Multiply both sides by requested quantity; preserve native currencies; use the reusable Bank of Canada layer for approximate CAD totals; exclude any product missing an offer, benchmark, or necessary conversion; disclose included/excluded product counts and reasons; label every incomplete result Partial estimate. Shipping, affiliate data, and bundle value never affect selection or savings.

### 2026-09-12 — Shopping-list purchase progress records acquisition deltas
**Status:** Accepted
**Decision:** purchasedQuantity is an absolute, monotonic count for the list item. Increasing it creates one linked PurchaseInstance whose quantity equals only the newly purchased delta; repeating the same target value creates no additional purchase.
**Why:** Absolute updates are retry-safe, and the existing PurchaseInstance.quantity field represents a specific acquired quantity without generating one database row per identical unit.
**Implications:** Decreasing purchased quantity is not part of this MVP flow. Planned quantity cannot be reduced below purchased quantity. Recording a list purchase also clears Want for the corresponding version in the same transaction.
### 2026-09-13 — My Collection is a version-normalized private read model
**Status:** Accepted
**Decision:** Build the private My Collection view by merging user-scoped `CollectionEntry`/tag, `UserRating`, and `PurchaseInstance` records into one presentation item per `ProductVersion`. State filters compose with AND semantics; recent, rating, and alphabetical sorts use deterministic tie-breaking.
**Why:** Relationship state and ratings are version-scoped while ownership remains exact-variant purchase history. A read model presents that split coherently without duplicate cards, N+1 lookups, or a new persisted aggregate.
**Implications:** The route requires authentication and never creates ownership while reading. Rating-only or purchase-only history still appears, Owned is derived from purchases, selected collection context is preferred for product links with rating, purchase, and default variant fallbacks, and public collection sharing remains deferred.

### 2026-09-13 — Catalogue personalization is optional current-version enrichment
**Status:** Accepted
**Decision:** Keep the catalogue’s public product-family query independent of personal state, then optionally enrich visible current versions for a signed-in local user through the existing normalized collection read model. Use one shared product-selection URL helper across catalogue, product selectors, My Collection, and shopping lists.
**Why:** Signed-in context makes discovery more useful, but it must not slow or gate anonymous browsing, duplicate collection rules in cards, introduce per-product queries, or lose exact version/variant context between screens.
**Implications:** Personal indicators on catalogue cards are explicitly current-version scoped and absent anonymously. The enrichment filters the fixed collection query set to visible version IDs, and every known product return path carries version and variant parameters. No schema or persistence behavior changes.

### 2026-09-13 — Price history uses exact tracked-offer observations
**Status:** Accepted
**Decision:** Build the first price-history view from native-currency PriceObservation records for the selected exact variant. Keep retailer/listing series independent by matching observation variant, retailer, and source URL to the tracked offer; display the current offer separately and never synthesize it into history.
**Why:** Sparse curated observations can provide useful context only when Otoku preserves exact product and retailer identity and clearly avoids claiming complete market history.
**Implications:** The existing model is sufficient for this foundation without migration. Historical CAD conversion is omitted until dated Bank of Canada rates or intentional conversion snapshots are supported. Initial seed values are labeled demo observations with verification type OTHER; scheduled collection, alerts, lowest-ever claims, and deal scoring remain deferred.
