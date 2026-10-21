# Architecture

PuruPuru is a pnpm workspace: `apps/web` is the Next.js application; `packages/domain`, `packages/database`, and `packages/ui` are shared packages; `scripts/import` runs developer-operated ingestion; `tests/domain` contains Node test-runner coverage. The documented structure is intentional even where the current implementation is small.

## Dependency boundaries

| Concern | Current home | Rule |
| --- | --- | --- |
| Domain rules and pure transformations | `packages/domain/src` | Presentation- and Prisma-independent rules: collection, shopping-list, ingestion matching, price history, and product-image contracts. |
| Schema and Prisma client | `packages/database/prisma`, `packages/database/src` | PostgreSQL schema, migrations, seed data, and the shared Prisma client only. |
| Reads and server orchestration | `apps/web/lib` | Server-only query helpers assemble read models and enforce current-user context. Shape queries deliberately to avoid N+1 work. |
| Mutations | `apps/web/app/**/actions.ts`, colocated server action files, `apps/web/lib` | Authenticate, validate, enforce ownership, invoke domain rules, and use transactions for compound writes. |
| UI | `apps/web/app`, `apps/web/components`, `packages/ui` | Routes and React components render supplied models and capture interaction; they do not own canonical business rules or access Prisma. |
| Ingestion | `scripts/import`, `packages/domain/src/ingestion.ts`, `packages/domain/src/product-import.ts`, `apps/web/lib/admin/product-import-service.ts` | Developer adapters normalize retailer records; the staged admin path validates a versioned product graph, records a review plan, and atomically commits only explicit approvals. Matching is conservative in both paths. |
| Tests | `tests/domain` | Test public domain contracts and persistence-sensitive behavior at the lowest useful layer. |

`apps/web` may depend on workspace domain/database/UI packages. `packages/domain` must remain independent of React, Next.js, Prisma, and infrastructure. Database access belongs on the server; client components receive serializable view data and invoke narrow server actions.

The web production build generates Prisma Client before `next build`. Next.js traces from the workspace root and explicitly includes the generated client in pnpm's virtual store so server functions ship the build platform's Prisma query engine. Do not commit generated clients or engine binaries.

## Data and write boundaries

The canonical identity chain is `ProductFamily → ProductVersion → ProductVariant → Offer`. Version and exact variant context must travel through links, queries, and mutations. Canonical catalogue identity is not created from uncertain retailer text: source adapters normalize untrusted input, matching requires sufficiently strong evidence, and unmatched or ambiguous records stay review outcomes. See `INGESTION.md`.

Prisma migrations live beside the schema. Review generated SQL, backfill needs, indexes, constraints, locking, and compatibility before applying a migration. Use transactions for compound state changes; the existing personal-collection write paths use serializable transactions with bounded conflict retry. Retryable ingestion uses stable source identities and must remain idempotent.

All private data access starts from the active authenticated user and scopes reads and writes by ownership. Do not accept a user ID, list ID, or collection ID as authority without verifying its relation to that user.

Account deletion derives the target only from the verified Clerk session. Local user-owned records are deleted first in one serializable transaction, ordered around the schema's restrictive foreign keys; the Clerk Backend API deletes that same authenticated identity only after local cleanup commits. If Clerk deletion then fails, the application reports a retry-required partial state rather than claiming success. A retry is idempotent when local data or the Clerk identity is already absent. Shared catalogue, avatar-catalogue, and ingestion-audit records are never part of this deletion boundary.

Collection and shopping-list actions share `apps/web/lib/transactions.ts` for serializable transactions with up to three attempts on Prisma `P2034` write conflicts. Do not duplicate this retry policy in route-specific action files. Developer retailer ingestion remains a separate CLI operation with its own transaction boundary. Staged product imports use a narrow admin API/review UI and a serializable whole-batch transaction; they do not expose general database operations.

Mutation DTOs are untrusted at runtime: `apps/web/lib/input-validation.ts` checks required IDs and payload shapes before queries. `getMutationUser` uses verified Clerk identity for the shared write budget before profile upsert. The live-search API has a separate trusted-ingress IP budget; ordinary page, React Server Component, prefetch, and refresh requests are not charged because one navigation may issue several framework requests. Production rate-store failures fail closed at protected boundaries. Security headers and safe external navigation are boundary protections, not domain rules. See the root `SECURITY.md` for the public security policy.

## Practical placement

Before adding a helper, look for an existing domain module or server helper. Put a stable, pure rule in `packages/domain`; keep Prisma query composition in server-only code; keep request/session handling and revalidation at the Next.js boundary; keep rendering and transient interaction in components. Introduce a new package, layer, or repository abstraction only when an existing boundary cannot express the need clearly.

## Planned discovery architecture

Guided discovery, similar products, and dynamic collections should extend the existing boundaries rather than introduce a separate AI or recommendation platform. Structured product intelligence enters through the versioned, provenance-aware ingestion path; stable matching/scoring rules belong in the domain layer; server reads assemble bounded result models; UI explains why each product matched.

Planned attributes include multiple skin concerns and skin types, texture, key ingredients, benefits, and fragrance information. Store manufacturer claims distinctly from independently verified facts and retain meaningful `ProductVersion` formulation context. Exact schema, taxonomy, confidence, and source-shape decisions are deferred until implementation and migration review.

Initial recommendations should be deterministic and explainable. `Help Me Choose` must work without authentication or a chatbot. Similar-product matching may consider function, concern, texture, and price, but cannot claim equivalence without supporting evidence. Dynamic deal and popularity collections must derive from eligible tracked prices, trustworthy price/sale history, or attributable behavior/market signals—not static labels or brand origin.

Receipt scanning/OCR and purchase-verification pipelines are not active architectural priorities. Preserve current purchase-related records and behavior, but invest new data work in online retailer feeds, offer freshness, availability, and trustworthy product metadata.

## Likes and preserved Collection history

`ProductLike` is a small PostgreSQL preference table keyed by user and meaningful version. `apps/web/lib/likes.ts` owns user-scoped reads and idempotent persistence; `app/likes/actions.ts` owns verified authentication, validation, cookies and revalidation. One shared client LikeProvider loads the authenticated Like set and coordinates optimistic hearts across sizes and surfaces. Components do not access Prisma.

The guest invitation uses existing Clerk SignIn/SignUp flows. A ten-minute HTTP-only, same-site authentication-request cookie survives redirects; it is not guest Like persistence. Dismissal cancels the request and completion revalidates its product/version. Authentication closes the guest invitation before database loading. Successful or invalid handoffs consume the request; transient failures retain its original expiry for explicit retries. Expired requests require a fresh user action. Like reads return explicit failure states rather than an empty collection; recovery reloads before choosing add/remove when saved state is unknown. Optional analytics and personalization are not part of Like persistence.

## Optional analytics (Phase 1)

The web client sends explicit typed events to PostHog's US Capture API only after a versioned, unexpired affirmative browser preference. No SDK or automatic collection is loaded: autocapture, automatic page views, heatmaps, replay, form capture and account identification are absent. The provider starts with collection off; footer preferences offer equal Accept/Reject controls and withdrawal. Only preference metadata is persisted in localStorage (180-day expiry). Anonymous identity exists in memory per tab/reload, is cleared on withdrawal, and never uses Clerk IDs. It cannot measure returning visitors reliably.

`analytics-contract.ts` defines canonical public product IDs and a closed route-template allowlist. Search parameters and real path values are used locally for navigation deduplication, never transmitted. Private account/list IDs, raw URLs, referrers, search text, Skin Map and notes are excluded. Unknown, admin, design, auth and profile routes are excluded. Capture is disabled outside production, on localhost, and on Vercel preview deployments. Missing/invalid environment configuration disables capture. Transport omits cookies/referrers, disables person profiles and IP geolocation, catches failures, and cancels in-flight requests on withdrawal. Already transmitted events cannot be recalled; browser blocking and network failures can undercount. There is no retry buffer or analytics database.

Page views count committed path/query navigation once, including back/forward revisits. Product views use resolved family/version/variant IDs and deduplicate rerenders/effect replay per navigation. Variant selection counts a new navigation/view. Consent acceptance records only the current page/product, without replaying prior actions. Retailer links reuse a fail-open client anchor for product offers, price history and Shopping Lists (left/keyboard and middle-click activation). Events contain offer/retailer IDs and fixed placements, never destination URLs or private list IDs. Context-menu opening cannot be measured reliably. Outbound events indicate shopping intent, not purchases or revenue.

Native Web Analytics compatibility uses `$pageview` instead of `page_viewed` (no dual emission or historical rewrite). Schema version 2 adds `$current_url`, `$pathname`, `$host` and `$session_id` on all five event types, plus an explicit capture timestamp. URLs use the canonical public origin `https://www.purupuru.ca` from README and only allowlisted route templates, e.g. `/products/[slug]`; no real slug, list ID, query or fragment is sent. `page_path`, `route_type`, `page_view_id` and canonical catalogue IDs remain available.

Custom sessions follow [PostHog's session requirements](https://posthog.com/docs/data/sessions): cryptographically random RFC 9562 UUIDv7 IDs with the creation millisecond encoded, consistent across recorded events until 30 minutes without a recorded event or 24 hours maximum. Clock rollback also starts a new session. The event timestamp uses the same client clock so its session window is explicit. Session and visitor IDs exist only in memory and reset on consent withdrawal or reload; tabs do not share identity. These choices fragment visits across reloads/tabs and prevent reliable returning-visitor or cross-visit attribution. Activity means only the five consented events; reading, scrolling and background activity do not extend sessions. Duration, engagement and bounce metrics are incomplete without page-leave/automatic activity capture, which remains disabled. Referrers/UTMs and browser/device properties remain absent; acquisition/device breakdowns are unavailable or incomplete, and geolocation remains disabled. Template URLs intentionally aggregate all products under one path; product-level analysis must use canonical IDs. Historical `page_viewed` events remain custom events and are not retroactively native pageviews.

Like persistence remains PostgreSQL-owned and independent of consent. Add/remove mutations attach canonical family/version transition metadata only when the affected-row count is positive; idempotent no-ops and failures produce no analytics transition. Browser capture follows server success, including authentication continuation, with transition-ID deduplication. No schema changes are required. Dashboard, affiliate attribution, recommendations, popularity labels and broader event tracking remain deferred.

Configure `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` at web build time for project 677697. The project token is distinct from the numeric project ID; it must come from deployment configuration. Before activation, review the draft privacy page, Canadian/provincial consent and youth applicability, US processing/DPA, retention/deletion operations and project IP settings. Do not enable project-side collection/enrichment that defeats this event allowlist.

`/likes` reuses catalogue product cards and exact-version price/image selection. `/collection` redirects there. Existing purchase/rating/relationship records and private history remain at `/collection/legacy`, without backfilling Likes. No legacy table is dropped by this change.
