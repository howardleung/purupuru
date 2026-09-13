# User Flows V0

These flows describe intended product behavior. Exact visual design is not fixed until prototypes are reviewed.

## 1. Anonymous browse → product page

1. User lands on the responsive website without an account.
2. They can browse/search products by canonical category, prices, benchmark pricing, external signals, and curated discovery sections.
3. Clicking a product card navigates to its ProductFamily page.
4. No authentication is required until the user attempts a personal action.

## 2. Browse by category

1. User selects a canonical skincare category from discovery/navigation.
2. Show a simple category-filtered product browse view for that category.
3. Show compact, clickable breadcrumbs for the category's canonical path, for example `Skincare > Cleansers > Oil Cleanser`.
4. Breadcrumb links support orientation and back-navigation and use SEO-friendly category routes.
5. Product cards lead to their `ProductFamily` pages.
6. Browse behavior uses each family's required primary canonical category; retailer/source category labels do not determine placement.

## 3. Search and autocomplete

### Input
Search supports MVP fields:
- product name
- brand
- common English aliases
- canonical category

Local Japanese/Korean name search and version-specific search are post-MVP.

### Autocomplete
As the user types:
- Matching brand result may appear first.
- Matching canonical category may appear where relevant.
- Matching ProductFamily results appear below.
- Do not return each size/version as a separate search result.
- Example: `dokdo` may surface multiple Round Lab Dokdo-line ProductFamilies.
- MVP ordering: trustworthy curated/popularity priority where available, otherwise deterministic alphabetical ordering.

### Brand result
A brand result can lead to a minimal brand page listing supported products, even if richer brand functionality is post-MVP.

## 4. Product page

### Above the fold
Present, in a calm hierarchy:
- compact, clickable breadcrumbs from the primary canonical category path, for example `Skincare > Toners > Toner`
- product image
- brand
- ProductFamily name
- primary canonical category
- version pills/selector
- size/variant selector
- compact external source signals (logo + rating/ranking/review count where permitted)
- strongest available benchmark (official MSRP, official/trusted Retail Price, or trusted Reference Price)
- native benchmark currency + CAD conversion when available
- source + verified date
- primary save action
- Add to Shopping List

Breadcrumbs are lightweight orientation/back-navigation aids, not a major product-page element. Their labels and links always derive from the canonical taxonomy, not retailer/source categories.

### Version switching
1. Default to current/latest ProductVersion.
2. Show only variants that exist for that version.
3. When selecting another version:
   - replace variant controls with that version's known variants
   - preserve exact same normalized size only if that exact variant exists
   - otherwise select that version's curated/default variant
   - update benchmark, external signals, and offers
4. Never mix version-specific data silently.

### Offer presentation
All information remains in a continuous page rather than requiring market tabs.

For Canadian MVP:

#### Buy in Canada
Contains any tracked offer whose `availableMarkets` explicitly includes Canada, regardless of the retailer's home or storefront country. This field describes a known customer/delivery market for that offer, not retailer identity; unknown market coverage is not inferred.

Columns may include:
- Retailer
- Price
- Availability
- Extras

Shipping/delivery may appear as optional supporting information only when sufficiently reliable for that specific offer; otherwise omit it. Default ordering remains lowest product price first and never uses shipping-adjusted total cost.

#### Buy in Japan / Korea / relevant market
Show local-market offers/reference context useful for travel planning.

Bundles remain normal offer rows. Example Extras: `15 g mini + pouch`.

### Empty/stale states
- No Canadian offer → `No Canadian buying options currently tracked.`
- No verified benchmark → say no verified MSRP/Retail/Reference price is available.
- Missing external signals → omit rather than show broken placeholder.
- Stale price → show last verified date and `Price may be outdated.`

## 5. Authentication interruption

If anonymous user clicks a gated action:
- Want
- Owned
- Tried
- rating
- Holy Grail
- Would Repurchase
- Add to Shopping List

then:
1. Keep the user on the product page.
2. Open authentication modal.
3. Preserve selected ProductVersion/Variant and intended action.
4. After successful sign-in, resume that action automatically.

Initial auth methods: Google + email magic link.

## 6. Primary save / collection interaction

### Unsaved product
Primary action defaults to Want.

On click:
1. Add the selected ProductVersion to Want immediately, retaining the selected variant only as interaction context.
2. Show a small non-blocking confirmation/action menu.
3. Menu may offer Owned, Tried, Add to Shopping List, etc.

### Want → Owned
- Remove Want automatically.
- Create a PurchaseInstance with optional/unknown purchase metadata.
- Do not ask whether to keep Want; Want is first-time wishlist intent.

### Owned action
If the selected version already has active/recorded ownership through any of its variants:
- Show Owned state.
- Do not silently create a second purchase.
- Expose `Add another purchase` explicitly; after confirmation, it creates one purchase for the currently selected variant.

### Optional purchase details
After Owned:
- Add purchase details
- Not now
- Don't show this prompt again

Purchase details can always be edited later.

### Tried
Can be set without Owned (sample, prior use, friend's product, etc.).

### Holy Grail
Independent aspirational/favorite tag. No prerequisite.

### Would Repurchase
Intended for a Tried product. If not Tried, ask whether to mark Tried + Would Repurchase.

## 7. Personal rating

1. User rates a ProductVersion from product page or later collection UI using a 1–5 star scale in 0.5-star increments.
2. Rating applies to ProductVersion, not a specific bottle/purchase.
3. If not marked Tried, prompt to mark Tried while rating; only the explicit combined confirmation applies both changes.
4. Rating is private by default in MVP.

## 8. Add to shopping list

From product page:
1. User clicks Add to Shopping List.
2. Lightweight selector opens.
3. Show existing lists plus Create new list.
4. Add currently selected ProductVariant.
5. If exact variant already exists on that list, increase quantity / allow quantity selector instead of creating duplicate rows.

### Create list
Require:
- list name
- supported target market/destination

MVP lists are private.

## 9. Shopping-list page

Each item shows:
- selected product/variant
- quantity selector
- eligible destination-market offers, with the lowest raw product-price offer selected initially
- applicable target-market benchmark
- potential difference/savings where valid
- purchased quantity/state

### Savings math
- multiply prices by requested quantity
- compare exact version/variant only
- require both a selected eligible target-market offer and a trustworthy benchmark for the same market and exact variant
- exclude missing products entirely
- disclose number of unique excluded products near estimate
- any excluded product → label Partial estimate

Example:

> Estimated savings: CA$87
> 3 products excluded because no verified Korea benchmark price is available.

### Mark purchased
1. User marks quantity purchased.
2. Create a linked PurchaseInstance whose quantity is only the newly purchased delta.
3. Update Purchased state.
4. Offer optional Add purchase details.

Future receipt import can automate this flow but is not MVP.

## 10. Collection page

MVP system views may include:
- Want
- Owned
- Tried
- Finished purchase history

Tags/filters may include:
- Holy Grail
- Would Repurchase

User-created thematic collections are separate objects.

### Drag/drop
Where supported:
- Want → Owned triggers the same domain action as Owned button.
- Product → thematic collection adds membership only when optional/post-MVP thematic collections are in scope.
- Product → Holy Grail adds tag only.

Do not implement separate drag/drop business logic that diverges from normal actions.

## 11. Onboarding

After/around account creation, optionally ask:

### Skin type
Dry / Oily / Combination / Normal / Sensitive / Not sure / Skip

### Beauty interests
Multi-select visual chips such as:
- K-Beauty
- J-Beauty
- French pharmacy
- European skincare
- Sunscreens
- Hydration
- Budget-friendly
- Luxury
- Sensitive-skin products

Users can skip and edit later. Skin type is private-only in MVP. Preferences may personalize browse surfaces but not make medical claims.

## 12. Optional post-MVP user-created collections

Private thematic collections are post-MVP by default and may be included only if scope permits without displacing core MVP collection states or shopping lists:
- Winter Routine
- Japan Haul
- Favourite Sunscreens
- Products to Try

These do not alter lifecycle state. Public sharing/comments are post-MVP foundations.

## 13. Profile

MVP profile/account may expose to the owner:
- collection summary/statistics
- private skin type
- beauty interests
- lists/collections
- settings/privacy

Future public profile/showcase slots are schema-ready but not required for MVP UI.
