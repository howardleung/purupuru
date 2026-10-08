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
**Status:** Superseded by the 2026-09-16 PuruPuru identity decision
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
**Status:** Superseded
**Decision:** Shopping-list destination cost and savings use an eligible offer whose availableMarkets contains the list target market and the strongest trustworthy benchmark for that same market and exact variant. The UI defaults to the lowest eligible raw product-price offer and lets the user choose another eligible offer, but that choice is temporary view state rather than a persisted retailer commitment.
**Why:** A shopping list represents exact-variant purchase intent while current retailer offers can change. Comparing a visible selected offer with an honestly labeled local benchmark makes the estimate inspectable without freezing stale offer data.
**Implications:** This supersedes the earlier Canada-offer comparison formula. Multiply both sides by requested quantity; preserve native currencies; use the reusable Bank of Canada layer for approximate CAD totals; exclude any product missing an offer, benchmark, or necessary conversion; disclose included/excluded product counts and reasons; label every incomplete result Partial estimate. Shipping, affiliate data, and bundle value never affect selection or savings.

### 2026-09-12 — Shopping-list purchase progress records acquisition deltas
**Status:** Superseded
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
**Status:** Superseded
**Decision:** Build the first price-history view from native-currency PriceObservation records for the selected exact variant. Keep retailer/listing series independent by matching observation variant, retailer, and source URL to the tracked offer; display the current offer separately and never synthesize it into history.
**Why:** Sparse curated observations can provide useful context only when Otoku preserves exact product and retailer identity and clearly avoids claiming complete market history.
**Implications:** The existing model is sufficient for this foundation without migration. Historical CAD conversion is omitted until dated Bank of Canada rates or intentional conversion snapshots are supported. Initial seed values are labeled demo observations with verification type OTHER; scheduled collection, alerts, lowest-ever claims, and deal scoring remain deferred.

### 2026-09-13 — Ingestion uses conservative canonical matching and stable offer-linked observations
**Status:** Accepted
**Decision:** Normalize source records through explicit retailer adapters, match only an existing exact ProductVariant using high-confidence identity/version/size evidence, and never auto-create catalogue identities from retailer text. Identify an offer by retailer storefront plus external listing ID when available, with retailer + exact variant + stable URL as the fallback. Link ingestion-created PriceObservations directly to the offer and deduplicate them by offer/source timestamp.
**Why:** Retailer strings and URLs change, while product versions and sizes must never be mixed. Stable source identity plus exact canonical matching makes reruns safe without overstating matching confidence or erasing native historical evidence.
**Implications:** PriceObservation.offerId is nullable for backward compatibility and deletes use SET NULL. Legacy null-linked observations retain the conservative variant + retailer + source-URL read fallback. A new real timestamp appends one native-currency observation; an identical rerun is unchanged; conflicting data at the same timestamp is rejected before writes. Developer execute mode uses per-record serializable transactions, dry-run makes no writes, and automated fetching/scheduling remains deferred. This supersedes the prior conclusion that URL matching alone was sufficient for the next ingestion stage.

### 2026-09-13 — Version- and variant-safe product image model
**Status:** Accepted
**Decision:** Product imagery is stored in a dedicated `ProductImage` entity owned by a required `ProductVersion`, with an optional exact `ProductVariant`, source/provenance fields, primary ordering, and a finite source-type enum. Exact-variant imagery wins; only version-wide imagery may fall back across sizes in the same version. Catalogue and product pages render an intentional fallback when no safe asset exists.
**Why:** Beauty packaging can differ across formulations and sizes. A family-level URL would make it too easy to show the wrong product while also limiting future galleries and source auditing.
**Implications:** Seed imagery must be manually curated from local or approved brand/retailer sources and documented. Remote hosts are allowlisted narrowly. The initial official remote assets require permissions/hotlinking review before public launch; no search-result or scraped image URLs are accepted.

### 2026-09-13 — Public site shell and early trust pages
**Status:** Accepted
**Decision:** `/` is the public Otoku homepage; searchable catalogue browsing lives at `/catalogue`; canonical taxonomy browsing has a `/categories` index. Primary navigation exposes Home, Browse, Categories, My Collection, Shopping Lists, and About to anonymous and signed-in users. About, Contact, Privacy, Terms, and Affiliate Disclosure pages exist as early-stage public structure, with legal-policy drafts visibly marked for professional review.
**Why:** Anonymous visitors need to understand Otoku’s value and move from discovery to comparison before authentication. Trust limitations should be visible before launch rather than hidden in product copy.
**Implications:** Browsing remains public and Clerk is invoked only for private actions/routes. Prices and availability are changeable, CAD conversion is approximate, no retailer partnership is implied, and any future affiliate commission cannot influence ordering. Final legal text and a real contact channel remain launch blockers.

### 2026-09-13 — Dual-density structural UX direction

**Status:** Accepted

**Decision:** Use a beauty-first, image-forward, lower-density approach for discovery and personal surfaces, and a denser sortable/filterable factual approach for catalogue, comparison, and offer research. The product page bridges both modes by prioritizing exact product identity and buying options while moving personal actions into a compact click/tap-triggered overlay. `docs/UX_SPEC.md` is the canonical specification for this next structural redesign.

**Why:** Otoku must feel appropriate for beauty discovery while answering serious comparison and shopping questions efficiently. Different tasks require different information density, and progressive disclosure keeps the product approachable without weakening research capability.

**Implications:** Click/tap is authoritative and no important behavior may be hover-only; mobile retains feature parity through adapted layouts. My Collection becomes image-first, Shopping Lists become checklist-like by default, the catalogue becomes research-oriented, and all existing product/version/variant, pricing, trust, authentication, and collection invariants remain unchanged. Final visual identity remains unresolved.

### 2026-09-14 — Shopping lists use target benchmarks and reversible checklist state

**Status:** Accepted

**Decision:** The strongest verified exact-variant benchmark for `targetMarket` is the stable planned amount. Savings compare that benchmark with a selected eligible Canadian retailer offer, which defaults to the cheapest raw product price in the settled MVP home market. Target-market retailer offers remain secondary availability details. Separately, `ShoppingListItem.purchasedQuantity` is a reversible checklist compatibility field: zero is unchecked and full current quantity is checked.

**Why:** Travel planning needs a stable, trustworthy target-market expectation plus a real at-home comparison; the planned amount should not jump with whichever destination retailer is cheapest today. A shopping-list checkbox is transient task state, while `PurchaseInstance` is durable acquisition history, so coupling the two makes reversal unsafe and repeated checking ambiguous.

**Implications:** Retain native prices, explicit `Offer.availableMarkets`, quantity-aware CAD estimates, missing-data exclusions, and affiliate-neutral ordering. Missing benchmarks remain unavailable. Checking and unchecking never creates or deletes `PurchaseInstance` rows; changing quantity while checked keeps the row fully checked, and removing a list row detaches any older linked purchase history. Canada remains a presentation/domain default rather than a new persisted field, so no schema migration is required. This supersedes both 2026-09-12 shopping-list decisions for savings and monotonic purchase progress.

### 2026-09-14 — Shopping-list Purchased is separate from personal ownership

**Status:** Accepted

**Decision:** Marking a `ShoppingListItem` Purchased means only that the item on that list was bought. It is reversible checklist state and does not by itself create a personal `PurchaseInstance`, make the product Owned in My Collection, remove Want, or otherwise change Collection state. `PurchaseInstance` is reserved for the user’s own durable acquisition history. Products enter Owned only through an explicit Collection action, including a direct Owned action or a distinct current/future `Add to My Collection` action from a purchased list item.

**Why:** A shopping list may contain gifts, purchases for friends or family, or items the user is helping someone else buy. “Did this item get bought?” and “Is this my product or part of my personal beauty history?” are intentionally different questions.

**Implications:** The compatibility field `ShoppingListItem.purchasedQuantity` represents checklist completion only: `0` is unchecked and the current item quantity is checked. Checking, unchecking, rechecking, and changing quantity while checked may update shopping-list progress and estimated already-saved calculations without implying ownership. Unchecking never deletes personal purchase history. If the user explicitly adds the item to My Collection, the normal Collection transaction applies, including Owned derivation, appropriate `PurchaseInstance` creation, and Want removal. A `PurchaseInstance` linked to a shopping-list item or carrying source `SHOPPING_LIST` therefore indicates an explicit personal-history action, not the checkbox alone.

### 2026-09-14 — Product research uses one benchmark and a consolidated native-currency history chart

**Status:** Accepted

**Decision:** The product page presents the strongest trustworthy benchmark once, makes Canadian retailer offers the primary shopping section, and keeps destination offers, history, and evidence progressively ordered below it. Price history is one compact research surface for the selected exact variant, with one independent series per retailer listing and separate chart groups for each native currency. Raw observations remain available behind a disclosure. Retailer links use reviewed repository-hosted logos only when available and otherwise retain accessible text.

**Why:** Repeating benchmarks and surrounding every fact with an equally weighted card obscures the local buying decision. A consolidated chart makes cross-retailer movement easier to scan, while separate currency axes prevent a false visual comparison and local-only logo assets prevent unreviewed hotlinks or unstable branding.

**Implications:** Benchmark sources and external evidence signals are not promoted to shopping options without an actual matching `Offer`. Sparse and missing history remain explicit, current offers are not synthesized into historical observations, historical CAD is still omitted without observation-date rates, and version/variant/listing identity remains exact. No schema or charting dependency is required; adding a retailer logo is an asset-review and registry change.

### 2026-09-16 — PuruPuru is the current working product name

**Status:** Accepted

**Decision:** Use `PuruPuru` in current product copy, wordmarks, metadata, and active documentation, superseding the earlier Otoku working-name decision. The root package label is `purupuru`; generic workspace package scopes remain unchanged.

**Why:** Adopt the requested new identity without coupling branding to durable product or infrastructure identity. Domain and trademark clearance remain pending.

**Implications:** No changes to product data, database/auth state, schema, migrations, IDs, secrets, environment-variable names, domain rules, or application behavior. Historical decision wording remains intact. External repository/project/application display names and domains require separate manual review; see `BRANDING.md`.

### 2026-09-16 — Runtime security boundaries and shared production rate limits

**Status:** Accepted

**Decision:** Validate untrusted mutation inputs before Prisma/private work and use the existing canonical quantity/rating rules. Production application traffic uses short-lived atomic HTTPS Redis rate counters, with public trusted-ingress IP and authenticated Clerk user budgets; missing or failed storage fails closed. Add baseline browser security headers and safe HTTP(S) external navigation without replacing Clerk sessions or domain behavior.

**Why:** TypeScript input types do not prevent omitted Prisma predicates, and instance-local counters cannot reliably protect a serverless deployment. Boundary protections should remain separate from personal ownership, pricing and identity semantics.

**Implications:** No database schema/migration or automatically provisioned infrastructure. Production requires manually configured server-only rate-store credentials. The baseline CSP retains Next/Clerk inline compatibility, not a claimed strict nonce policy. Provider firewall/auth settings, live integration checks and the remaining Prisma configuration dependency advisory need release review; see `SECURITY.md`.

### 2026-09-16 — Initial shared PuruPuru visual identity

**Status:** Accepted; final logo artwork pending

**Decision:** Use a shared white-led, muted Nordic-blue visual system with rounded locally hosted Nunito typography, restrained pastel accents, and replaceable temporary shopping-bag/drop branding. See `DESIGN_PRINCIPLES.md` section 16 for tokens, patterns, and asset provenance.

**Why:** Establish a cohesive consumer beauty identity without replacing the factual, dense research tools or treating mockup content as product data.

**Implications:** Homepage prominence uses real catalogue ordering and existing identity-safe images/prices, not invented popularity signals. No schema, domain, pricing, ownership, auth, security, or ingestion changes. Deep research/personal pages inherit the shared system and may receive further dedicated visual polish.

### 2026-09-26 — Product-graph ingestion is staged, provenance-retaining, and admin committed

**Status:** Accepted

**Decision:** Machine-generated product data enters through a versioned JSON contract and a durable `ImportBatch`. Submission validates and normalizes data, records provenance and a conservative create/reuse/update/conflict plan, but does not publish it. A Clerk-authenticated allowlisted administrator explicitly commits an approved whole batch through one serializable transaction.

**Why:** Research automation can reduce manual catalogue work only if uncertain identity evidence remains reviewable and retries cannot duplicate or partially publish product graphs. A narrow interface is safer than exposing generic Prisma operations or relying on AI-generated syntax as trust.

**Implications:** GTIN, scoped SKU, and exact version/size evidence are authoritative in that order; ambiguity blocks commit and canonical categories remain curated. The idempotency key uniquely identifies a submitted batch. Raw and normalized payloads, provenance, plan, reviewer identity, and committed IDs remain auditable. `PURUPURU_ADMIN_CLERK_USER_IDS` is required server-side. The additive import-batch migration must be deployed before use; feeds, scraping, schedules, and automatic low-confidence creation remain out of scope.

### 2026-09-29 — ProductVersion is a consumer-relevance exception

**Status:** Accepted

**Decision:** Preserve `ProductFamily → ProductVersion → ProductVariant → Offer`, but normally model one current/default ProductVersion and present brand + product name + size. Create another ProductVersion only for a concrete shopper-relevant difference in formula, function, SPF/PA, regulatory market, distinguishable generation, or simultaneously sold old/new products. Exact identifiers and release metadata remain confidence/provenance evidence but do not independently define a user-facing version.

**Why:** PuruPuru should make ordinary beauty discovery and price comparison simple. A retailer listing that clearly matches brand, product, form, and exact size should not disappear merely because it does not prove a particular JAN or release year.

**Implications:** Exact GTIN/SKU matches remain strongest; a unique uncontradicted brand/product/exact-size match is normally sufficient. Conflicting identifiers, sizes, or material-version evidence still block or require review. Single-version UI hides version labels and emphasizes size; a formula selector appears only for multiple meaningful versions. This supersedes earlier ingestion implications that required exact version evidence for every offer. The staged Bioré Canadian-offer deactivation batch was rejected as obsolete, and the existing offers remain catalogue records subject to normal price refresh.

### 2026-10-01 — Catalogue browse results are exact current variants

**Status:** Accepted

**Decision:** Keep autocomplete consolidated at the `ProductFamily` level, but render catalogue and category browse results as one row/card per active `ProductVariant` in the family's current shopper-facing `ProductVersion`. Each result shows its exact size, uses only that variant's image/benchmark/eligible offers, and links back with exact version and variant context. Capacity filtering normalizes compatible dimensions to mL, g, or discrete count and excludes incompatible dimensions.

**Why:** Shoppers compare purchasable sizes and their prices, not an arbitrary default size. Variant-level rows prevent one size's offer or image from being presented as another size while retaining a simple family-level search experience.

**Implications:** Multiple offers for one exact variant still produce one result, not duplicate rows. A family with multiple active current sizes produces multiple results. Prior/non-current versions remain available through product-page selection but do not multiply ordinary browse results. No schema or migration change is required because normalized quantity/unit, variant identity, offer linkage, and context-preserving URLs already exist.

### 2026-10-01 — Product buying options use compact exact-listing comparison

**Status:** Accepted

**Decision:** Place compact exact-size chips directly below product imagery. Present offers as a dense desktop table with exactly `Retailer`, `Extras`, `Availability`, and `Price`, with compact mobile rows carrying the same hierarchy. Retailer name and displayed price independently link to the exact listing through the existing safe external-link boundary. Primary comparison omits shipping and verification metadata.

**Why:** Size selection and raw product-price comparison are the primary shopping tasks. Large selector regions and verbose offer cards obscure those tasks, while shipping or verification metadata does not belong in the main factual comparison grid.

**Implications:** Extras are derived only from structured additional items or multi-unit primary quantity; a sole primary item is not an extra and missing extras display `—`. Offer ordering remains exact-variant raw product price ascending. ProductVersion stays implicit unless multiple shopper-relevant versions exist. No schema, migration, ingestion, benchmark, collection, or shopping-list behavior changes.

### 2026-10-01 — Canadian price presentation is local-currency first

**Status:** Accepted

**Decision:** In the Canadian site context, show an available approximate CAD conversion as the primary presentation value for non-CAD benchmarks and foreign-market offers, with the authoritative native amount immediately below it. Keep benchmark provenance, verification, native context, and exchange-rate details available through the compact details disclosure.

**Why:** Canadian shoppers can compare values faster in a familiar currency without losing the source-market amount or confusing a convenience conversion with authoritative price data.

**Implications:** Runtime offer presentation reuses the same Bank of Canada conversion layer as benchmark presentation when an optional stored offer conversion is absent. Conversion failure falls back to native currency. Native data, benchmark semantics, raw-price ordering, persistence, and ingestion remain unchanged; no schema or migration is required. This supersedes the native-first presentation ordering in the 2026-09-12 benchmark-conversion implication without changing its data-authority rule.

### 2026-10-01 — Retailer price comparison is the primary product promise

**Status:** Accepted

**Decision:** Position PuruPuru first as a skincare price-comparison and shopping-intelligence product that helps shoppers compare available retailer prices for the exact product and size they want, identify the best tracked buying option, and save money. Use brand + product name + size as the normal shopper identity; expose ProductVersion or formula distinctions only when they materially affect a purchasing decision.

**Why:** Price differences across retailers are the immediate, legible shopper problem PuruPuru solves. Internal identity, provenance, and evidence systems build trust in that answer but should not require technical understanding or obscure the money-saving benefit.

**Implications:** Homepage, catalogue, comparison, About, metadata, and future public messaging lead with compare prices, shop smarter, and spend less while avoiding claims of universal internet coverage. Exact-size matching, retailer identity, native pricing, benchmark semantics, provenance, history, version isolation, and affiliate-neutral raw-price ordering remain unchanged as trust infrastructure. No schema, ingestion, or pricing-behavior change is required.

### 2026-10-07 — Canadian product pages and catalogue filters prioritize the primary shopping task

**Status:** Accepted

**Decision:** Keep the Canadian product page focused on `Buy in Canada`, a compact verified benchmark, and recorded CAD price history. Do not show a second foreign-market offer table or native-currency history chart there. Catalogue brand and canonical-category filters support repeated, shareable multi-select query values; category parents control their descendant leaves independently from expansion, and table sort headers expose only the active direction.

**Why:** Foreign purchase tables and parallel currency charts added visual weight without improving the primary Canadian retailer comparison. Multi-select filters and unambiguous sort state make the dense exact-variant catalogue more useful without changing product identity or pricing semantics.

**Implications:** Foreign offers and native `PriceObservation` records remain intact for future market-specific experiences. The benchmark retains authoritative native-market context and approximate CAD presentation. Repeated `brand` and `category` query parameters use OR within each dimension and compose with other dimensions; legacy scalar URLs remain valid. No schema, migration, ingestion, or domain-identity change is required. This supersedes the public product-page presentation portions of the 2026-08-31 continuous-market decision while preserving offer-market semantics.

### 2026-10-07 — PuruPuru owns public identity; Clerk owns private account identity

**Status:** Accepted

**Decision:** Extend the existing Clerk-linked `User` record with a first-party avatar selection and independent sensitive-skin flag. PuruPuru owns the validated display name, avatar, and optional skin-profile context; Clerk remains authoritative for full/private name, email, password/security, sessions, and connected accounts. Primary skin type is limited to Normal, Dry, Oily, or Combination, while sensitivity is independent. Avatar choices come only from an active, locally hosted catalogue with stable IDs.

**Why:** PuruPuru needs a reusable in-product identity without duplicating authentication data or allowing unsafe arbitrary image URLs. Sensitivity is not a mutually exclusive skin type, and a curated first-party catalogue keeps profile imagery consistent and reversible.

**Implications:** `/profile` is private and user-scoped and initializes missing app-owned values safely for existing Clerk users. Legacy `SENSITIVE` and `NOT_SURE` enum values are normalized during the additive migration and are not used by current profile writes. Public profile pages, public review/rating history, uploads, rewards, contributions, and social features remain out of scope. The 2026-10-08 first-party account-security decision supersedes the Clerk account-management-modal portion of this implication.

### 2026-10-08 — Account deletion is first-party and local-data-first

**Status:** Accepted

**Decision:** Remove Clerk's generic account-management modal from normal PuruPuru UX. Keep Clerk for authentication and sign-out, show only read-only email context on `/profile`, and provide an explicit first-party account-deletion dialog requiring exact `DELETE` confirmation. Delete the authenticated user's local data in a serializable transaction before deleting that same user through Clerk's supported Backend API.

**Why:** PuruPuru owns the visible profile experience, while account deletion must cover both app-owned data and the backing authentication identity without accepting a client-selected target. Local-first ordering prioritizes removal of personal application data; the remaining cross-system failure mode is explicit and retryable rather than silently successful.

**Implications:** Delete `CollectionTag`, `CollectionEntry`, `UserRating`, `Review`, `PurchaseInstance`, `ShoppingListItem`, `ShoppingList`, and `User` records in foreign-key-safe order. Preserve shared product/catalogue, offer/history, retailer, benchmark, `ProfileAvatar`, and ingestion-audit records. A Clerk failure after local commit returns a retry-required state; missing local data and Clerk 404 responses are idempotent success cases. Reviews are deleted rather than anonymized. The account-deletion foundation itself required no migration; the later Review model is additive.

### 2026-10-08 — Public reviews aggregate by shopper-facing product family

**Status:** Accepted

**Decision:** Keep the existing private, half-step, version-scoped `UserRating` unchanged and add a distinct public `Review`. A Review is unique per user and `ProductFamily`, requires a whole-star 1–5 rating and exact active variant used, derives its ProductVersion from that variant, and may include normalized text. Skin type and sensitivity are review-time snapshots; public display name and curated avatar resolve from the author's current PuruPuru profile.

**Why:** Collection feedback and public product reviews answer different questions and use different scales/scopes. Family aggregation matches the normal brand + product + size shopping model while exact variant and exceptional meaningful version context keep each review honest. Historical skin context should remain stable, while a current first-party identity should update without exposing Clerk data.

**Implications:** Product pages show a clickable family average/count beneath the product name, an accessible distribution, a bounded newest-first feed, and authenticated create/edit/confirmed-delete controls. Database uniqueness and a 1–5 check protect the core constraints; server writes enforce family/variant integrity, ownership, profile-derived snapshots, and mutation throttling. No catalogue/search ratings, public profiles, votes, comments, media, reporting, verified-purchase badges, incentives, or denormalized aggregate columns are introduced. Account deletion explicitly removes the user's reviews and preserves shared catalogue data.
