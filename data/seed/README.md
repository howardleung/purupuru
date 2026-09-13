# Curated seed provenance

The executable seed is `packages/database/prisma/seed.mjs`. It is intentionally small, repeatable, and limited to the first read-only vertical slice. Facts were last reviewed on 2026-09-12.

## Round Lab 1025 Dokdo Toner

- Round Lab Korea product pages: canonical 200 mL and 500 mL variants, Korean retail/sale prices, and the 200 mL + 500 mL set.
- Well.ca and Shoppers Drug Mart: Canadian 200 mL offers.
- Shoppers Drug Mart: retailer rating and review count.
- Olive Young: ranking label.

## ANESSA Perfect UV Skincare Gel

- ANESSA / Shiseido: 2026 NB version, 40 g and 90 g sizes, Japanese reference retail prices, and the 2026-02-21 release date.
- Japanese Taste Canada: Canadian 90 g NB offer.
- Shiseido Beauty Key: Japanese 90 g NB offer.
- @cosme: version-specific rating, review count, and ranking label.

Seed values are structured as source-backed catalogue records, not presented as live prices. The `verifiedAt` and `lastVerifiedAt` timestamps make their age visible. Missing conversion, shipping, benchmark, or signal data remains null/absent rather than inferred.

## Demo price-history observations

The initial PriceObservation rows are explicitly demo/test data, not verified real-world historical archives. They exist only to exercise exact-variant, retailer-specific history behavior while scheduled ingestion and verified historical sources remain out of scope.

- Round Lab 1025 Dokdo Toner 200 mL / Well.ca: CA$21.99 on 2026-07-15, CA$19.99 on 2026-08-15, and CA$17.99 on 2026-09-11.
- Round Lab 1025 Dokdo Toner 200 mL / Shoppers Drug Mart: CA$22.99 on 2026-07-20 and CA$20.00 on 2026-09-11.
- ANESSA Perfect UV Skincare Gel 2026 NB 90 g / Shiseido Beauty Key: ¥2,508 on 2026-09-11 as the sparse-history example.

These records use verification type OTHER, retain native currency, and repeat the exact tracked offer listing URL so they can be matched without merging retailer/listing series. They must not be relabeled as retailer-verified history without an actual archived source.
