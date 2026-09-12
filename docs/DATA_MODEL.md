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

## Retail and price model

### Retailer
- id
- name
- country/market
- website
- affiliate/partner metadata
- reliability/source status

### Offer
A retailer's purchasable listing mapped to one ProductVariant.

Likely fields:
- id
- retailerId
- primaryVariantId
- retailerListingId/url
- productPrice
- nativeCurrency
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
- cadConvertedAmount nullable
- sourceId/sourceUrl
- observed/verified date
- confidence/status

Rules:
- MSRP only when manufacturer-defined.
- Retail Price for authoritative official/local retail pricing.
- Reference Price for a trusted stable benchmark when the first two are unavailable.
- Missing benchmark means no savings estimate for that product.

### PriceObservation
Future/user/retailer observation record, separate from stable benchmark.

Possible fields:
- productVariantId
- retailer/location
- amount/currency
- observedAt
- verificationType: RETAILER_SOURCE | RECEIPT_VERIFIED | COMMUNITY_REPORTED | OTHER
- proof metadata

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

Implementation clarification: a `CollectionEntry` is unique per user and `ProductVersion`, with an optional selected `ProductVariant` as UI context. This prevents duplicate relationship state while keeping ratings at version level and purchases at variant level.

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

Multiple purchases of the same variant are supported.

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
- require destination benchmark and tracked Canadian comparison for the exact version/variant
- exclude products missing either side
- never treat missing price as zero
- disclose excluded unique product count
- label materially incomplete calculations as `Partial estimate`

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
