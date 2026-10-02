# Roadmap V0

The roadmap protects focus. Items listed later are not promises or requirements for the current build.

Across phases, PuruPuru's primary outcome is helping shoppers compare available retailer prices for the exact skincare product and size they want, choose the best tracked buying option, and save money. Product identity, provenance, benchmarks, price history, collections, and planning features support that outcome rather than replacing it.

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

Status: implementation foundation complete. The monorepo, database schema and migrations, Neon connection, Clerk foundation, and shared package boundaries are operational. The first read-only catalogue slice is implemented as the opening Phase 2 increment; personal actions listed below remain unimplemented.

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

Status: started. The catalogue slice includes two curated product families, canonical category browse, product/brand search, size selection with exceptional formula selection, benchmark and external-signal display, and offer sections backed by PostgreSQL. Authenticated version-level Want, Tried, Owned/purchase, Holy Grail, Would Repurchase, private half-step rating actions, private target-market shopping lists, and the private version-normalized My Collection browse view are now implemented. A first integration pass now connects navigation, current-version catalogue state, version/variant-preserving links, product save/list actions, responsive offer presentation, and shared loading/error states. Shopping lists include exact-variant quantities, partial purchase recording, eligible offer selection, runtime CAD conversion, and partial-estimate coverage disclosure. A small, explicitly demo-labeled, exact-variant retailer price-history foundation is also implemented. Developer retailer ingestion normalizes two local source fixtures and safely maintains uniquely matched offers/history using identifiers or uncontradicted brand/product/exact-size evidence. A separate admin-only staged product-graph path now accepts a versioned machine contract, retains provenance, plans conservative identity matches, and atomically commits explicit approvals; its additive migration and production admin allowlist require deployment configuration. Automated source collection and alerts remain deferred. The public homepage, dedicated catalogue/category navigation, early trust/legal page structure, and a version/variant-safe curated product-image foundation are also implemented. Product-image permissions/hosting and legal copy still require professional review before launch. Purchase-detail editing, onboarding, collection statistics, and catalogue expansion remain outstanding.

Deliver:
- ~100 curated skincare products
- ~3–5 reliable pricing sources / benchmark routes
- search + autocomplete
- browse by canonical category / simple category-filtered views
- brand result/minimal brand page
- onboarding preferences
- Want / Owned / Tried
- Holy Grail / Would Repurchase
- multiple PurchaseInstances
- private numeric ratings
- optional private user-created thematic collections if scope permits; they are not core MVP organization
- drag/drop collection interactions where stable
- shopping-list quantities and estimate coverage warnings
- collection statistics basics

## Phase 3 — MVP launch / validation

Goals:
- public anonymous browse
- real users
- instrument core behavior
- identify whether people return before purchases

Track:
- product searches/session
- product-page depth
- offer click-through
- Want additions
- shopping-list additions
- account conversion after gated actions
- return visits
- collection completion behavior
- qualitative “I checked this before buying” feedback

Do not optimize vanity metrics at the expense of trust.

## Phase 4 — Early community/data contribution

Potential features after core usage is proven:
- public written reviews
- community price submissions
- receipt-photo proof submissions
- verification/moderation workflow
- contributor reputation/badges
- Founding Contributor status
- user-created public collections
- creator collections
- profile showcases

No cash-per-submission system initially; avoid creating fraud incentives.

## Phase 5 — Receipt intelligence

Future high-value loop:
- upload receipt
- OCR/extract retailer/date/line items/prices
- product/variant matching
- confirmation UI with detected items checked
- user corrections before commit
- check shopping-list quantities as purchased
- create PurchaseInstances
- update collection
- contribute verified PriceObservations

The feature should save the user work first; community data is a secondary benefit.

## Phase 6 — Shopping intelligence expansion

Potential:
- broader trustworthy retailer coverage for more useful best-tracked-price comparisons
- more Canadian retailers
- additional international affiliate feeds
- Amazon authorized product APIs once eligible
- retailer partnerships/direct feeds
- production source adapters/authorized feeds and scheduled ingestion
- expanded and automated historical observed prices
- price alerts
- richer shipping information
- better local-market reference coverage
- travel-mode summaries

Avoid promising universal landed-cost/tax calculations until data quality supports it.

## Phase 7 — Personalization and discovery

Potential:
- stronger interest-based home feed
- list recommendations
- similarity/taste profiles
- local-market trending when legitimate repeatable data exists
- active-ingredient taxonomy
- browse/filter by actives
- beauty annual recap / “Beauty Wrapped”

Skin type may support non-medical discovery context; avoid diagnostic claims.

## Phase 8 — Monetization refinement

Likely first path:
- affiliate commerce revenue

Possible premium later, only after observing willingness to pay:
- unlimited/high-volume receipt imports
- advanced price alerts/history
- deeper trip analytics
- advanced collection analytics
- power-user organization
- premium cosmetics/profile customization

Core participation, collection, standard comparison, and contribution should remain broadly accessible.

## Very-late expansion

Only after skincare product-market fit:
- makeup
- haircare
- beauty devices
- fragrance
- native mobile app
- broader countries/markets

Fragrance is structurally compatible with collection + pricing + variant intelligence but should not distract from skincare execution.
