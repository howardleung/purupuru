# Retailer/source ingestion foundation

This is Otoku's developer-operated, local ingestion path for trustworthy retailer records. It is intentionally not a scraper, scheduler, feed platform, or automatic catalogue creator.

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
3. explicit version evidence (version code, release date/year, formula, or packaging) together with exact brand, product title, and size

Exact size prevents observations and offers from crossing variants. Conflicting source evidence is rejected. Multiple compatible candidates are `ambiguous`. Brand/title-only candidates are `unmatched` and require review. No outcome in this foundation automatically creates canonical catalogue identity.

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