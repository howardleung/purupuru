# Product Specification V0

## 1. Product Overview

### Working Product Description

A global beauty discovery, collection, and shopping-intelligence platform that helps users understand what products are genuinely popular in different beauty markets, compare trusted buying options, and organize the products they own, want, tried, finished, and plan to purchase.

The current development/internal working name is `Otoku`, from the Japanese concept of good value or a good deal. This is not a final naming or branding decision.

The initial focus is skincare, with particular emphasis on Korean, Japanese, and selected European skincare markets.

The product is not intended to replace local review platforms such as @cosme or Olive Young. Instead, it acts as a global layer that helps users understand how products are perceived and sold across different markets.

---

## 2. Problem Statement

Beauty information is highly fragmented across countries, retailers, review platforms, social media, and personal tracking tools.

A user researching a skincare product may currently need to check:

- Reddit
- TikTok
- YouTube
- Google
- @cosme
- Olive Young
- Amazon
- local Canadian retailers
- international retailers such as YesStyle or Stylevana
- currency converters
- personal notes or shopping lists

This creates several problems.

### 2.1 Local popularity is difficult to understand globally

Products that are popular internationally are not always the products currently popular within their country of origin.

Likewise, products that are highly rated or trending locally in Japan or Korea may have relatively little international visibility.

Users outside those markets often lack an easy way to answer questions such as:

- What sunscreens are actually popular in Japan right now?
- Is this product highly rated in Korea, or is it mainly popular internationally?
- Is this older formulation still being sold abroad?
- Are there products locals love that I would otherwise never discover?

Local beauty platforms contain valuable information, but language, regional access, and fragmented ecosystems make that information difficult for international users to use effectively.

### 2.2 Shopping options are fragmented

After deciding that they are interested in a product, users still need to determine where to purchase it.

A Canadian user may need to compare:

- Canadian specialty retailers
- large Canadian retailers
- Amazon
- international retailers shipping to Canada
- pricing in Korea or Japan
- local prices they may encounter while travelling

This process is repetitive and often requires manual currency conversion.

Even when a product is cheaper abroad, users may not know whether the difference is meaningful enough to wait until a future trip.

Conversely, a product may be difficult or impossible to find through tracked Canadian retailers, making it valuable to prioritize while travelling.

### 2.3 Product versions, variants, and bundles are confusing

Beauty products frequently exist in multiple:

- sizes
- formulations
- release versions
- regional versions
- multipacks
- promotional bundles

Retailers may use inconsistent product names and imagery.

For example, two listings may appear to represent the same sunscreen while actually referring to different formulation years.

A cheaper listing may therefore not represent the current version of the product.

Users rarely have an easy way to distinguish these differences.

### 2.4 Users lack a good personal beauty record

Beauty enthusiasts often accumulate many products over time but may not remember:

- what they own
- what they have tried
- what they finished
- what they would repurchase
- when they purchased something
- where they purchased it
- how much they paid
- when they opened it
- whether it may now be past its recommended period after opening

Existing workflows may involve photos, Notes, retailer order histories, or simply memory.

There is an opportunity to make the user's beauty collection a persistent part of the product rather than treating every shopping session as independent.

---

## 3. Target Users

### 3.1 Primary User

The initial target user is a skincare enthusiast in Canada who:

- is interested in Korean and Japanese skincare
- may also purchase French or other European skincare
- follows beauty content online
- researches products before buying them
- shops from both Canadian and international retailers
- compares prices
- creates wishlists or shopping lists
- may travel to destinations such as Korea or Japan and purchase skincare while there

The user does not need to be an expert.

The product should work for someone who is deeply knowledgeable about skincare as well as someone beginning to explore international beauty products.

### 3.2 Example Primary User Behaviours

A typical user might:

- see a sunscreen on TikTok
- search for it on the platform
- discover that it is currently highly ranked in Japan
- compare the Japanese reference price against Canadian buying options
- notice that the Canadian listings are an older formulation
- add the latest version to a Japan shopping list
- purchase it during a trip
- later record where and when it was purchased
- rate it after using it
- include it in a collection of favourite sunscreens (with public sharing as a post-MVP capability)

### 3.3 Secondary Users

Potential secondary users include:

#### Travellers

People planning shopping while visiting Korea, Japan, France, or other major beauty markets.

#### Beauty Enthusiasts

People who enjoy maintaining a collection, discovering products, writing reviews, and following other users with similar tastes.

#### Deal-Focused Shoppers

People primarily interested in determining where a product can be purchased for the best available price.

#### Creators

Beauty creators who may eventually build public collections, shopping guides, routines, or curated recommendation lists.

---

## 4. Core Value Proposition

The product should help users answer four questions:

### What should I discover?

Show products that are popular or highly regarded in different beauty markets rather than relying only on international social-media trends.

### What does the world think about it?

Present trusted external signals such as ratings, rankings, and review counts from relevant local and international platforms when the data can be obtained legitimately.

The platform should link users back to original sources rather than attempting to replace them.

### Where should I buy it?

Compare tracked local and international purchasing options, clearly distinguishing:

- local retailers
- international retailers shipping to the user's home market
- destination-country reference prices

The platform should make it easy to understand whether purchasing abroad may be worthwhile without claiming that every retailer in the world has been checked.

### How does this product fit into my beauty collection?

Allow users to maintain a persistent personal record of their beauty products, shopping intentions, purchase history, and opinions.

---

## 5. Core Product Loop

The core loop is:

1. Discover a product.
2. Understand its reputation across relevant beauty markets.
3. Compare versions, variants, bundles, availability, and prices.
4. Save the product to a personal collection or shopping list.
5. Purchase the product.
6. Record the purchase.
7. Use and eventually rate or review the product.
8. Contribute useful information back to the platform over time.
9. Improved platform data helps the next user make a better purchasing decision.

The platform should make user contributions beneficial to the contributor rather than feeling like unpaid database maintenance.

For example, a future receipt-import feature may automatically update a user's collection and shopping list while simultaneously producing verified price observations.

---

## 6. Initial Market Scope

### Home Market

Canada.

The initial product should optimize price comparison and purchasing decisions for Canadian users.

### Initial Beauty Markets

Primary:

- South Korea
- Japan

Selected support:

- France and other relevant European skincare brands where feasible

The European category should initially be selective rather than attempting comprehensive coverage across all European beauty products.

### Initial Product Categories

Skincare only. Every `ProductFamily` must have one primary category in the platform's canonical hierarchical skincare taxonomy. The platform normalizes retailer/source category names into this taxonomy rather than using retailer taxonomies as canonical data. Additional canonical categories may be recorded where genuinely useful, but primary category is required for deterministic browse and navigation behavior.

Initial canonical taxonomy:

```text
Skincare
├─ Cleansers
│  ├─ Facial Cleanser
│  ├─ Oil Cleanser
│  ├─ Balm Cleanser
│  └─ Makeup Remover
├─ Toners
│  ├─ Toner
│  ├─ Essence
│  ├─ Toner Pads
│  └─ Facial Mist
├─ Moisturizers
│  ├─ Cream
│  ├─ Lotion
│  ├─ Gel Moisturizer
│  └─ Face Oil
├─ Treatments
│  ├─ Serum / Ampoule
│  ├─ Spot Treatment
│  ├─ Exfoliant
│  └─ Pimple Patch
├─ Sunscreen
├─ Masks
│  ├─ Sheet Mask
│  ├─ Eye Mask
│  └─ Wash-Off Mask
├─ Eye Care
└─ Lip Care
```

This initial taxonomy is intentionally extensible and is not a final exhaustive list. Product category describes product type only; it is distinct from skin concerns, skin type, and active ingredients. For example, a Vitamin C serum is categorized as `Serum / Ampoule`; Vitamin C and concerns such as dullness or hyperpigmentation are separate classification dimensions.

Makeup, fragrance, haircare, and beauty devices are outside the initial scope.

---

## 7. MVP Scope

The initial MVP should prioritize depth and trust over catalogue size.

### Catalogue

Approximately 100 carefully selected products.

The exact distribution between Korean, Japanese, and European products should depend on data availability and usefulness rather than an arbitrary quota.

### Retailer Coverage

Approximately 3–5 reliable price sources initially.

Potential sources may include:

- Canadian retailers
- international retailers shipping to Canada
- Korea/Japan reference-price sources

Retailers should only be included where price information can be obtained and displayed legitimately and reliably enough for the product's trust standards.

### Product Pages

Each supported product should ideally contain:

- compact clickable breadcrumbs from the canonical category path
- product name
- brand
- product family
- current version
- previous versions where relevant
- size/variant
- country of origin
- product images from legitimate sources
- external ratings where legitimately available
- external review count
- external ranking where relevant
- links to original review or retailer sources
- home-market buying options
- international buying options
- destination-market reference price
- currency conversion
- availability state
- bundle information
- last-verified timestamps

### Collection Features

Users can classify products using states such as:

- Want
- Owned
- Tried
- Finished
- Would Repurchase
- Holy Grail

Users may also record optional information such as:

- purchase date
- purchase retailer
- purchase location
- price paid
- opened date
- personal notes
- personal rating

### Shopping Lists

Users can create lists such as:

- Japan Trip
- Korea Trip
- Products to Buy
- Upcoming Haul

A product can be added directly to a shopping list from its product page.

The shopping-list item should represent the user's intent to purchase a product variant rather than permanently storing one retailer's current offer.

Price information can therefore update independently between the time the product is added and the time the user shops.

### Versions and Variants

The MVP data model should support distinct:

- product families
- product versions/formulations
- sizes and other variants

Current and older versions should not be silently merged.

Where possible, identifiers such as JAN, GTIN, UPC, or EAN should be used to distinguish variants and versions.

### Bundles

Offers should support bundles and promotional sets.

An offer may contain:

- the primary product variant
- included additional products
- mini sizes
- multipacks
- promotional gifts

The interface should clearly communicate what is included without allowing bundle complexity to overwhelm the primary price-comparison experience.

---

## 8. Explicit Non-Goals for MVP

The following are intentionally outside the MVP.

### AI Skin Diagnosis

The platform will not attempt to diagnose skin conditions or determine medically appropriate skincare.

### Ingredient Scanner

The initial product will not compete with established ingredient-analysis platforms.

### Automated AI Routine Generation

Users may create and share routine collections, but the MVP will not attempt to automatically prescribe or optimize routines.

### Daily Routine Tracking

The platform is not intended to require daily engagement or habit tracking.

### Medical Recommendations

The product should avoid presenting itself as a medical or dermatological recommendation service.

### Massive Review Scraping

The product will not depend on copying and republishing large quantities of third-party review text.

External ratings, review counts, rankings, and links may be shown where legitimately obtainable.

### Global Tax and Duty Engine

The MVP will not attempt to calculate every possible tax, tourist refund, import duty, brokerage fee, or foreign-exchange cost.

Price displays should instead clearly communicate what information is and is not included.

### Full Global Retail Coverage

The platform will not claim to have searched every retailer.

If no tracked retailer is available, the interface should say so rather than claiming the product is unavailable.

### Social Feed

Public collections and profiles may eventually become important, but the MVP will not attempt to become a generic social-media network.

### Direct Messaging

Not required.

### Native Mobile Application

The initial product should be a polished, responsive web application.

Native mobile applications may be considered later if features such as camera scanning, barcode scanning, notifications, offline shopping lists, or location-aware experiences justify them.

### Makeup, Haircare, and Fragrance

These categories may be natural long-term expansions but should not distract from building an excellent skincare product first.

---

## 9. Product Principles

### Trust Over Coverage

It is better to display three highly reliable purchasing options than ten questionable ones.

### Unknown Is Better Than Wrong

If the platform cannot confidently identify a product version, variant, offer, or price, it should display uncertainty or omit the information rather than guess.

### User Interest Comes Before Affiliate Revenue

Offers must never be ranked more favourably because the platform receives a larger affiliate commission.

If an unaffiliated retailer provides a better option for the user and can legitimately be included, it should not be intentionally disadvantaged.

### Complex Backend, Simple Frontend

The underlying system may need to model difficult concepts such as:

- product versions
- regional formulations
- variants
- retailer identifiers
- bundles
- price observations
- reference prices

The user should not need to understand this complexity.

The interface should expose only the information necessary to make a confident decision.

### Stable Reference Prices Over False Precision

For destination-country shopping, a stable reference price with a visible verification date may be more useful than constantly fluctuating prices.

Example:

Japan reference price  
¥2,508  
Verified August 2026

Recent observations may be displayed separately.

### External Platforms Are Sources, Not Enemies

The goal is not to replace platforms such as @cosme or Olive Young.

Where appropriate, users should be able to see an external rating or ranking and follow a link to the original source.

### Participation Should Remain Accessible

Core activities that improve the usefulness of the platform should not be aggressively paywalled.

Examples include:

- maintaining a collection
- creating shopping lists
- viewing standard price comparisons
- contributing reviews
- contributing price observations

Premium monetization should eventually focus on advanced convenience, power-user features, or additional intelligence rather than blocking basic participation.

---

## 10. MVP Success Definition

The MVP should not initially be judged by revenue or total registered users.

The first meaningful success question is:

> Can the platform make researching and purchasing a small catalogue of skincare products meaningfully easier than the user's existing workflow?

Early signs of success may include:

- users searching multiple products in one session
- users adding products to shopping lists
- users creating collections
- users returning to update their collections
- users clicking retailer purchase links
- users sharing product or collection pages
- users reporting that the platform helped them decide where or whether to purchase something

The most important qualitative signal would be users beginning to say:

> “I check this before I buy skincare.”

---

## 11. MVP Product Decisions

### Authentication and Anonymous Browsing

Anonymous users should be able to browse product pages, prices, and rankings. Public collections are post-MVP.

Sign-in is required for:

- Want / Owned / Tried / Finished
- shopping lists
- notes
- purchase history
- reviews
- profile customization

Google + email magic link first. Apple later if needed.

Receipt import is post-MVP. Future receipt imports will require sign-in. Keep the domain model extensible for future receipts, but do not include OCR/import functionality in MVP.

### Search and Discovery

MVP should support:

- product name
- brand
- common English aliases
- canonical category

Search results should represent products/product families rather than individual versions or variants. Version and variant selection belongs on the product page.

Autocomplete may show a matching brand result followed by matching products. For product matches, simple MVP ordering may use available popularity signals where trustworthy, otherwise alphabetical order.

Local-language names, deeper origin filtering, and version-specific search are post-MVP considerations.

MVP browse/discovery includes canonical category navigation and simple category-filtered browse views, alongside curated/editorial sections and simple platform-derived sections such as Most Wanted and Newly Added. Category browse pages and product pages show compact, clickable breadcrumbs derived from the canonical category path (for example, `Skincare > Toners > Toner`) for orientation and back-navigation. Breadcrumb labels and routes use canonical taxonomy data, never retailer-specific categories, and should remain compatible with SEO-friendly web routes. It may include Best savings vs Canada where the required comparison data exists.

Do not claim local Trending rankings until a legitimate repeatable data source exists. No giant filter builder yet.

Autocomplete should surface matching brands and products as the user types. For example, typing `dokdo` may show Round Lab Dokdo-line products. MVP result ordering may use a simple deterministic rule such as curated popularity followed by alphabetical order; more sophisticated ranking can come later.

### Collection Semantics

Collection states are not all mutually exclusive. A product can be Owned and Tried at the same time. `Holy Grail` and `Would Repurchase` should be modeled as tags/endorsements rather than mutually exclusive lifecycle states.

`Want` represents wishlist intent for a product/variant the user has not yet purchased. When a Wanted product is added to Owned or purchased, remove Want automatically for that product/variant. Repeat-purchase intent should be represented through `Would Repurchase` and/or by adding the product to a shopping list rather than keeping it in Want. Finished refers to a purchase instance, not the abstract product.

The MVP distinguishes `CollectionEntry` from `PurchaseInstance`. One user might have bought the same toner three times.

Marking a product as Owned creates at least one `PurchaseInstance`. Purchase metadata may be unknown/optional.

### Multiple Purchase Instances

Multiple purchase instances are supported. This is necessary for shelf-life tracking and receipt history.

### MSRP, Retail Price, and Reference-Price Definition

The platform should distinguish three benchmark price concepts and use the strongest accurate label supported by the source:

1. `MSRP`: a manufacturer-defined suggested retail price for a specific product variant and market. Only use the MSRP label when supported by an authoritative manufacturer source.
2. `Retail Price`: an official retail price where supported by an official source, or a trusted major local retail price when a meaningful manufacturer MSRP is not available.
3. `Reference Price`: a stable, trusted local-market benchmark used when neither an official MSRP nor an official/trusted Retail Price is available cleanly.

All benchmark prices should retain their native currency, source, market, and last-verified date. The product page should show the benchmark price prominently and, where conversion is available, also show its CAD equivalent.

Recent observed prices should be shown separately from the benchmark price rather than constantly replacing it.

“Best savings vs Canada” compares the destination benchmark price against the lowest currently tracked Canadian offer for the exact version and variant. The benchmark may be MSRP, Retail Price, or Reference Price according to the hierarchy above.

If no sufficiently verified destination benchmark price exists, do not calculate savings for that product. If no Canadian tracked offer exists, do not calculate savings for that product. Missing prices must never be treated as zero or silently substituted with unrelated offers.

### Offer Ranking

Do not create one magic “best offer” score initially. The platform should organize trustworthy information and allow the user to make the final purchasing decision.

Default offer ordering within each buying-context group is lowest product price first. Shipping must not affect the default ordering. A cheaper product-price offer remains listed first even when another offer may have lower total cost after shipping.

Additional simple sorting such as retailer or availability may be supported, but bundle contents do not affect ranking. Do not include `bundle/value` sorting in MVP.

Visually label offers only where the label can be supported objectively, such as:

- Lowest product price
- Local retailer
- Ships to Canada

Do not use an automatic `Best bundle` label in MVP because gifts and minis are not assigned monetary values. Bundle contents should be displayed as factual `Extras` information without claiming objective superiority.

If an offer has no CAD conversion, it cannot be numerically compared against converted offers when sorting by price and should appear after comparable converted offers. Preserve its native price and label conversion as unavailable.

Shipping and delivery metadata are optional, per-offer supporting information. The MVP must not require or guarantee shipping/delivery display in comparison rows: show it only when sufficiently reliable for that specific offer, and omit it when unavailable or unreliable. The MVP does not need to determine which offer is best after shipping.

### Availability and Shipping States

Availability states:

- `IN_STOCK`
- `LOW_STOCK`
- `OUT_OF_STOCK`
- `PREORDER`
- `UNKNOWN`

Shipping/delivery states and fields should be modeled per offer and remain more detailed in the backend than the frontend necessarily exposes. They cannot be assumed at the retailer level because seller, fulfillment method, Prime eligibility, threshold conditions, or delivery destination may change them.

- `FREE`
- `FIXED`
- `CALCULATED`
- `UNKNOWN`
- `NOT_APPLICABLE`
- `PICKUP_ONLY`

When sufficiently reliable shipping/delivery information is surfaced, suggested presentation is:

- `FREE` → `Free`
- `FIXED` → exact known shipping amount
- `CALCULATED` → `At checkout`
- `UNKNOWN` → `Shipping unknown` or `+ shipping` where a charge is known to exist but the amount is unknown
- `NOT_APPLICABLE` → `—`
- `PICKUP_ONLY` → `Pickup only` / `In store`

Do not show a shipping/delivery placeholder or misleading value when the data is unavailable or unreliable.

Retailer coverage is separate. If the platform does not track a retailer, display “No tracked offer,” not “unavailable.”

### Version Identity Rules

Use deterministic identifiers first:

- GTIN / JAN / UPC / EAN
- manufacturer SKU
- explicit version code
- release year/date
- ingredient/formula fingerprint
- packaging
- title matching as fallback

If confidence is too low, do not merge.

### Bundle Behavior

Model bundles as:

```text
Offer
  primaryVariant
  quantity
  includedItems[]
```

Each included item can be:

- same product
- different product
- mini
- gift/accessory

In the UI, communicate included items, for example: “Includes 15 g mini + pouch.” Do not assign monetary value to gifts in MVP.

Same-product multipacks may show normalized unit pricing. Gifts and minis may be listed as included items but receive no assigned monetary value for ranking.

### Currency Presentation

CAD is the MVP user's display currency. Preserve the retailer's native currency and show the CAD conversion alongside it where available. Currency conversions must include or be associated with an exchange-rate update timestamp. If conversion is unavailable, show the native price only rather than hiding the offer.

### Collection Tags and Relationship Semantics

`Holy Grail` and `Would Repurchase` are independent tags/endorsements rather than lifecycle states.

- `Holy Grail` has no ownership or trial prerequisite and may be used aspirationally on products the user does not yet own.
- `Would Repurchase` is intended for products the user has actually tried. If selected before `Tried`, prompt the user to mark the product Tried as part of the action rather than silently changing state.
- `Tried` may be set independently of `Owned`; a user may have sampled or previously used a product without having a recorded purchase.
- Lifecycle changes must not silently remove `Holy Grail`.

`Want` is first-time wishlist intent. Adding or moving an exact product variant to `Owned` automatically removes `Want` for that variant. Repurchase intent should be represented through `Would Repurchase` and/or a shopping-list quantity, not by keeping the item in `Want`.

### Product-Page Version and Variant Defaults

Product pages default to the current/latest version and a curated `defaultVariantId` where available. If no curated default exists, select a deterministic standard/common active retail variant based on product metadata rather than database ordering.

The frontend should only show variants that actually exist for the currently selected product version. Version selection should be simple: selecting another version replaces the available variant controls with that version's known variants and updates all version-specific information below.

When switching versions, preserve the exact same normalized size/quantity only if that exact variant exists in the target version. Otherwise select the target version's curated/default variant. No approximate size matching is required. Offers from different versions must never be silently mixed.

### User Contribution Scope

Keep reviews and price submissions out of the absolute first build, but include data-model hooks. They can be an early post-MVP feature because moderation and trust logic add substantial complexity.

Personal numeric ratings are MVP and private by default. Public written reviews are post-MVP.

### Shopping-List Behavior

Shopping lists have a target market/destination in MVP. Items can be marked purchased. List sharing is post-MVP. From a product page, the Add to Shopping List action opens a lightweight selector containing existing lists and a `Create new list` action. The currently selected product variant is added. A list may target a market different from the product's origin or current availability because the list represents purchasing intent, not a frozen retailer offer.

Each `ShoppingListItem` supports a `quantity >= 1`. Users may intentionally plan to buy multiple units of the same exact variant. Adding the same exact variant to the same list again should increase its quantity or expose a quantity selector rather than reject it as a duplicate.

Shopping-list benchmark totals and savings calculations must multiply valid benchmark and comparison prices by quantity. If a product lacks either a sufficiently verified destination benchmark price or a tracked Canadian comparison price, exclude that product entirely from the savings calculation rather than treating the missing value as zero.

The UI must disclose missing coverage near the estimate, for example: `2 products excluded because no verified Korea benchmark price is available.` If missing coverage is substantial, label the result as a `Partial estimate` rather than presenting it with false precision. Coverage messaging should refer primarily to unique products rather than unit count.

Marking a shopping-list item purchased should create or link a `PurchaseInstance` for the purchased quantity, with purchase metadata optional. The interaction may offer a lightweight follow-up to add purchase details but should not block completion.

### Product-Page Authentication Behavior

Gated actions should open an authentication modal rather than redirecting away from the product page. After successful sign-in, automatically resume the original action using the product version and variant that were selected before authentication.

### Personal Rating Flow

Personal numeric ratings are MVP and apply to `ProductVersion`, not to a specific `PurchaseInstance` or the broad `ProductFamily`. Ratings use a 1–5 star scale in 0.5-star increments. The selected variant may be retained as contextual metadata, but the score represents the user's opinion of that formulation/version.

Ratings may be entered from the product page and edited later from the user's collection. If a user attempts to rate a product that is not marked Tried, prompt to mark it Tried as part of the rating flow rather than silently changing state.

### Empty and Stale Product-Page States

Missing information should never make the product page appear broken or imply unsupported certainty.

- If no Canadian buying option is tracked, show `No Canadian buying options currently tracked.`
- If no verified destination benchmark price exists, communicate that no verified MSRP, Retail Price, or Reference Price is currently available for that market.
- Missing external ratings/signals may be omitted rather than rendering empty cards.
- Old prices may remain visible when potentially useful, but must retain their last-verified date and increasingly prominent stale-data messaging such as `Price may be outdated.`
- Never silently treat missing data as zero or fabricate a fallback value.

### Product Classification Dimensions

Canonical skincare product category is MVP scope. It identifies what the product is (for example, `Toner`, `Sunscreen`, or `Serum / Ampoule`) and supports category browse, category search, and product-page context. It must not be populated with retailer-specific category strings.

Skin concerns (for example, acne, dehydration, pores, dullness, redness, fine lines, or pigmentation), skin type, and active ingredients are separate classification dimensions. They are not substitutes for canonical product category.

### Future Active-Ingredient Taxonomy Foundation

Active-ingredient categorization is post-MVP but should be considered in the long-term domain model. Products may eventually expose structured attributes such as Vitamin C, Niacinamide, Retinoids/Retinol, AHA/BHA, Ceramides, Peptides, and other relevant actives.

These are product taxonomy/attributes rather than user-defined tags. The feature may later support browsing, filtering, collections, and discovery, but ingredient scanning or full ingredient-analysis functionality remains outside MVP.

### Onboarding Preferences

MVP onboarding should be short, visual, and optional rather than questionnaire-heavy.

Ask users for:

- skin type: Dry, Oily, Combination, Normal, Sensitive, Not sure
- beauty interests/preferences using multi-select chips, such as K-Beauty, J-Beauty, French pharmacy, European skincare, Sunscreens, Hydration, Acne-prone skincare, Sensitive-skin products, Budget-friendly, and Luxury

Users may skip either step and edit these choices later in profile settings.

Skin type is optional profile metadata and private-only in MVP. Preserve a visibility field in the schema so a future public-profile feature can allow user-controlled visibility without a data-model redesign.

Beauty interests may be used in MVP to personalize discovery surfaces, section ordering, suggested collections, and default browse context. They should not be used to make medical, diagnostic, or treatment claims.

The onboarding interaction should feel lightweight and visual, similar to selecting genres/interests in a consumer media app, rather than like filling out a medical intake form.

### Privacy Defaults

Defaults:

- personal notes: private
- purchase price: private
- purchase location: private
- opened date: private
- shopping lists: private by default
- personal numeric ratings: private by default
- MVP collections: private by default

Public collections are post-MVP. The schema should support future visibility controls. Default toward privacy, then let users share.

### Skin-Type Profile Metadata

Skin type is included in MVP as optional profile metadata. During account setup, users may select a skin type or skip the question.

Initial values may include:

- dry
- oily
- combination
- normal
- sensitive
- unsure / prefer not to say

Skin type is private-only in MVP. The schema should preserve a visibility field for future public profiles, but MVP UI must not expose skin type publicly. The MVP does not use skin type to diagnose conditions, prescribe routines, or make medical claims. The field exists primarily as profile context and as a foundation for future discovery or list personalization.

### User-Created Collections and Lists

User-created thematic collections are post-MVP by default and may be included only if scope permits without displacing core MVP collection states or shopping lists.

User-created groupings such as “Winter Routine,” “Japan Haul,” “Favourite Sunscreens,” or “Products I Would Repurchase” should be represented as collections/lists rather than arbitrary lifecycle shelves.

MVP collection-state views such as Want, Owned, Tried, and Finished may still use a shelf-like visual treatment, but they are system-defined states rather than user-created shelves.

The schema should support future public visibility, descriptions/comments, and profile showcasing even if those social features are not all exposed in the MVP.

### Collection Interaction and Drag-and-Drop

The collection UI should support polished drag-and-drop interactions where appropriate. The meaning of a drag operation depends on the source and destination rather than always behaving as a simple move.

Examples:

- dragging Want → Owned removes Want automatically and adds Owned
- dragging Owned → a Holy Grail tag target keeps Owned and adds the Holy Grail endorsement
- dragging a product into an optional/post-MVP user-created collection adds it to that collection without changing ownership state
- future profile showcase slots may accept dragged products or collections without changing their underlying states

### Add-to-Collection Interaction

The primary collection action should be lightweight and inspired by media-library interactions. For a product/variant with no existing user state, the default primary save action is `Want`. After saving, a small non-blocking menu may offer additional actions such as Owned, Tried, or Add to Shopping List. Adding the currently selected product variant to Owned completes immediately. If that variant is already Owned, selecting Owned again must not silently create another `PurchaseInstance`; provide an explicit `Add another purchase` action instead.

After the item is added, a non-blocking confirmation UI may offer:

- Add purchase details
- Not now
- Don't show this prompt again

Users who disable the prompt can still add or edit purchase details later from the collection entry or purchase instance.

### Product-Page UX Direction

The first product-page UI is a clean, usable functional implementation layout, not the final visual design. A simple two-column desktop layout or similarly straightforward placeholder presentation is acceptable while the product becomes technically operational. Keep layout/presentation components modular and do not couple domain or business logic to this initial structure, so the page can be redesigned later without a data-model or behavior rewrite.

The initial above-the-fold area should include:

- lightweight canonical-category breadcrumbs
- product image
- brand
- product name
- current version selector
- variant/size selector
- external rating signals
- prominent local MSRP / Retail Price / Reference Price when available
- primary collection action
- Add to Shopping List action

Version selection should normally use compact pill/button controls when the number of versions is small. A dropdown may be used if the version history becomes too long. Changing the selected version updates all version-specific information on the page.

External ratings should be shown as polished compact source signals, using the source/platform logo where permitted alongside its rating and relevant review count or ranking. They should not require separate full-size cards for every source.

Price comparison should be visible in one continuous view rather than hidden behind market tabs. For the Canadian MVP, all tracked retailers from which the selected variant can be purchased for delivery to Canada should appear together under `Buy in Canada`, regardless of the retailer's country. Separate local-market sections such as `Buy in Japan` or `Buy in Korea` are used for locally relevant offers and travel-planning context.

The product's strongest available local benchmark—official `MSRP`, official or trusted local `Retail Price`, or trusted `Reference Price`—should appear prominently in the main product details rather than being buried as merely another retailer row. Show its native currency, CAD conversion when available, source, and last-verified date. This benchmark is a core shopping-intelligence feature because it gives users context for what the product is normally intended to cost in its local market.

Offer tables should expose useful facts without trying to make the entire purchasing decision for the user. Core MVP rows include `Retailer`, `Price`, `Availability`, and `Extras`; shipping/delivery is optional supporting information only when reliable for that offer. Default ordering is lowest product price first; shipping does not affect the order.

Bundle offers remain in the normal offer list rather than a separate bundle section. Each offer may include factual `Extras` such as `Includes 15 g mini + pouch`. Extras do not affect default offer ordering.

Where a valid destination benchmark and Canadian comparison exist, the UI may show the difference/savings. Shopping-list estimates must disclose any products excluded because required benchmark/comparison data is missing.

### Profile Showcase Foundation

The domain/schema should support future profile showcase slots that allow a user to feature selected products or collections, similar to an inventory showcase. This can remain visually minimal in MVP, but the foundation should avoid requiring a later data-model redesign.
