# Data Model V0

This document defines conceptual domain boundaries and the initial Prisma/PostgreSQL mapping. The schema implements the MVP/core entities below; future foundations remain conceptual until explicitly added.

## Core catalogue hierarchy

```text
CanonicalCategory
  └─ ProductFamily
Brand
  └─ ProductFamily
       └─ ProductVersion
            └─ ProductVariant
                 └─ Offer
                      └─ OfferItem[]
```

### Brand
Represents a canonical beauty brand.

Likely fields:
- id
- name
- slug
- originMarket/country where useful
- logo/image metadata
- aliases

A future Brand page may list supported product families. Search may return brands in MVP even if the brand page remains simple.

### ProductFamily
The consumer-recognizable product across reformulations, e.g. `ANESSA Perfect UV Skincare Gel`.

Likely fields:
- id
- brandId
- canonicalName
- slug
- primaryCanonicalCategoryId
- originMarket
- commonEnglishAliases[]
- default/currentVersionId

Search should return this level, not separate variants.

### CanonicalCategory
Represents a platform-owned hierarchical skincare product taxonomy, not a retailer's classification scheme. It defines what a product is for consistent browse and navigation.

Likely fields:
- stable id
- slug
- displayName
- parentCategoryId (nullable only for the root)
- department/root identifier
- sortOrder/status where useful

The initial hierarchy is `Skincare` → Cleansers, Toners, Moisturizers, Treatments, Sunscreen, Masks, Eye Care, and Lip Care, with the documented child categories. The hierarchy must support future additions or reorganization without changing `ProductFamily` storage.

Each `ProductFamily` has exactly one primary canonical category. An optional join/entity for additional canonical categories may be introduced if needed, but it must not replace the required primary category used for deterministic browse/navigation.

Product category is distinct from active ingredients, skin concerns, and skin type. For example, `Serum / Ampoule` is a category, while Vitamin C and dullness are separate classification dimensions.

### SourceCategoryMapping
Supports ingestion normalization without allowing external taxonomy strings to become canonical categories.

Likely fields:
- source/retailer id
- source category value/path
- canonicalCategoryId
- mapping confidence/status and provenance

Source category values may be retained as source metadata, but canonical product browse and search use `CanonicalCategory`.

Canonical source keys are stable lowercase namespaced slugs independent of display names, for example `platform:atcosme`, `retailer:olive-young-kr`, `retailer:amazon-ca`, and `brand:shiseido`. Where source records need user-facing attribution, store a separate display name. Retailers, benchmark prices, external signals, and source-category mappings use this convention.

### ProductVersion
A materially distinct formulation/release within a ProductFamily, e.g. `2026 NB` vs `2024 NA`.

Likely fields:
- id
- productFamilyId
- versionName/code
- releaseDate/year
- status: CURRENT | PREVIOUS | DISCONTINUED | UNKNOWN
- manufacturer identifiers where applicable
- formulation fingerprint / ingredient snapshot later
- packaging metadata
- defaultVariantId

Identity evidence priority:
1. GTIN/JAN/UPC/EAN
2. manufacturer SKU
3. explicit version code
4. release date/year
5. formulation fingerprint
6. packaging
7. title match fallback

Never silently merge when confidence is insufficient.

### ProductVariant
A sellable base configuration of a ProductVersion, usually size/quantity/form.

Likely fields:
- id
- productVersionId
- normalizedQuantity
- normalizedUnit
- displaySize
- GTIN/JAN/UPC/EAN
- manufacturerSku
- active/status

Only known variants for the selected ProductVersion appear in the UI.

### ProductImage
Stores curated presentation imagery without weakening catalogue identity.

Implemented fields:
- productVersionId (required)
- productVariantId nullable (only when the asset depicts one exact size/packaging)
- url and descriptive altText
- sourceType: LOCAL_CURATED | BRAND_APPROVED | RETAILER_APPROVED
- sourceName and sourcePageUrl provenance
- isPrimary and sortOrder for a future ordered gallery

Image selection is explicitly version-scoped. An exact selected-variant image takes precedence; a version-wide image is the only safe fallback. An image tied to another version or variant must never be shown simply because it belongs to the same ProductFamily. Missing or failed imagery renders an intentional fallback rather than guessed packaging.

`BRAND_APPROVED` and `RETAILER_APPROVED` mean the source was deliberately allowlisted for curated ingestion; they do not claim that reuse rights have completed legal clearance. Remote assets are limited to manually approved brand/retailer hosts and documented in the curated seed provenance. Image permissions, hotlinking policy, and production asset hosting require review before public launch.
## Retail and price model

### Retailer
- id
- sourceKey
- name
- storefront country/market
- website
- affiliate/partner metadata
- reliability/source status

A `Retailer` represents a distinct retailer storefront or market-facing store identity, not only a parent company. Storefronts with materially different catalogue, inventory, pricing, or native currency remain separate records—for example, `Amazon.ca` and `Amazon.jp`. International retailers such as Stylevana or YesStyle can retain their own storefront identity while their individual offers separately record Canada as a served customer/delivery market.

### Offer
A retailer's purchasable listing mapped to one ProductVariant.

For ingestion, a non-null retailer listing ID is stable within its retailer/storefront: `(retailerId, retailerListingId)` is unique. If the source supplies no external ID, `(retailerId, listingUrl)` remains the fallback identity and the matched exact ProductVariant must agree. A changed URL on a stable external ID updates the existing offer instead of creating a duplicate. Amazon.ca/Amazon.jp-style storefronts remain separate Retailer records.

Likely fields:
- id
- retailerId
- primaryVariantId
- retailerListingId/url
- productPrice
- nativeCurrency
- availableMarkets (explicit ISO market codes served by this offer)
- cadConvertedPrice nullable
- cadFxTimestamp nullable
- availabilityState
- shippingState nullable
- shippingAmount nullable
- shippingCurrency nullable
- optional delivery metadata (for example, method, estimate, or eligibility/threshold conditions)
- observedAt
- lastVerifiedAt
- confidence/status
- primaryQuantity default 1

Default UI ordering uses product price only, ascending, among comparable CAD-converted offers. Shipping does not change default order.

Offer purchasing-market eligibility also belongs to the individual offer. `availableMarkets` contains the ISO customer/delivery markets that the specific offer is known to serve and drives market sections such as `Buy in Canada`. It does not describe the retailer's home or storefront country, and retailer country must not be used as a proxy for where a listing can be purchased. An empty array means no served market is currently verified; it does not mean worldwide availability. A normalized offer-market relation can replace this array later if each market needs attributes such as market-specific availability, shipping, thresholds, or verification metadata.

Shipping/delivery data belongs to the individual offer, not the retailer. It is optional because marketplace seller, fulfillment method, Prime eligibility, threshold conditions, and destination may materially change the information. Preserve richer per-offer shipping/delivery data for later UI use, but only surface it in MVP when sufficiently reliable.

### OfferItem
Represents multipack quantity, mini, bonus product, or accessory included in an offer.

Possible fields:
- id
- offerId
- relatedVariantId nullable
- label
- quantity
- itemType: SAME_PRODUCT | OTHER_PRODUCT | MINI | GIFT_ACCESSORY
- isPromotional

Gifts/minis receive no assigned monetary value for ranking in MVP.

### AvailabilityState
- IN_STOCK
- LOW_STOCK
- OUT_OF_STOCK
- PREORDER
- UNKNOWN

### ShippingState
- FREE
- FIXED
- CALCULATED
- UNKNOWN
- NOT_APPLICABLE
- PICKUP_ONLY

When surfaced, frontend presentation should render these states distinctly. Shipping/delivery is not a required or guaranteed MVP comparison-table field.

## Benchmark pricing

Use the strongest accurate benchmark type available.

### BenchmarkPrice
Conceptual fields:
- id
- productVariantId
- market
- type: MSRP | RETAIL_PRICE | REFERENCE_PRICE
- amount
- nativeCurrency
- cadConvertedAmount nullable (reserved for an explicitly captured conversion snapshot; curated benchmark seed data leaves this unset)
- sourceId/sourceUrl
- observed/verified date
- confidence/status

Rules:
- MSRP only when manufacturer-defined.
- Retail Price for authoritative official/local retail pricing.
- Reference Price for a trusted stable benchmark when the first two are unavailable.
- Missing benchmark means no savings estimate for that product.
- Native benchmark amount/currency remains the source of truth. The MVP product page calculates approximate CAD display values at request time through the reusable currency-conversion layer and does not create a second benchmark record.
- The current converter uses the latest available Bank of Canada daily rate, caches it for 24 hours, and exposes its source/date. If no rate is available, keep showing the native benchmark without a CAD estimate.
- No persistent exchange-rate entity is required for this MVP display. Revisit persistence only when historical/reproducible calculations or ingestion snapshots require it.

### PriceObservation
A dated native-currency price observation, separate from both the current Offer.productPrice and stable benchmark pricing.

Implemented fields:
- offerId nullable (direct exact-offer link for ingestion-owned observations; legacy/manual rows may remain null)
- productVariantId
- retailerId nullable plus retailerName/location fallback context
- amount and nativeCurrency
- observedAt
- verificationType: RETAILER_SOURCE | RECEIPT_VERIFIED | COMMUNITY_REPORTED | OTHER
- sourceUrl/proofUrl metadata

The product-page history foundation is exact-variant and tracked-offer scoped. Ingestion-owned observations use the direct nullable `offerId` relation; `(offerId, observedAt)` is unique so identical source reruns do not duplicate a sample. Legacy/manual null-linked observations remain valid and use the conservative productVariantId + retailerId + sourceUrl fallback. Unmatched observations are not merged into another series. ProductVersion isolation follows from the observation's required ProductVariant relation.

The current offer price is displayed separately and is never synthesized into history. An observation appears only when a record exists for its actual timestamp. Each retailer/listing series stays independently identifiable, chronological, and native-currency authoritative.

Historical CAD conversion is intentionally omitted for now. The reusable Bank of Canada converter currently provides the latest daily rate; applying it to older observations would falsely imply an observation-date conversion. Add dated-rate lookup or stored conversion snapshots only when reproducible historical conversion is implemented.

The curated seed's initial history values are explicitly demo observations (OTHER), not verified real-world archives. Ingestion uses RETAILER_SOURCE only when the dated value and source are genuinely verified. Current Offer state stays distinct from historical observations: a new real source timestamp creates one observation, an identical rerun is unchanged, and an existing timestamp with conflicting price data is rejected before writes.

## External reputation signals

### ExternalSignal
Represents an authorized/source-linked rating, ranking, or review-count signal.

Fields may include:
- productVersionId (preferred when formulation-specific)
- source/platform
- sourceUrl
- rating
- ratingScale
- reviewCount
- rankingLabel/category
- observedAt/verifiedAt

Do not attach a rating from one formulation to a different ProductVersion.

## User model

### User
The Prisma `User` model is the Clerk-backed profile record. It stores a unique `clerkUserId`, not authentication credentials.

The web application resolves the active Clerk session to this profile through server-only helpers. Ordinary public browsing does not create a profile; a signed-in action may lazily upsert one using the Clerk external user ID. Passwords, sessions, and other Clerk credentials are never stored in PostgreSQL.

Likely fields:
- userId
- displayName
- skinType nullable
- skinTypeVisibility (schema-ready; MVP private only)
- beautyInterests[]
- future profile/showcase settings

Skin type is optional, private-only in MVP, and non-medical metadata.

### CollectionEntry
Represents the user's relationship with a ProductVersion/Variant, separate from individual purchases.

Conceptually supports:
- want
- tried
- tags[]
- may surface/reference the user's private `UserRating` for the ProductVersion
- private notes/context

`Want` is first-time wishlist intent. Ownership is derived/supported through PurchaseInstances.

Implementation clarification: a `CollectionEntry` is unique per user and `ProductVersion`, with an optional selected `ProductVariant` as UI context. This prevents duplicate relationship state while keeping ratings at version level and purchases at variant level. `Owned` is derived for the version when the user has at least one `PurchaseInstance` whose variant belongs to that version; each purchase still records its exact variant. The first Owned action is idempotent, while the explicit Add another purchase action creates one additional instance for the currently selected variant.
The private My Collection read model is assembled from three fixed, user-scoped query sets: `CollectionEntry` plus tags, `UserRating`, and `PurchaseInstance`. The presentation layer unions those records by `ProductVersion`, yielding one normalized item per user/version with relationship flags, rating, selected/default variant context, purchase count, acquired quantity, and latest purchase context. This avoids tag-driven duplicate cards and N+1 queries without adding a persistent aggregate table.

### CollectionTag
Initial product/user relationship tags:
- HOLY_GRAIL — no prerequisite; may be aspirational
- WOULD_REPURCHASE — intended for Tried products

`Holy Grail` is not a lifecycle state.

### PurchaseInstance
Represents a specific acquired quantity of a ProductVariant.

Possible fields:
- id
- userId
- productVariantId
- quantity
- purchaseDate nullable
- retailerId/customRetailer nullable
- location nullable
- amountPaid nullable
- currency nullable
- openedDate nullable
- finishedDate nullable
- source: MANUAL | SHOPPING_LIST | RECEIPT (future)

Multiple purchases of the same variant are supported. Compound relationship mutations—such as Owned removing Want while creating a purchase, or confirmed Tried plus rating/tag changes—must execute transactionally. The implementation uses serializable Prisma transactions with bounded retry for write conflicts.

### UserRating
- userId
- productVersionId
- ratingHalfSteps: integer values 2–10, representing 1.0–5.0 stars in 0.5-star increments
- contextualVariantId nullable
- createdAt/updatedAt

Private by default in MVP. Public reviews are post-MVP.

## Shopping lists

### ShoppingList
- id
- userId
- name
- targetMarket
- visibility (schema-ready; MVP private)
- createdAt/updatedAt

### ShoppingListItem
- id
- shoppingListId
- productVariantId
- quantity >= 1
- purchasedQuantity >= 0

Adding the same exact variant again should increase quantity rather than create meaningless duplicate rows.

The Prisma schema uniquely identifies a `ShoppingListItem` by its list and product variant. The first PostgreSQL migration must add database `CHECK` constraints after Prisma creates the tables; Prisma schema syntax cannot express them directly. Do not apply that migration until a database is configured and explicitly authorized.

```sql
ALTER TABLE "UserRating"
  ADD CONSTRAINT "user_rating_half_steps_range"
  CHECK ("ratingHalfSteps" BETWEEN 2 AND 10);

ALTER TABLE "ShoppingListItem"
  ADD CONSTRAINT "shopping_list_item_quantity_positive"
  CHECK ("quantity" >= 1),
  ADD CONSTRAINT "shopping_list_item_purchased_quantity_nonnegative"
  CHECK ("purchasedQuantity" >= 0),
  ADD CONSTRAINT "shopping_list_item_purchased_quantity_lte_quantity"
  CHECK ("purchasedQuantity" <= "quantity");

ALTER TABLE "PurchaseInstance"
  ADD CONSTRAINT "purchase_instance_quantity_positive"
  CHECK ("quantity" >= 1);
```

Savings calculations:
- use quantity
- compare a selected eligible offer for the list target market with the strongest trustworthy benchmark for that same market and exact version/variant
- default the temporary view selection to the lowest eligible raw product-price offer; do not persist an offer on ShoppingListItem
- exclude products missing an eligible offer, trustworthy benchmark, or required common-currency conversion
- never treat missing price as zero
- disclose excluded unique product count and reason
- label incomplete calculations as Partial estimate
- preserve native offer and benchmark currencies; approximate CAD totals reuse the Bank of Canada conversion layer

## Optional post-MVP user-created collections/lists

User-created thematic groupings such as `Winter Routine`, `Japan Haul`, or `Favourite Sunscreens` are separate from lifecycle states.

Conceptual entities:
- UserCollection
- UserCollectionItem

These are post-MVP by default and may be included only if scope permits without displacing core MVP collection states or shopping lists. The schema should allow future description, comments, visibility, sharing, and profile showcase.

## Future foundations

### Receipt
Post-MVP. Should eventually preserve raw image/reference, retailer, date, extraction status, confirmation status, and matched line items.

### Active ingredients
Post-MVP structured product attributes, not user tags:
- Vitamin C
- Niacinamide
- Retinoids/Retinol
- AHA/BHA
- Ceramides
- Peptides
- etc.

Do not build ingredient scanning/analysis in MVP.

### Skin concerns
Skin concerns are a separate, future structured classification dimension (for example, acne, dehydration, pores, dullness, redness, fine lines, pigmentation, and hyperpigmentation). They are neither product categories nor skin-type profile metadata.

### Profile showcase
Schema may eventually support ordered showcase slots containing selected products or user collections without altering their underlying states.
