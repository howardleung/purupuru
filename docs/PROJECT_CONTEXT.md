# Project Context

## What this product is

PuruPuru is a skincare shopping, discovery, and independent price-comparison platform. It should become a place Canadian shoppers enjoy exploring even when they are not ready to buy, while helping them compare tracked retailer prices for the exact product and size they want. The canonical strategy and capability status live in [`PRODUCT_VISION.md`](PRODUCT_VISION.md).

The current working product name is `PuruPuru`. Domain, trademark, and final visual-brand review remain pending. Generic technical identifiers and existing infrastructure identities remain unchanged.

The product emerged from a real shopping workflow problem: skincare discovery and buying research are fragmented across social media, regional beauty platforms, brand sites, Canadian specialty retailers, international retailers, currency conversion, and personal notes.

The product should become both the place a user enjoys browsing skincare and the place they check before buying. It is not a technical database, daily habit tracker, or ingredient-analysis clone.

A useful shorthand is:

> A premium skincare storefront with independent, exact-size retailer comparison underneath.

Retailer and comparison tools may remain factual and information-dense where useful, but PCPartPicker-style table-first browsing no longer defines the main discovery experience.

## Core user value

The platform's first jobs are to make product discovery enjoyable and answer:

1. Which tracked retailer has the best price for this exact product and size?
2. Which other reputable buying options are available to me in Canada?
3. What authoritative reference-price context helps me judge that offer?
4. How has the tracked price changed over time?
5. Which products, brands, and categories are worth exploring?

## Initial wedge

- Home market: Canada.
- Catalogue focus: Korean, Japanese, French pharmacy and prestige skincare, plus other relevant international and domestic brands.
- Catalogue target: approximately 100 carefully curated products.
- Price coverage target: approximately 3–5 legitimate retailer/data sources plus local-market benchmark prices where available.
- Web-first responsive product. Native app is later, only if camera, barcode, push, offline, or location workflows justify it.

## Key differentiators

### Skincare-first discovery
Browsing should be image-first, fast, mobile-friendly, and intuitive by product family, category, and brand. Recommendations, popularity labels, and curated collections require reliable supporting data and must not be invented to make a surface look complete.

### Cross-market shopping intelligence
Users should see Canadian and international sellers known to serve Canada, plus authoritative domestic-market benchmarks that provide import-markup and value context. A foreign reference price is informational; it is not a delivered Canadian offer or a separate travel product.

### Trustworthy product identity
Shopper-facing identity is normally brand, product name, and exact size. Internal version and identifier evidence prevents materially different products or formulations from being silently merged, but stays out of the interface unless the distinction affects a buying decision.

### Canonical skincare taxonomy
The MVP uses a platform-owned hierarchical skincare taxonomy for product type, browse, and navigation. Retailer category labels are normalized into it rather than copied as canonical data. Product type remains distinct from active ingredients, skin concerns, and a user's skin type.

### Personal beauty record
Users save private version-scoped Likes through hearts, shared across sizes. Likes mean interest, not ownership, experience, or endorsement. Previous Collection relationships, purchases, and private ratings/notes remain preserved through secondary history access; Shopping Lists remain separate.

PuruPuru owns the user's in-product display name, curated avatar, and optional private skin-profile context. Clerk owns authentication and private account identity such as email and security settings; PuruPuru does not duplicate those credentials or expose a public profile in the current MVP.

## Business philosophy

Affiliate commerce is a plausible monetization path, but it must never compromise ranking integrity. A lower commission cannot make a cheaper retailer less visible; a higher commission cannot make an offer rank higher.

The first business milestone is proving that users enjoy browsing and find the comparison useful enough to revisit before purchases. Affiliate referrals, retailer relationships, and better product feeds may support sustainability, but commercial relationships never affect price ranking.

A unified multi-retailer PuruPuru checkout is a possible long-term business direction, not current functionality or an MVP commitment. It would require participating-retailer agreements, payment and order infrastructure, inventory synchronization, and clear fulfillment/returns responsibilities.

## Data philosophy

The product should aggregate signals rather than copy third-party review databases. Preferred data routes include official APIs, affiliate/product feeds, retailer partnerships, authorized sources, manufacturer data, and eventually user-contributed verified observations.

Third-party review text should not be scraped and republished as a foundation of the product. External ratings/rankings/review counts may be displayed only when legitimately obtainable and should link back to the source.

## Data-investment priority

Receipt scanning/OCR, purchase verification, and manual purchase-history analytics are retired from active planning. Preserve existing purchase-related code and data, including the boundary that cart/list state does not imply ownership, but prioritize authorized online retailer feeds, offer freshness, availability, and provenance-aware structured product information.

## Product-quality philosophy

The founder cares strongly about consumer UX polish. Small transitions, defaults, uncertainty states, and error-correction flows matter. Automation should save work without pretending to be certain when it is not.

The backend may be complicated specifically so the frontend can remain clean, obvious, and trustworthy.
