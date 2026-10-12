# Roadmap V0

The roadmap protects focus. Items listed later are not promises or requirements for the current build. [`PRODUCT_VISION.md`](PRODUCT_VISION.md) is authoritative for product strategy; this file sequences that direction while retaining completed implementation history.

Across phases, PuruPuru should become an enjoyable skincare storefront with independent exact-size retailer comparison underneath. Product identity, provenance, benchmarks, price history, collections, and personal tools support discovery and smarter purchasing rather than replacing them.

## Current strategic priorities

1. Complete the storefront Browse and navigation direction.
2. Add provenance-aware structured product intelligence for concerns, skin types, texture, ingredients, benefits, and fragrance.
3. Add guided `Help Me Choose`, explainable similar products, and trustworthy dynamic discovery collections.
4. Add privacy-conscious basic analytics instrumentation, including impressions alongside interactions.
5. Build a persistent smart cart with exact variants and per-item retailer selection.
6. Add an internal analytics dashboard.
7. Improve online retailer coverage, offer freshness, availability, and honest sale/price-drop presentation.
8. Enhance product galleries and details.
9. Add shipping-aware basket optimization and price alerts only when data quality supports them.
10. Continue targeted catalogue expansion where it materially improves useful coverage.

Travel-shopping workflows are no longer an active strategic priority. Existing Shopping Lists remain implemented and supported until a separate, data-safe cart migration or reuse decision is made.

## Phase 0 — Feasibility and product definition

Status: complete enough to begin Phase 1.

Goals:
- Validate retailer pricing access paths.
- Define canonical product/version/variant/offer model.
- Establish trust/data rules.
- Define product page and core flows.
- Create durable repo documentation.
- Confirm the settled MVP stack and architecture.

Exit criteria:
- At least several representative Korean/Japanese products can be modeled with meaningful price/benchmark data.
- Product page can be described end-to-end.
- No core MVP feature depends exclusively on questionable scraping.

## Phase 1 — Foundation / first vertical slice

Status: complete. The monorepo, database schema and migrations, Neon connection, Clerk foundation, shared package boundaries, and first end-to-end catalogue slice are operational.

Build infrastructure and one strong end-to-end functional product page, not the whole platform.

The first UI is a clean, usable functional layout rather than final visual design. Prioritize application/framework and repository setup, database, authentication, canonical product/category/version/variant data, retailer/offer/reference-price data, search, collection behavior, shopping lists, product-page rendering, routing, and permissions. Presentation components should remain modular so visual redesign does not require domain or business-logic changes.

Use the settled MVP stack: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Prisma, Clerk, Vercel, and Neon.

Suggested reference product: ANESSA Perfect UV Skincare Gel because it exercises versions, variants, Japanese benchmark price, external signals, sparse Canadian availability, and bundles.

Deliver:
- monorepo scaffold
- web app shell
- database/domain packages
- database and authentication foundation
- seed data path
- product family/version/variant model
- canonical skincare category hierarchy and primary ProductFamily category
- retailer/offer model
- benchmark price model
- external signal model
- product page
- routing and permissions
- version + variant selector
- `Buy in Canada` and destination-market offer sections
- Want / basic auth flow
- Add to Shopping List
- tests for version isolation and offer sorting

## Phase 2 — MVP catalogue and personal collection

Status: started. The database-backed catalogue includes canonical category browse, product/brand search, exact-size selection with exceptional formula selection, benchmark and external-signal display, market-aware retailer offers, tracked price history, and a first product-page ratings/reviews foundation. Authenticated Want, Tried, Owned/purchase, Holy Grail, Would Repurchase, private half-step ratings, target-market shopping lists, My Collection, and a private first-party Profile are implemented. Navigation, personal catalogue state, version/variant-preserving links, responsive offer presentation, and shared loading/error states connect the core journey. Developer fixture ingestion and a separate admin-reviewed product-graph workflow conservatively match identity, retain provenance, and commit atomically. Automated source collection and alerts remain deferred. Product-image permissions, legal copy, broader onboarding, review moderation/reporting, collection statistics, and catalogue expansion remain launch work.

Deliver:
- ~100 curated skincare products
- ~3–5 reliable pricing sources / benchmark routes
- search + autocomplete
- browse by canonical category / simple category-filtered views
- brand result/minimal brand page
- onboarding preferences
- first-party display name, curated avatar, and optional private skin profile
- Want / Owned / Tried
- Holy Grail / Would Repurchase
- multiple PurchaseInstances
- private numeric ratings
- product-family rating aggregates and bounded whole-star reviews with exact-size context
- optional private user-created thematic collections if scope permits; they are not core MVP organization
- drag/drop collection interactions where stable
- shopping-list quantities and estimate coverage warnings
- collection statistics basics

## Phase 3 — Storefront validation and instrumentation

Goals:
- public anonymous browse
- real users
- complete the image-first storefront and shopper-friendly navigation direction
- instrument core behavior with appropriate privacy, consent, and retention
- identify whether people enjoy browsing and return before purchases

Track:
- product impressions and detail views
- product searches/session and searches with no results
- filter usage
- product-page depth
- offer impressions and click-through
- Want additions
- cart/list additions and revisits
- account conversion after gated actions
- return visits
- collection completion behavior
- qualitative “I checked this before buying” feedback

Do not optimize vanity metrics at the expense of trust.

## Phase 4 — Smart cart and internal analytics

Build a persistent exact-variant cart that defaults each item to the lowest eligible tracked offer, permits retailer overrides, groups selections by retailer, and shows CAD item/basket totals. Price changes and unavailable offers must remain explicit; item subtotals stay separate from shipping and tax. There is no PuruPuru-hosted checkout in this phase.

Add an internal dashboard for traffic, discovery, cart, outbound-click, product, brand, category, and retailer-offer performance. Measure impressions alongside clicks so placement does not masquerade as preference, and never interpret an outbound click as a completed purchase.

## Later — Community/data contribution

Potential features after core usage is proven:
- review reporting, moderation, helpful votes, media, and replies
- community price submissions
- verification/moderation workflow
- contributor reputation/badges
- Founding Contributor status
- user-created public collections
- creator collections
- profile showcases

No cash-per-submission system initially; avoid creating fraud incentives.

## Later — Shopping intelligence expansion

Potential:
- broader trustworthy retailer coverage for more useful best-tracked-price comparisons
- more Canadian retailers
- additional international affiliate feeds
- Amazon authorized product APIs once eligible
- retailer partnerships/direct feeds
- production source adapters/authorized feeds and scheduled ingestion
- expanded and automated historical observed prices
- fresher offer availability and price verification
- price alerts
- richer shipping information
- better local-market reference coverage
- shipping-threshold and delivered-basket optimization

Avoid promising universal landed-cost/tax calculations until data quality supports it.

## Planned — Guided discovery and product intelligence

Build on the existing catalogue and ingestion boundaries without choosing the database design prematurely:

- provenance-aware structured metadata for concerns, skin types, texture, key ingredients, benefits, and fragrance;
- multiple concerns and skin types per product, with meaningful formulation differences retained at `ProductVersion`;
- a no-account, non-chatbot `Help Me Choose` questionnaire with optional product-type, concern, preference, and budget inputs;
- a small explainable result set based only on populated reliable metadata;
- product-page similar products and alternatives matched initially by function, concern, texture, and price;
- dynamic collections such as Skincare Under $20, Best Deals Right Now, Popular Products, and regional discovery;
- explicit separation of regional popularity evidence from brand origin.

Do not claim equivalence, popularity, a sale, or a deal without sufficient evidence. Skin type and concerns provide non-medical shopping context only.

Personal shelves such as Favourites, Want to Try, and Currently Using remain secondary to storefront discovery and the smart cart. Purchase verification, manual purchase-history analytics, receipt scanning/OCR, and annual Wrapped features are retired from active planning. Preserve existing code and data until separately changed.

Skin type may support non-medical discovery context; avoid diagnostic claims.

## Later — Monetization refinement

Likely first path:
- affiliate commerce revenue

Possible premium later, only after observing willingness to pay:
- advanced price alerts/history
- power-user organization
- premium cosmetics/profile customization

Core participation, collection, standard comparison, and contribution should remain broadly accessible.

Affiliate referrals, retailer partnerships, and better product feeds must preserve independent price ranking. A unified multi-retailer checkout is a separate long-term business possibility requiring merchant agreements and substantial payment/order infrastructure; it is not an MVP feature or a commitment in this roadmap.

## Very-late expansion

Only after skincare product-market fit:
- makeup
- haircare
- beauty devices
- fragrance
- native mobile app
- broader countries/markets

Fragrance is structurally compatible with collection + pricing + variant intelligence but should not distract from skincare execution.
