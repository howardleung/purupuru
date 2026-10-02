# Design Principles

> **Canonical structural UX:** [`docs/UX_SPEC.md`](UX_SPEC.md) governs the next information-architecture and interaction redesign. This document continues to govern enduring quality principles; product scope and domain semantics remain governed by their respective canonical documents.

## 1. Complex backend, simple frontend

Users should not need to understand retailer identifiers, canonical product resolution, GTIN matching, formulation history, currency normalization, or price-confidence logic. The interface exposes only what helps them make a confident decision.

PuruPuru's primary interface job is to help a shopper find the product and exact size they want, compare available retailer prices, identify the best tracked buying option, and save money. Benchmarks, history, provenance, identifiers, and versioning support confidence in that comparison; they must not displace it in the visual or messaging hierarchy.

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

A product page should normally read as brand + product name + size. The internal version hierarchy protects data integrity without making shoppers understand release years, barcode revisions, or formulation bookkeeping.

- Variant/size is the normal visible choice.
- Keep a single current/default ProductVersion visually implicit when no meaningful choice exists.
- Show a compact formula/version selector only when multiple shopper-relevant versions are actually available.
- Switching a meaningful version updates its valid sizes and all version-scoped information.
- Never mix offers or ratings from materially different formulations silently.
- Use compact clickable breadcrumbs from the canonical category path for product/category-page orientation and back-navigation. They should be visually subordinate to product identity and must never use retailer-specific category labels.

## 5. Shopping intelligence should be visible, not buried

The retailer price comparison is the primary shopping surface. The strongest available benchmark should remain compact but visible near the product identity as supporting context:

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

## 14. Public orientation before authentication

The homepage should explain the consumer value before presenting account actions: identify the exact product, compare trustworthy market context, then save or plan privately when useful. Search and canonical category browse are prominent and database-backed. Anonymous visitors can move through Home → Browse/Category → Product → Compare without Clerk becoming a dependency.

Primary navigation uses consumer labels—Home, Browse, Categories, My Collection, Shopping Lists, and About—and stays understandable at narrow widths. Private destinations may remain visible when their pages provide a clear sign-in prompt.

## 15. Product imagery must preserve identity and trust

Use high-quality curated imagery when its version/variant identity and source are known. Exact-variant imagery takes precedence; a version-wide asset is acceptable only when it safely represents all shown sizes for that formulation. Never borrow another version’s packaging to fill a gap.

Every image needs useful alt text and provenance. A missing or failed asset renders a quiet, intentional fallback. Remote hosts should be narrowly approved, presentation should remain modular for a future gallery, and public-launch image rights/hosting must be reviewed.

## 16. PuruPuru visual system

The first visual pass layers a friendly consumer beauty identity over the existing research tools. White and near-white dominate; Nordic blue (`#67869A`), mist (`#C6D1D9`), oak (`#E7E0D8`), light grey, and sparse pale blush (`#F4EBE9`) provide restrained accents. Functional text, actions, and focus use darker accessible variants, including action blue `#47677D` and ink `#253442`; pastel brand colors are not substitutes for readable foregrounds.

`apps/web/app/globals.css` and `apps/web/tailwind.config.ts` are the shared token/recipe sources: page containers, surface cards, section headings, buttons, inputs, links, chips, and empty states. Rounded controls, soft borders/shadows, consistent spacing, visible keyboard focus, and reduced-motion support should be extended rather than replaced with page-specific design systems. Existing dense tables remain dense; mobile reflow and contained table scrolling remain intentional.

Typography is locally hosted Nunito variable, with system fallbacks and tabular numerals for research UI. The font comes from the [Google Fonts Nunito repository](https://github.com/google/fonts/tree/main/ofl/nunito), under the included SIL Open Font License (`apps/web/app/fonts/OFL.txt`). No external font service is required.

`BrandLogo` is the single replaceable wordmark/mark presentation. The repository-authored shopping-bag/drop SVG at `apps/web/public/brand/purupuru-mark-temporary.svg` is explicitly a temporary approximation of the supplied direction, not approved final artwork. Replace it with reviewed final SVG artwork through this component; do not scatter alternate logos. Water details and category symbols are decorative, never product imagery or evidence of category availability.

Homepage feature selection continues to use real catalogue ordering and images. Visual prominence does not imply popularity: no Trending/Most tracked badge or invented price, review, or availability may be added to match a mockup. Existing product-image provenance and public-launch rights review still apply.
