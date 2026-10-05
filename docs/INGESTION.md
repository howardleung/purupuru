# Retailer/source ingestion foundation

This is PuruPuru's developer-operated, local ingestion path for trustworthy retailer records. It is intentionally not a scraper, scheduler, feed platform, or automatic catalogue creator.

PuruPuru also has an admin-only staged product-graph path for researched catalogue additions. Unlike the retailer-listing CLI described below, it may propose new brands, families, versions, variants, retailers, offers, images, and benchmarks, but it never publishes a submitted payload automatically.

## Staged product imports

The machine contract is JSON Schema version `1.0` at [`schemas/product-import-v1.schema.json`](schemas/product-import-v1.schema.json), with a complete illustrative payload at [`examples/product-import-v1.json`](examples/product-import-v1.json). The runtime TypeScript validator is the authoritative write boundary and additionally normalizes whitespace, slugs, GTIN separators, market codes, currencies, units, timestamps, and URLs without inventing absent facts.

The workflow is:

`authenticated admin submission → validation/normalization → conservative identity plan → durable review batch → explicit admin approval → serializable atomic commit`

The server-side admin endpoint accepts one bounded, versioned JSON batch and returns its review status, structured findings, and proposed create/reuse/update/conflict plan. Repeating a request with the same `idempotencyKey` returns the original batch and does not rerun writes. Submission cannot commit catalogue records.

Review is available at `/admin/imports`. A reviewer sees retained raw and normalized source data, provenance, validation findings, identity decisions, and the write plan. `NEEDS_REVIEW` includes verification warnings or blocking identity conflicts; only the explicit **Approve and commit batch** action attempts a commit. Commit revalidates and replans inside the same serializable transaction so stale review decisions cannot silently win. Any conflict or write failure rolls the entire product graph back.

The batch retains fact-level provenance for product/version identity, variant identifiers, images, benchmarks, and offers. `commitResult` maps the audit record to committed family/version/variant IDs. Existing entity-specific source fields remain populated. This preserves an inspectable source record without scattering a speculative provenance relation through every catalogue table.

Product images must identify an approved brand or retailer source, preserve a source-page URL and descriptive alt text, and target the exact variant when packaging is size-specific. Version-wide images are appropriate only when the same image safely represents every size in that version. Before committing an image from a new external hostname, add that hostname to the shared web image allowlist so both Next.js image loading and the Content Security Policy permit it; otherwise the catalogue may retain an image record that the web app cannot deliver.

Matching keeps exact identifiers as the strongest evidence but does not require them for an ordinary product. GTIN is considered first, then scoped SKU, then an uncontradicted existing brand/product/exact-size match. Conflicting identifiers and multiple plausible meaningful versions block commit. Canonical categories must already exist and are never created by an import. Separate `ProductVersion` records are reserved for concrete shopper-relevant formula, function, regulatory-market, packaging-generation, or simultaneous-release differences; a barcode, SKU, release year, or minor packaging refresh alone does not justify another version.

Offers are active by default when `isActive` is omitted. An explicit `isActive: false` is a narrowly scoped, reversible correction: it requires an exact existing retailer/listing identity (or the established exact retailer + URL fallback), stages an explicit deactivation with a review warning, and commits only the offer's activation state. It cannot create an offer, delete catalogue identity, replace offer items, or create a price observation. An exact inactive offer can be reactivated with `isActive: true`; unchanged price/timestamp evidence does not create a duplicate observation. Historical observations remain intact in both directions.

Admin authorization uses Clerk's verified server-side identity and a server-only deployment allowlist. Administrator identities and authentication material must remain outside source control and client-visible configuration. The authenticated mutation rate limit also applies.

Migration `20260926120000_add_staged_product_imports` creates only the import status/source enums and `ImportBatch` audit table. Apply the reviewed migration with `pnpm db:migrate:deploy` through the normal deployment process before enabling the endpoint. It does not alter existing catalogue rows.

### Workflow verification

In a configured development environment, an authorized reviewer can submit the illustrative example, confirm that it remains in review because its claims are explicitly unverified, replay it to verify idempotency, and inspect the proposed identities and provenance before approval. A committed batch must remain a single graph, and reusing its idempotency key with different content must conflict. Never embed authentication material in a payload, fixture, or repository file.

## Safety posture

The pipeline is:

`source adapter → normalized listing → conservative canonical match → offer upsert → dated PriceObservation`

A source listing may update commerce data only after it uniquely matches an existing canonical `ProductVariant`. The pipeline never creates a `Brand`, `ProductFamily`, `ProductVersion`, or `ProductVariant` from low-confidence retailer text. Unmatched and ambiguous records are review outcomes, not partial writes. Execute mode handles each input independently in a serializable database transaction; dry-run uses the same reads and decisions with no writes.

## Normalized listing contract

Every adapter emits one source-agnostic `NormalizedSourceListing`. Missing source values stay explicitly `null` (or an empty verified-market array) rather than being guessed.

The contract preserves:

- stable lowercase namespaced retailer/source key
- retailer external listing ID when supplied
- canonical source URL
- product title and brand evidence
- GTIN and manufacturer SKU when supplied
- version code, release date/year, formulation fingerprint, and packaging evidence when supplied
- exact display size plus normalized quantity/unit when supplied
- native price and currency
- finite availability state
- customer/delivery markets the offer is known to serve
- optional offer-level shipping fields
- structured bundle/extra items when supplied
- actual source observation timestamp and verification type

`availableMarkets` is delivery/customer eligibility for this exact listing. It is independent of the retailer/storefront country. Missing markets mean unverified eligibility, not worldwide delivery.

## Canonical matching

Matching is intentionally conservative and follows this evidence order:

1. exact GTIN
2. exact manufacturer SKU
3. exact brand, product title, and normalized size, provided there is no contradictory evidence
4. explicit material-version evidence to disambiguate multiple otherwise compatible candidates

Exact size prevents observations and offers from crossing variants. A missing barcode or release label is not itself a warning or rejection when brand, product, and exact size resolve uniquely. Conflicting GTINs, sizes, formulas, regional versions, or other supplied evidence are rejected; multiple compatible candidates are `ambiguous`. Brand/title without exact size remains `unmatched`. No outcome in this foundation automatically creates canonical catalogue identity.

## Offer identity and current state

When the source supplies an external listing ID, `(retailerId, retailerListingId)` is the stable offer identity. This lets a canonical listing URL change without creating a duplicate offer. When no external ID exists, the fallback is `(retailerId, exact ProductVariant, listingUrl)`; the schema's retailer/URL uniqueness prevents duplicate rows.

Storefronts with materially distinct currency, catalogue, pricing, or inventory remain separate `Retailer` records. Identical external IDs at two storefront records therefore do not merge.

A newer or equal source timestamp may update the current `Offer` fields. An older observation may be appended to history but cannot roll back the current offer. Native currency cannot silently change on an existing stable offer. A product-price change clears any optional cached CAD snapshot so stale converted values are not retained.

## Historical observations and idempotency

Ingestion-created observations have an optional direct `offerId` relation in addition to their required exact `productVariantId`. The unique `(offerId, observedAt)` key makes an identical source rerun a no-op. A genuinely new source timestamp creates one new native-currency observation, even when the price is unchanged. Reusing a timestamp with different price/currency is rejected before any mutation.

Legacy/manual observations may keep `offerId = null`. Product history continues to read those through the conservative variant + retailer + source-URL fallback. When an execute run finds an exact matching legacy null-linked observation, it links that row instead of creating a duplicate. Deleting an offer sets its observations' `offerId` to null rather than deleting price history.

Migration `20260913180000_add_ingestion_offer_identity` is additive: it adds the nullable column, stable listing and observation unique indexes, and an `ON DELETE SET NULL` foreign key. It does not rewrite or delete historical rows.

## Developer CLI

The included adapters read local fixtures only:

```text
pnpm ingest --fixture well-round-lab --dry-run
pnpm ingest --fixture shiseido-anessa --dry-run
pnpm ingest --fixture all --dry-run
pnpm ingest --fixture well-round-lab --execute
pnpm ingest:verify
```

Dry-run is the default if neither mode flag is supplied. `--execute` is always explicit. Output includes the canonical match evidence, offer action and changed fields, observation action, and errors. Status vocabulary is `matched`, `created`, `updated`, `unchanged`, `unmatched`, `ambiguous`, or `rejected` as appropriate to the stage.

`pnpm ingest:verify` uses a unique local QA listing inside a transaction, runs the identical source twice, runs one later changed-price observation, verifies one offer and two observations, and deliberately rolls the transaction back. It proves database behavior without retaining QA data.

## Fixture adapters and scope

- `well-round-lab.json` demonstrates a nested Canadian retailer record.
- `shiseido-anessa.json` demonstrates a differently shaped official Japanese storefront record.

These fixtures exercise normalization and matching against the curated Round Lab and ANESSA catalogue. They are local development inputs, not claims of live access or continuing retailer authorization. Automated fetching, scheduled ingestion, scraping, affiliate feeds, product-creation review tooling, alerts, and production operations remain deferred.
