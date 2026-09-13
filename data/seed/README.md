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
