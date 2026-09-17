# Project Context

## What this product is

This is a consumer beauty discovery, collection, and shopping-intelligence platform. The initial focus is skincare, beginning with Korean and Japanese skincare and selective French/European support. Canada is the initial home market.

The current working product name is `PuruPuru`. Domain, trademark, and final visual-brand review remain pending. Generic technical identifiers and existing infrastructure identities remain unchanged.

The product emerged from a real shopping workflow problem: international beauty research is fragmented across Reddit, YouTube, TikTok, Google, @cosme, Olive Young, Amazon, Canadian specialty retailers, international retailers, currency conversion, notes, and travel shopping lists.

The product should become the place a user checks before buying skincare, not another daily habit tracker or ingredient-analysis clone.

A useful shorthand is:

> Letterboxd/Fragrantica-style personal collection and discovery, with PCPartPicker-style shopping intelligence for beauty.

That analogy describes the interaction model, not a request to copy those products visually or functionally.

## Core user value

The platform helps answer:

1. What is worth discovering in different beauty markets?
2. What do trusted local/global sources say about the product?
3. Which version/variant am I actually looking at?
4. What is the product intended to cost in its local market?
5. What buying options are available to me in Canada or while travelling?
6. What have I wanted, owned, tried, finished, loved, or planned to buy?

## Initial wedge

- Home market: Canada.
- Beauty markets: South Korea and Japan first; selective French/European skincare where feasible.
- Catalogue target: approximately 100 carefully curated products.
- Price coverage target: approximately 3–5 legitimate retailer/data sources plus local-market benchmark prices where available.
- Web-first responsive product. Native app is later, only if camera, barcode, push, offline, or location workflows justify it.

## Key differentiators

### Local-to-global context
A product can be extremely important in Japan or Korea without being internationally viral. The platform should surface local rankings/ratings/signals where legitimately obtainable and link back to original sources.

### Cross-market shopping intelligence
Users should see buying options in their home market, international sellers that ship to them, and local destination-market benchmarks for travel planning.

### Product-version intelligence
Beauty reformulations are frequently sold under nearly identical names. Versions should be distinguished using deterministic identifiers such as JAN/GTIN/UPC/EAN, manufacturer SKU, release version/date, formulation fingerprint, and packaging evidence. Old and new formulations must not be silently merged.

### Canonical skincare taxonomy
The MVP uses a platform-owned hierarchical skincare taxonomy for product type, browse, and navigation. Retailer category labels are normalized into it rather than copied as canonical data. Product type remains distinct from active ingredients, skin concerns, and a user's skin type.

### Personal beauty record
Users can track Want, Owned, Tried, purchases, finished instances, private ratings/notes, Holy Grail, Would Repurchase, and shopping lists.

## Business philosophy

Affiliate commerce is a plausible monetization path, but it must never compromise ranking integrity. A lower commission cannot make a cheaper retailer less visible; a higher commission cannot make an offer rank higher.

The first business milestone is sustainability, not founder salary. The product should first prove that users find it useful enough to revisit before purchases.

## Data philosophy

The product should aggregate signals rather than copy third-party review databases. Preferred data routes include official APIs, affiliate/product feeds, retailer partnerships, authorized sources, manufacturer data, and eventually user-contributed verified observations.

Third-party review text should not be scraped and republished as a foundation of the product. External ratings/rankings/review counts may be displayed only when legitimately obtainable and should link back to the source.

## Future community loop

A future receipt workflow could:

1. Scan/upload a receipt.
2. Detect retailer, products, variants, quantities, and paid prices.
3. Match items against a shopping list.
4. Let the user confirm/correct all matches.
5. Mark shopping-list quantities purchased.
6. Only after separate confirmation that these are personal acquisitions, create purchase instances and update the user's collection. Shopping-list Purchased alone must not imply ownership.
7. Contribute verified price observations to the platform.

This is intentionally post-MVP, but the data model should not make it difficult later.

## Product-quality philosophy

The founder cares strongly about consumer UX polish. Small transitions, defaults, uncertainty states, and error-correction flows matter. Automation should save work without pretending to be certain when it is not.

The backend may be complicated specifically so the frontend can remain clean, obvious, and trustworthy.
