# Design Principles

## 1. Complex backend, simple frontend

Users should not need to understand retailer identifiers, canonical product resolution, GTIN matching, formulation history, currency normalization, or price-confidence logic. The interface exposes only what helps them make a confident decision.

### First-build visual posture

The first MVP UI is a functional implementation layout, not the final visual design. Keep it clean and usable, but prioritize operational product behavior over final typography, visual identity, spacing polish, animation, or brand styling.

Use a straightforward layout—such as a simple two-column desktop product page—when it supports basic usability. Keep presentation components modular and avoid coupling domain/business logic to the initial layout so a later UI/UX redesign does not require data-model or behavior changes. The premium, calm visual character remains the product direction, not a requirement to finalize branding during the first build.

## 2. Trust is a feature

Never hide uncertainty. Prefer:

- `No Canadian buying options currently tracked.`
- `No verified Japan retail benchmark available.`
- `Price may be outdated — last verified May 2026.`

instead of implying completeness.

Verified price/benchmark data should carry a subtle verification indicator and date.

## 3. Provide information; do not make every decision

The product is closer to PCPartPicker than an opaque recommendation engine.

Default offer ordering is lowest product price first. Shipping/delivery, when sufficiently reliable for a specific offer, may appear as supporting information and does not alter the default order. Users can make their own tradeoff between price, shipping, retailer preference, availability, and extras.

Avoid a proprietary “best deal” score in MVP.

## 4. Product identity must be clear

A product page represents a product family, with explicit version and variant controls.

- Version: compact pills/buttons when feasible.
- Variant/size: only options that actually exist for the selected version.
- Default: current/latest version and curated/default standard variant.
- Switching version updates all version-specific information.
- Never mix offers or ratings from different formulations silently.
- Use compact clickable breadcrumbs from the canonical category path for product/category-page orientation and back-navigation. They should be visually subordinate to product identity and must never use retailer-specific category labels.

## 5. Shopping intelligence should be visible, not buried

The strongest available benchmark should be prominent near the product identity:

- official MSRP when manufacturer-defined.
- official Retail Price when supported by an official source, or a trusted local Retail Price where appropriate.
- Reference Price as the fallback trusted benchmark.

Show native currency, CAD conversion when available, source, and verification date.

## 6. Continuous price view

Avoid market tabs that force comparison by memory. Show information in a continuous page.

For the Canadian MVP:

- `Buy in Canada` includes Canadian and international retailers that allow the user to buy for delivery in Canada.
- Destination/local-market sections such as `Buy in Japan` or `Buy in Korea` provide local-market context and travel-planning options.

Core MVP offer columns:

- Retailer
- Price
- Availability
- Extras

Shipping/delivery is optional per-offer supporting information, not a required or guaranteed table column. Omit it when unavailable or unreliable; do not show a placeholder that implies a value or meaning not supported by the data.

Bundles remain normal offers with factual extras like `Includes 15 g mini + pouch`.

## 7. Saving should feel lightweight

Primary save behavior should resemble polished media-library interactions rather than inventory software.

For an unsaved product/variant:

- Primary save defaults to Want.
- After saving, a small non-blocking action menu can expose Owned, Tried, Shopping List, etc.

Adding Owned should happen immediately. Purchase details are optional follow-up information, not a blocking form.

## 8. Drag and drop should be meaningful

Drag/drop is used only where it improves tactility and clarity.

The action depends on the destination:

- Want → Owned: remove Want, add Owned/create purchase.
- Product → user-created collection: add membership without changing lifecycle state when optional/post-MVP thematic collections are in scope.
- Product → Holy Grail target: add tag without removing Owned/Tried.
- Future product/collection → profile showcase: feature it without changing underlying data.

## 9. Profile and collection should feel personal

The product is not merely a price engine. Collection statistics, product showcases, lists/collections, and eventually annual summaries give users a reason to maintain accurate history.

MVP skin type is private profile metadata. Public profiles/social sharing come later.

## 10. Onboarding is short and visual

MVP onboarding should feel like choosing interests in a consumer media app.

Ask optionally:

- Skin type: Dry, Oily, Combination, Normal, Sensitive, Not sure.
- Beauty interests: K-Beauty, J-Beauty, French pharmacy, European skincare, Sunscreens, Hydration, Budget-friendly, Luxury, etc.

Both can be skipped and edited later. Skin type is not a diagnosis and should not trigger medical recommendations.

## 11. Preserve continuity through the core journey

Primary navigation keeps Browse, My Collection, Shopping Lists, and authentication understandable at desktop and mobile widths. Private destinations may remain visible to anonymous users as long as opening them produces a clear sign-in state rather than private or misleading empty data.

Links between catalogue cards, product pages, My Collection, and shopping-list items should preserve the intended `ProductVersion` and exact `ProductVariant` whenever that context is known. Catalogue personalization is optional current-version enrichment and must never make anonymous discovery depend on personal data.

Responsive behavior should favor reflow over compression: action controls may stack, filter chips may scroll or wrap, and dense offer tables should become readable mobile cards rather than forcing page-level horizontal overflow.

## 12. Missing data should degrade gracefully

No Canadian offers: say so.
No benchmark: omit savings and explain missing coverage.
No external signal: omit the signal area rather than rendering an empty card.
No CAD conversion: show native currency.
Stale data: keep it when useful, but make age visible.

## 13. Visual character

The target feeling is premium, calm, modern, and beauty-aware—not a discount marketplace.

Prefer:

- strong whitespace
- clear hierarchy
- restrained badges
- high-quality product imagery
- smooth micro-interactions
- minimal modal interruption
- consistent cards/tables
- logos for external rating signals where permitted

Avoid clutter, aggressive sale language, excessive gamification, and feed-like noise.
