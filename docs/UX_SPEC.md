# PuruPuru Structural UX Specification

**Status:** Canonical specification for the next structural UX redesign  
**Scope:** Information architecture, interaction hierarchy, responsive behavior, and data-presentation rules  
**Not in scope:** Final branding, visual identity, or implementation in this document  
**Last updated:** 2026-10-01

## 1. Purpose

This document is the canonical source of truth for PuruPuru's next structural UX redesign. It translates settled product decisions into an implementation-ready interaction model while preserving the existing domain model and trust rules.

This is a structural UX specification, not a claim that every specified capability is implemented. The application has a structural implementation and an initial shared visual pass; future coding and design agents must compare existing behavior with this document before changing components or routes. Durable visual-system decisions live in [DESIGN_PRINCIPLES.md](DESIGN_PRINCIPLES.md#16-purupuru-visual-system); the visual pass does not supersede these interaction or data rules.

The supplied Sukoshi and PCPartPicker screenshots are references for information architecture and interaction patterns only:

- Sukoshi inspires the clean header, image-forward discovery, approachable search suggestions, and beauty-oriented personal surfaces.
- PCPartPicker inspires the product-category mega-menu, dense catalogue research tools, filtering, sorting, and side-by-side comparison behavior.
- PuruPuru must not copy either product's branding, assets, exact layout, typography, or visual identity.

## 2. Core design philosophy

PuruPuru should look and feel like a beauty product while behaving like a serious price-comparison and shopping-intelligence tool. Its primary job is to help shoppers compare available retailer prices for the exact product and size they want, identify the best tracked buying option, and save money. Versioning, identifiers, provenance, benchmarks, and history make that comparison trustworthy but remain secondary unless they materially help a purchase decision.

| Surface type | Primary character | Examples | Default density |
|---|---|---|---|
| Discovery | Attractive, approachable, image-forward | Home, search suggestions | Low to medium |
| Personal | Image-first, emotionally legible, progressively disclosed | My Collection, collection quick view | Low to medium |
| Research | Explicit, sortable, filterable, factual | Catalogue, comparison, offer sections | Medium to high |
| Bridge | Product identity first, shopping intelligence immediately useful | Product page | Mixed |

Global principles:

1. Lead with product, exact size, and retailer-price comparison; use progressive disclosure for supporting evidence and internal complexity.
2. Product imagery carries more weight on discovery and personal surfaces.
3. Structured facts carry more weight on research and comparison surfaces.
4. Unknown is better than guessed. Missing data remains missing.
5. The interface hides internal complexity without weakening product identity.
6. Affiliate economics never influence ranking or prominence.
7. This redesign does not settle final typography, colours, logo treatment, animation language, or decorative art direction.

## 3. Global interaction principles

### 3.1 Click and tap are authoritative

No important feature may be hover-only.

- Click/tap performs, opens, selects, or commits the action.
- Hover may preview or enhance an interaction on pointer devices.
- Keyboard operation must provide the same functional path as pointer interaction.
- Touch users must never lose a control, explanation, or state available on desktop.

### 3.2 Progressive disclosure

Show the minimum information required to understand the item and make the next decision. Additional details should be available through an explicit control, expansion, modal, sheet, or destination page.

Progressive disclosure must not hide:

- selected formulation and exact size;
- source-of-truth native price;
- material uncertainty or missing data;
- authentication requirements before a mutation;
- benchmark type/source when savings are shown.

### 3.3 Navigation and selection

- Row, image, and product-name activation opens the full product page unless the element is an explicit control such as a checkbox.
- Checkboxes and inline controls must not trigger row navigation.
- Known version and exact-size context survives navigation from catalogue, comparison, collection, and shopping lists.
- Browser back/forward should retain meaningful query, filter, sort, version, and variant state where practical.

### 3.4 Overlays

- Opening controls have accessible names and expose open/closed state.
- Focus moves into an opened modal, popover, drawer, or sheet and returns to its trigger on close.
- Escape closes dismissible desktop overlays; modal backgrounds are inert.
- Compound domain actions retain existing confirmations.
- Desktop popovers may become bottom sheets/full-width modals on mobile.

### 3.5 Feedback and errors

- Mutations show pending, success, and recoverable failure states.
- Do not optimistically display state that cannot be safely rolled back.
- Preserve product/version/variant context after authentication or error recovery.
- Empty states explain what is absent without claiming PuruPuru searched the entire market.

## 4. Responsive and mobile principles

Mobile feature parity matters more than identical layout.

| Desktop pattern | Mobile adaptation |
|---|---|
| Two-row header | Compact header with persistent search/account access and expandable menu |
| Mega-menu | Drawer or expandable category menu |
| Autocomplete panel | Full-width results panel or search sheet |
| Left filter rail | Filters button opening a drawer/sheet |
| Dense table | Compact stacked rows/cards with explicit sorting |
| Side-by-side comparison | Scrollable comparison with pinned identity, or stacked attribute groups |
| Modal/popover | Bottom sheet or full-width modal |
| Hover preview | Touch-visible state; tap commits |

- Do not shrink a desktop table until labels and controls are unusable.
- Avoid page-level horizontal overflow; deliberate comparison-region scrolling may be used when clearly indicated.
- Controls need comfortable touch targets and visible focus states.
- Search, filters, sorting, size selection, any meaningful formula selection, collection actions, and list progress retain full capability on narrow screens.
- Mobile content order follows task priority, not desktop column order.

## 5. Header and primary navigation

### Purpose

Provide persistent access to global search, discovery, private tools, and account state without visual heaviness.

### Desktop

Upper row:

- global search on the left;
- centred PuruPuru wordmark/logo;
- profile/account control on the right.

Second row:

- clear primary navigation;
- expected destinations include Products, Brands, Browse or Skincare, My Collection, Shopping Lists, and About where appropriate.

Exact labels may be refined during implementation. Never expose `ProductVersion`, `ProductVariant`, or ingestion/database terms.

### Authentication states

- Anonymous users can use Home, search, Products, Brands, categories, catalogue, product pages, pricing research, and About.
- My Collection and Shopping Lists may remain visible anonymously if activation produces a clear sign-in prompt.
- Sign-in does not interrupt public research until a private action/destination is chosen.

### Interaction and mobile

- Wordmark returns Home.
- Products opens the category menu through click/tap. Hover may preview on desktop but is never required.
- Search opens autocomplete when a query is present.
- Active navigation state is visually and programmatically clear.
- Mobile retains wordmark/Home, search, account access, all destinations, and expandable category navigation.

## 6. Products mega-menu

### Purpose and data

Give a fast visual overview of skincare categories. Derive it from `CanonicalCategory` parent-child relationships where practical; do not create a parallel taxonomy.

### Desktop content

Primary visual cards:

- Cleansers
- Toners / Essences
- Moisturizers
- Treatments / Serums
- Sunscreen
- Masks

Secondary text links may include Eye Care, Lip Care, Toner Pads, Exfoliants, Pimple Patches, and other active canonical categories.

Large categories may use curated imagery; smaller categories may remain text links. Category images follow product-image provenance, accessibility, and fallback standards.

### Interaction

- Click/tap Products toggles the menu.
- Category activation opens its canonical route.
- Keyboard users can enter, traverse, activate, and dismiss it.
- Focus/reading order follows visual grouping.
- Clicking outside or Escape closes it on desktop.
- Mobile uses an accordion, drawer, or full-height menu; no category is desktop-only.

## 7. Global search autocomplete

### Purpose

Reach a likely product, brand, or category while typing without requiring submission.

### Results

| Group | Visible data | Activation |
|---|---|---|
| Products | Image/fallback, brand, product name, minimal secondary context | Product page with known version/size context |
| Brands | Matching canonical brand names | Brand page or brand-filtered browse result |
| Categories | Canonical label and optional parent context | Canonical category/browse result |

An optional final action, `View all results for "[query]"`, opens the catalogue with the query preserved.

### Query behavior

- Fully available anonymously.
- Debounce for measured latency; do not issue uncontrolled database calls on every keystroke.
- Cancel or ignore stale responses.
- Use a sensible minimum-query threshold if performance testing requires it.
- Keep ordering deterministic and results concise.
- Start with PostgreSQL/Prisma; add no external search service without measured need.
- Do not overcrowd results with offers, tags, long descriptions, or excessive metadata.

### Accessibility and mobile

Use the established combobox/listbox pattern: arrows move, Enter activates, Escape closes, loading/result counts are announced appropriately, and clear/view-all controls are named. Mobile provides the same groups/actions in a full-width presentation that remains usable with the on-screen keyboard.

## 8. Home

### Purpose

Introduce PuruPuru as an attractive skincare price-comparison product and guide users from the product and size they want to trustworthy retailer options.

### Immediately visible

- concise compare-prices, shop-smarter, save-money value proposition;
- prominent search;
- category/browse entry point;
- image-forward factual or curated discovery content backed by current data.

### Discovery sections

Desired future directions include Trending in Korea, Trending in Japan, Trending in France, Shop/Browse by Category, and other factual discovery sections.

`Trending` or `Popular` requires current, attributable ranking/external-signal evidence for that market. If evidence is insufficient, omit the section or use an honest name such as `Curated products`, `Explore Japanese skincare`, or `Recently added` when factually supported.

Demo price-history observations never produce deal, trending, lowest-ever, or popularity claims.

### Personalization

Public discovery remains primary. Signed-in personalization is secondary.

A future Want-list opportunity section may surface wanted products when evidence supports revisiting them:

- verified current sale;
- price below a trustworthy MSRP, Retail Price, or Reference Price;
- price meaningfully below sufficiently complete real history.

Do not infer a deal from missing benchmarks or demo history.

### Interaction/mobile

Product/card activation opens the product page; category activation opens canonical browse. Hover may add visual feedback only. Mobile remains image-forward and never hides evidence required for a claim.

## 9. Catalogue

### Purpose

Answer practical shopping questions quickly:

- What is the best tracked retailer price for this exact product and size?
- Which tracked products and sizes have offers available to the user's market?
- What are the highest-rated supported options?
- Which products contain desired structured actives once verified data exists?

This surface leans most toward PCPartPicker in behavior, never branding.

### Desktop structure

- left filter rail;
- result count and active-filter summary;
- dense readable one-current-variant-per-row results, with each exact size independently price-comparable;
- sortable column headers;
- optional comparison checkboxes.

Limit main visible columns to:

1. Image
2. Product name
3. Brand
4. Category
5. Size
6. Rating
7. Lowest tracked price

Actives are filters, not a permanent column.

### Catalogue price

`Lowest tracked price` is the lowest current product price for an offer the customer market is known to be able to buy.

For Canadian MVP users:

- `Offer.availableMarkets` must contain `CA`;
- eligible international retailers count alongside Canadian storefronts;
- `Retailer.country` never determines customer eligibility;
- shipping is excluded from raw product-price sorting;
- missing/non-comparable conversions receive no fabricated numeric value.

The exact placement of native-only non-comparable prices within price sorts is unresolved. They remain visible and explicitly unranked rather than receiving a fake conversion.

### Sorts

At minimum: price low/high, price high/low, rating high/low, rating low/high, and useful product/brand alphabetical orders.

Do not implement rating sorting until a public catalogue rating source, cross-scale normalization, and tie-break policy are selected. Private personal ratings must not silently become public catalogue ratings.

### Filters

Initial concepts: Category, Brand, Capacity, Price, Rating, Active ingredients, and Market/availability where useful. Capacity uses normalized compatible dimensions—volume in mL, mass in g, and discrete count—and never compares unlike units. When results contain multiple dimensions, the shopper chooses the dimension before setting a range.

Active-ingredient filtering reserves the correct structural location; it does not authorize invented ingredient data. Hide, honestly disable, or defer it until a verified taxonomy and populated records exist.

### Row behavior

- Row, image, or name opens the full product page, not a quick view.
- Comparison checkbox toggles without navigation.
- Preserve the row's current version and exact variant in the URL.
- Personal state may remain compact; do not turn research rows into collection cards.

### Mobile

Use stacked rows/cards, never a squeezed desktop table. Show image, product/brand, exact size, one identity cue, defined rating, lowest eligible price, and comparison selection. Filters use a drawer/sheet; sorting remains accessible. Underlying results/capability match desktop.

## 10. Product comparison

### Purpose and entry

Make factual differences between a small selected set easy to scan. Catalogue checkboxes select exact product variants and reveal a persistent compare tray/action. Users may remove items before opening comparison.

The final selection limit and URL/state persistence strategy are open.

### Comparison content

Supported/data-dependent rows may include:

- image;
- product and brand;
- category;
- explicit size and, only when relevant, formula context;
- catalogue rating once defined;
- lowest tracked price for active customer market;
- benchmark pricing;
- active ingredients once structured;
- other factual dimensions already represented in PuruPuru.

Never display fabricated or semantically incompatible values. Preserve benchmark labels/sources, and make differing sizes/formulations explicit.

### Interaction/mobile

Product identity links to the full product page with context. Desktop may pin product headers and allow focused horizontal scrolling. Mobile may use scrollable columns or stacked attribute groups; whichever tests better must retain supported facts.

Comparison is settled as a structural capability, while richer dimensions and delivery timing remain data/scope dependent.

## 11. Product page

### Purpose and priority

Answer in this order:

1. What is this product and size, and is there a meaningful formula distinction I need to know?
2. Where can the user buy it?
3. What trustworthy benchmark/supporting evidence exists?
4. What secondary research context exists?
5. How can the user privately save or plan it?

Personal controls no longer dominate the primary hierarchy.

### Desktop primary layout

Left:

- large product image/fallback;
- compact chip-style size selector directly below image attribution;
- a formula/version selector only when multiple shopper-relevant versions exist;

Right:

- brand;
- product name;
- canonical category/concise identity;
- benchmark context;
- `Buy in Canada` prominently near the top;
- compact circular `+` personal-action trigger.

The default presentation is brand + product name + size. A sole/default ProductVersion remains implicit; when multiple meaningful formulas exist, consumer labels map exactly to ProductVersion and ProductVariant without exposing database terminology.

### Buying options

`Buy in Canada` is one of the first major sections. On desktop, its dense comparison table uses exactly `Retailer`, `Extras`, `Availability`, and `Price`; on mobile, compact rows preserve the same hierarchy. Retailer name and price are separate safe links to the exact listing. In the Canadian site context, foreign-currency rows put an available approximate CAD value first and retain the authoritative native amount immediately below it. Extras come only from structured additional product value, while absent extras display an em dash. Shipping and verification stay out of the primary comparison. Default order remains product price ascending; shipping, extras, and affiliate information do not alter it. Empty state says no Canadian options are currently tracked, not that the product is unavailable.

### Secondary content

Destination-market offers, external signals, price history, detailed product information, and future verified attributes follow below. Continue the documented continuous-page approach rather than market tabs that force comparison from memory.

### Images/mobile

Use only images valid for the selected version; prefer exact-variant imagery, then safe version-wide imagery, never another formulation/size. Preserve alt text/provenance.

Recommended mobile order: breadcrumbs/identity, image, size (and formula only when meaningful), benchmark and Canada offers, compact personal `+`, then secondary research. Offer tables become readable cards/rows without losing source or uncertainty.

## 12. Personal `+` action modal or sheet

### Purpose and trigger

Replace the large always-visible Save and Plan panel with a compact circular `+` button associated with the selected product. Its accessible name describes the action, such as `Save or plan this product`.

### Content

Show current state and existing functionality:

- Want
- Tried
- Owned
- Holy Grail
- Would Repurchase
- personal rating
- Add to Shopping List
- Add another purchase when already owned

Clarify that relationship/rating state applies to the selected formulation, while list/purchase actions preserve the exact size.

### Canonical behavior

This is presentation only; reuse existing domain/query/mutation logic.

- Owned removes Want and creates the first PurchaseInstance.
- Repeating Owned is idempotent.
- Add another purchase is explicit and confirmed.
- Tried is independent of Owned.
- Holy Grail has no prerequisite and survives lifecycle changes.
- Would Repurchase requires Tried or the existing confirmed combined action.
- Rating requires Tried or the existing confirmed combined action.
- Anonymous activation opens authentication while preserving formulation, size, and intended action.

Desktop may use a modal, anchored popover, or persistent overlay appropriate to tested layout. Mobile uses a bottom sheet/full-width modal. No action is hover-only.

## 13. Personal rating interaction

Use five familiar stars while preserving 1.0–5.0 in 0.5 increments. Each star has two interactive halves: the left half of star four is 3.5; the right half is 4.0.

Desktop:

- hover previews candidate half-step and preceding fill;
- leaving without clicking restores persisted rating;
- click commits;
- keyboard users can reach every half-step and commit explicitly.

Touch/mobile:

- tap targets reliably distinguish halves;
- persisted and pending values remain visible without hover;
- if testing shows half-targets are error-prone, an accessible companion control may expose the same half-step values while stars remain primary.

Existing Tried/rating confirmation behavior remains unchanged.

## 14. My Collection

### Purpose

Feel like a personal beauty shelf, not an administrative table.

### Immediately visible

Image-first grid cards show only:

- dominant product image/fallback;
- product name;
- brand where useful;
- personal rating;
- a very small amount of high-value state when needed.

Do not display every tag, purchase fact, and lifecycle state on each card.

### Filters and sorting

Retain All, Want, Tried, Owned, Holy Grail, and Would Repurchase. Existing composable filter semantics and deterministic sorts remain canonical unless explicitly changed later.

### Activation and mobile

Click/tap opens the collection quick-view overlay. A separate View Product action inside navigates to the full page. This changes direct-navigation presentation, not the version-normalized read model: one card remains one user plus ProductVersion, never one per tag/purchase.

Mobile uses a responsive image grid; filters may scroll or use a sheet; quick view becomes a bottom sheet/full-width modal.

## 15. Collection quick view

### Purpose

Inspect and update private state without leaving My Collection.

### Content

- product image;
- brand/product name;
- formula context in consumer language only when multiple shopper-relevant versions exist;
- selected/default size where relevant;
- personal half-step rating;
- Want, Tried, derived Owned, Holy Grail, Would Repurchase;
- purchase summary where useful;
- clear View Product action.

Reuse the same collection actions as the product `+` overlay; create no modal-specific business rules. Updates refresh the card/active filters consistently.

The structure may later hold more private metadata, but does not imply public sharing, community activity, or review text.

## 16. Shopping Lists

### Purpose

Behave like a practical shopping cart/checklist for a real trip, with analysis available on demand.

### List summary

Prominently show:

- target market;
- estimated total;
- estimated savings;
- benchmark coverage;
- `Partial estimate` when anything is excluded;
- purchased versus remaining progress;
- amount actually saved only when reliable actual purchase-price data exists.

Missing inputs never become zero.

### Default item row

Keep collapsed rows clean:

- purchased/check state;
- product image/fallback;
- product name and exact size;
- quantity;
- concise intended/current price;
- lightweight controls.

Do not show benchmark, conversion, savings, retailer details, and purchase metadata simultaneously in every default row.

### Expanded detail

An explicit expansion may show:

- target-market native price;
- approximate CAD;
- benchmark type, amount, source, and coverage;
- estimated savings;
- selected retailer/offer;
- personal purchase details only after a separate explicit Collection action;
- honest exclusion reason.

### Offers and retailer filter

- Use the strongest verified target-market benchmark as the stable planned amount.
- Default the Canadian comparison to the cheapest relevant tracked offer whose `availableMarkets` includes Canada, and allow the user to override it.
- Keep target-market retailer offers as secondary availability intelligence.
- Do not permanently group or bind the entire list by retailer.
- Support a retailer/store filter answering `Which items can I buy here?`
- Filtering does not imply retailer ownership or exclusivity.

Whether an override persists is open; the current model intentionally stores no offer on ShoppingListItem.

### Purchase progress

- Purchased is a reversible full-item checkbox: unchecked means none of the current quantity is checked off; checked means all of it is checked off.
- Changing quantity while checked keeps the full current quantity checked.
- Purchased items remain visible but de-emphasized.
- Long lists may use a collapsible Purchased section.
- Checklist state may drive list progress and already-saved estimates, but it does not imply personal ownership.
- Checking or unchecking does not create or delete `PurchaseInstance`, change Collection state, or remove Want. A separate explicit Owned or `Add to My Collection` action applies those personal Collection rules.

### Actual price and savings

Long-term actual savings for an explicitly recorded personal purchase uses the real paid price where known. `PurchaseInstance.amountPaid` and `currency` provide a domain location for that personal history, but the editing flow and whether amount is per-unit or transaction-total must be settled before implementation. Shopping-list completion alone must not create that history.

Until actual price is reliable, use documented estimated-savings logic. Receipt OCR remains future scope.

### Mobile

Rows stack cleanly; check/quantity controls remain tappable; summaries remain readable; expanded detail uses accordions/sheets. Filters and retailer selection remain available without reproducing a spreadsheet.

## 17. Data semantics the UX must preserve

| Domain truth | UX requirement |
|---|---|
| `ProductFamily → ProductVersion → ProductVariant → Offer` | Consumer labels may simplify terms, but selected formulation, size, and offer identity stay exact. |
| Formulations cannot be mixed | Images, signals, benchmarks, history, and offers after version selection belong to that version. |
| Sizes cannot be mixed | Prices, list items, purchases, and history retain exact ProductVariant context. |
| Catalogue price is customer-market eligible | Use `Offer.availableMarkets`, not retailer country. |
| Retailer country is storefront context | Never treat it as delivery eligibility. |
| Native currency is authoritative | The Canadian UI may put approximate CAD first for scanning, but must retain the native amount immediately alongside/below it and never treat the conversion as authoritative stored price. |
| Benchmark types differ | Preserve MSRP, Retail Price, and Reference Price labels, precedence, and evidence. |
| Missing stays missing | Invent no zeroes, conversions, ratings, ingredients, popularity, savings, deals, or availability. |
| Shopping-list Purchased is not Owned | Use reversible checklist state for “Did this get bought?”; require a separate explicit Collection action for personal ownership and `PurchaseInstance` history. |
| Popularity requires evidence | Trending/Popular labels require attributable market signals. |
| Deals require evidence | Demo/incomplete history supports no deal or lowest-ever claim. |
| Affiliate economics are excluded | Commission never affects rank, prominence, or recommendation. |
| Personal state is user-scoped | Public browsing leaks no private state; private reads/mutations remain authenticated/owned. |
| Collection/rating are version-scoped | Cards may hide technical language but cannot collapse formulations. |
| Purchases/lists are variant-specific | Exact size survives add, progress, and return links. |
| Shipping is optional offer data | Omit unreliable shipping; never include it in raw-price sort. |
| History is exact evidence | Current price stays distinct; retailer series and native currencies remain separate. |

## 18. Settled direction versus open decisions

### Settled structural direction

- Beauty-first discovery/personal surfaces and research-first catalogue/comparison surfaces.
- Minimal two-row desktop header with left search, centred wordmark, right account, nav below.
- Products mega-menu derived from canonical categories.
- Immediate grouped autocomplete for products, brands, categories.
- Desktop catalogue with filter rail, sortable rows, and limited factual columns.
- Mobile catalogue with compact rows/cards, filter drawer, accessible sorting.
- Small-set factual product comparison architecture.
- Product page prioritizes identity/buying; personal tools move behind compact `+`.
- Five-star half-step rating with touch/keyboard equivalents.
- My Collection becomes an image-first shelf with private quick view.
- Shopping Lists become checklist/cart-like with progressive analytical detail.
- Click/tap is authoritative; hover only enhances.
- Full core mobile functionality is required.
- Existing domain, auth, pricing, savings, and trust rules remain canonical.

### Deliberately unresolved or future

- Final Home and Shopping List composition.
- Final typography, colours, logo/wordmark, animation, microinteractions, decorative art direction, mobile art direction.
- Exact nav labels and whether Brands initially has a dedicated route.
- Mega-menu imagery and licensing.
- Autocomplete debounce/query thresholds, result limits, ranking, caching.
- Public catalogue rating source, normalization, and tie-break rules.
- Placement of native-only non-comparable prices during cross-currency sorts.
- Comparison selection limit, URL/persistence, first dimensions, and milestone timing.
- Active-ingredient taxonomy/data population.
- Persistence of list offer overrides.
- Manual actual-price flow and per-unit versus transaction-total meaning.
- Richer comparison attributes.
- Community reviews, public profiles/lists, creator lists, user-curated discovery.
- Receipt OCR and production retailer integrations.

Open items are not permission to fabricate data or silently decide product behavior.

## 19. Implementation notes and constraints

### Current-state relationship

The current app already has public Home/catalogue/category/product routes, authenticated collection/lists, context-preserving URLs, source-aware images, offers, benchmarks, history, and reusable mutations. It does not yet implement this full structure.

Later presentation changes include:

- current header → two-row search/wordmark/account structure;
- submitted catalogue search → global autocomplete;
- grid catalogue → research rows/filter rail;
- no comparison surface → selection and comparison page;
- large Save and Plan panel → compact `+` modal/sheet;
- collection cards/direct product navigation → image shelf and quick view;
- dense list rows → checklist rows with expandable analysis.

### Architecture boundaries

- Components render interaction state; domain rules remain in domain/server layers.
- Reuse authenticated actions; do not duplicate overlay-specific mutations.
- Keep anonymous search/catalogue independent of Clerk and add private enrichment separately.
- Avoid N+1 queries for autocomplete, prices, personal state, images, and filters.
- Start search with PostgreSQL/Prisma; add services only after measured need.
- This document alone authorizes no schema change. Explain any genuine blocker before a later migration.
- Do not populate actives, ratings, popularity, or offers to make controls appear complete.
- Retain image provenance/fallbacks.

### Suggested implementation sequence

1. Responsive header, nav, mega-menu shell, global search contract.
2. Market-aware catalogue query/presentation model, filters, sorts, responsive rows.
3. Comparison selection and minimum factual page.
4. Product hierarchy, shared personal overlay, star rating.
5. Image-first collection and shared quick-view mutations.
6. Shopping-list checklist and progressive detail.
7. Cross-surface keyboard, touch, loading, empty, error, and responsive QA.

Each milestone preserves domain tests and adds focused behavior tests; styling snapshots alone are insufficient.

## 20. Major surface contract summary

| Surface | Purpose | Immediately visible | Progressive detail | Primary activation | Hover | Mobile |
|---|---|---|---|---|---|---|
| Header | Orientation | Search, wordmark, account, nav | Product categories | Nav/search/account | Menu preview optional | Compact header/drawer |
| Mega-menu | Category discovery | Major cards, minor links | Deeper taxonomy | Open category | Card emphasis | Accordion/drawer |
| Search | Known-item navigation | Grouped matches | View all | Open result | Row emphasis | Full-width panel |
| Home | Public discovery | Value, search, factual imagery | More discovery | Open product/category | Card emphasis | Stacked/image-first |
| Catalogue | Product research | Filters, rows, facts, sort | More filters/compare | Open product; checkbox selects | Row emphasis | Rows/cards + filter sheet |
| Comparison | Differences | Selected items/key facts | Supported attributes | Open/remove product | Column emphasis | Scrollable/stacked |
| Product | Identity/buying | Image, formulation, size, benchmark, Canada offers | Destination, signals, history | Retailer or `+` | Minor previews | Priority stack |
| Personal `+` | Save/plan | Current state/actions | Purchase/list detail | Commit action | Rating preview | Bottom sheet/modal |
| Collection | Personal shelf | Image, identity, rating | Quick view | Open quick view | Card emphasis | Image grid |
| Collection quick view | State editing | Image, rating, state, summary | Future private metadata | Mutate/View Product | Rating preview | Bottom sheet/modal |
| Shopping List | Trip checklist | Progress, totals, clean rows | Offer/benchmark/savings | Check/expand/filter | Row emphasis | Stacked checklist/sheets |

---

If another document conflicts on structural presentation, this specification governs the next redesign. Product scope, domain invariants, data semantics, authentication rules, and roadmap timing remain governed by their existing canonical documents unless a newer accepted decision explicitly supersedes them.
