# Pre-visual-redesign codebase audit — 2026-09-16

## Scope and method

The working tree was clean at the start. Reviewed tracked application, domain, database-client, ingestion, test/fixture, workspace/configuration, and current architecture documentation. Used a TypeScript-AST static import/export reference scan (including relative and workspace imports), unused-local/parameter compiler checks, targeted mutation/query review, dependency/configuration references, redacted environment-key inventory, and stale-name/debug/comment searches. Next route entry points and configuration hooks are not dead merely because they lack ordinary importers.

This is a conservative source/architecture audit, not a penetration test, package vulnerability audit, production query profile, or live accessibility certification. No database writes, migrations, credential changes, infrastructure renames, commits, or pushes were performed.

## 1. Issues found and fixed

- **Duplicated transaction policy:** Collection actions duplicated the shared Shopping List helper exactly: serializable isolation, three attempts, retry only Prisma `P2034`. Both now import `lib/transactions.ts`; redundant functions and the resulting unused Prisma import were removed. Authentication, transaction bodies, and domain transitions are unchanged.
- **Duplicated allowlists:** catalogue sort validation now checks the existing `catalogueSorts` definition. The product page uses domain `BENCHMARK_PRECEDENCE` instead of restating its values. Existing ordering and tie behavior are unchanged; no cross-market benchmark selection rule was changed.
- **Unchecked ingestion cast:** related GTIN filtering now uses a type predicate rather than asserting an entire array is `string[]`. The retry-error guard also uses its already-narrowed `code` property directly.
- **Modal focus gaps:** the shared trap includes textareas, excludes disabled/negative-tabindex/hidden/inert/non-rendered controls, recaptures outside or container focus, and retains focus when there are no enabled controls. Both dialogs have a programmatically focusable container. Seven algorithm tests use narrow DOM stand-ins; browser focus behavior still needs manual QA.
- **Search ARIA references:** collapsed suggestions no longer leave `aria-controls` or `aria-activedescendant` pointing at absent options; out-of-range active indices are excluded and the listbox has an accessible name. Existing requests/navigation behavior is unchanged.
- **Stale image failure state:** the reusable product image component records the failing URL, not a component-wide boolean. A failure of one URL cannot suppress a different version/variant's later image. Existing identity selection and deliberate fallbacks remain unchanged.
- **Guardrail:** shared TypeScript configuration now enforces unused locals and parameters. The initial verification found an import left unused by this cleanup; it was removed, not suppressed.
- **Stale documentation/comments:** corrected README's homepage/catalogue route descriptions and middleware's obsolete future-action comment; clarified that the conceptual receipt flow requires separate personal-acquisition confirmation before Collection/history writes. Documented the canonical transaction helper and limits of source-contract/DOM-stand-in tests.

## 2. Issues found but intentionally left alone

- **Before public deployment — mutation input shapes:** several Shopping List actions validate quantity/market/name semantics but do not fully validate runtime string/identifier shapes. TypeScript inputs are not a runtime trust boundary; missing identifiers can be omitted by Prisma and malformed string values can fail before the guarded operation. Existing user predicates remain in the queries, but this deserves dedicated runtime-validation and hostile-input tests rather than speculative validator infrastructure in this cleanup.
- **Before public deployment — diagnostics:** Collection and Shopping List action catches return generic recoverable messages without server diagnostics; current-user resolution often occurs outside those catches. Add privacy-safe contextual logging/error reporting and test infrastructure-failure behavior in a focused task. Never log credentials or personal input wholesale. Currency-conversion null fallbacks and CLI result logging are intentional, not leftover debug logging.
- **Accessibility follow-up:** half-star buttons advertise a radio group but do not implement its conventional arrow-key/roving-focus pattern. Category-menu Escape handling does not restore trigger focus; failed category fetches still look like loading. Address these with actual keyboard/mobile QA and executed UI tests during the redesign. Modal changes above do not establish background inertness or screen-reader isolation.
- **Presentation choices:** money/date formatting varies between surfaces, including non-CAD decimal precision. Consolidating it blindly could change displayed price meaning. Review formats explicitly before choosing a shared display contract.
- **External/tool-generated environment keys:** `DATABASE_URL_UNPOOLED` and `NEON_BRANCH` occur in the local database environment but are not consumed by tracked app/scripts/schema code. Retained because external CLI/manual workflows were not established. `DATABASE_URL`, `DIRECT_URL`, Clerk public/secret keys, and `NODE_ENV` remain necessary; Clerk's secret is consumed by its SDK, not a direct app property read. Values were not disclosed or modified.
- **Retained intentional scaffolding:** `packages/ui`, empty E2E/UI folders, `lib/utils.ts` (`cn`), and its `clsx`/`tailwind-merge` dependencies. The utility is referenced by `components.json`, not current rendering, and the repository explicitly permits these future boundaries. The shadcn aliases currently advertise `@/…` without corresponding TypeScript paths and CSS-variable theming without configured theme tokens: reconcile the scaffold with the selected visual design before generating components.
- **Retained types/tests/fixtures:** internal exported types without external references still describe their module's contracts; removing `export` solely for aesthetics has no runtime benefit. Curated ingestion fixtures, demo price history, legacy observation fallback, and historical migration tests still exercise supported compatibility/trust contracts. They are not obsolete merely because live data exists.
- **Dependency warning:** offline lockfile maintenance reported `eslint@9.39.5` as deprecated. Kept the framework-aligned toolchain; no framework/Clerk/ESLint major upgrade was attempted. This warning is distinct from application lint/build warnings and needs a separate compatibility/support review.
- **Build cache warning:** the final production build emitted webpack's big-string cache serialization performance warning (192 KiB). The build completed successfully; cache/compiler tuning was not changed to conceal an informational warning.
- **Historical identity:** old names remain only in historical decisions and the branding migration/manual-remote checklist, plus the unchanged Git remote. No stale implementation references were found.

## 3. Dead code/files removed

- Removed route-local duplicate `runSerializable` and `isRetryableTransactionError` functions and their unused database import.
- Removed `nextQuantityAfterAdd`: its only callers were its own test, while the live action already uses `quantityStateAfterChange`. Updated that test to exercise the live canonical transition, including preserving a checked Purchased state, and retained minimum-one validation coverage.
- Removed the unused animation-plugin import/configuration entry. No whole source files, data records, fixtures, migrations, or intentional scaffold directories were deleted.

## 4. Dependencies removed

- `class-variance-authority`: no source/configuration consumers.
- `tailwindcss-animate`: only its plugin configuration consumed it; no plugin-specific animation classes were present. Native Tailwind animation utilities remain available.

The lockfile was updated offline with scripts disabled. Its diff removes only these dependencies' importer/package/snapshot entries; remaining resolved versions are unchanged. Lucide, React/Next, Clerk, Prisma, Tailwind/PostCSS, ESLint compatibility tooling, type packages, and intentionally retained utility dependencies remain referenced or required by their respective tooling.

## 5. Architectural concerns for later

- **Query scaling:** autocomplete and catalogue alias matching read alias candidates and filter them in memory; comparison calls the complete catalogue query for at most four requested IDs. Product-detail reads load all versions' offers/history, and metadata repeats the full detail helper rather than a smaller/memoized metadata projection. Optimize with measured cardinalities and regression tests; do not casually change alias matching or version fallbacks.
- **Conversions:** Shopping Lists invoke currency conversion per benchmark/offer, including offers later excluded from the visible markets. Next fetch caching limits external requests, but request-scoped rate reuse and query projection would help at higher volume. Historical native currencies and conversion provenance must remain distinct.
- **File responsibilities:** product detail, Collection actions, Shopping List actions/details, catalogue, and history chart are the largest modules. Their current boundaries are understandable; size alone does not justify splitting them. Extract redesign-specific rendering units only as actual change pressure arises. Client components reviewed have state, navigation, Clerk hooks, image error handlers, or interaction requirements; no unambiguous client-only marker was removed.
- **Testing:** many so-called integration tests are source-text contracts, not executed React interactions or PostgreSQL integration. Keep them as structural checks, but add real mutation/ownership/concurrency and browser interaction coverage before relying on them for public release. The E2E folder is currently only scaffold.
- **Transactions/retry scope:** inspected mutations retain active-user/list/version/variant predicates and compound operations use serializable transactions. Owned remains idempotent; Purchased remains reversible and independent of personal purchase history. CLI ingestion rejects transaction conflicts instead of bounded auto-retry. No ownership bypass or per-row database N+1 loop was found in the inspected source, but this is not a database execution/profile guarantee.
- **Bundle:** production shared first-load JavaScript is approximately 102 kB, with product detail approximately 151 kB including route code. No large new runtime library was introduced. Removing already-unimported packages is dependency hygiene, not a claimed measurable runtime bundle reduction.

## 6. Verification

Final results:

- Full tests: **91 passed**, zero failed.
- Lint: passed, no application warnings.
- Workspace typecheck (including the unused-symbol guardrails): passed.
- Production build: passed; the webpack cache warning above remains.
- Prisma schema validation: passed, read-only; no schema edits or client generation needed.
- Static relative/workspace import-cycle scan: zero cycles detected.
- Removed dependency/helper reference and stale implementation-name searches: no matches in active source/tests/configuration/lockfile.
- Diff checks: passed. Lockfile changes are exactly 22 removed lines for the two removed dependencies.

The package runner's initial audit-only `exec tsc` command could not find the installed executable, so the installed compiler was invoked directly; final workspace script verification passed. Checks used `--config.verify-deps-before-run=false` to avoid an automatic dependency refresh, using existing installed dependencies. Lockfile maintenance itself was offline with scripts disabled.

Additional checks include unused locals/parameters, TODO/FIXME/HACK/debug searches, and diff/lockfile review. No new broad `any` usage was found; validated adapter assertions, logically guaranteed selection assertions, and the conventional Prisma singleton typing were retained rather than mechanically rewritten.

No browser/manual UI QA, database-backed ingestion verifier, hostile-input integration tests, or external infrastructure checks were performed. Final keyboard, assistive-technology, and mobile QA remain necessary before publishing the redesigned milestone.
