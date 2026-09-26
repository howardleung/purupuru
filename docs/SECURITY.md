# Security audit and deployment checklist

Audit date: 2026-09-16. Scope: current PuruPuru source, reachable repository history, installed/locked dependencies, and local production output. This is a code/configuration audit, not a penetration-test certification or an audit of hosted Clerk, database, or Vercel settings. All hardening changes remain uncommitted for review. No schema, migration, data, auth identity, credential, or external resource was changed.

## Attack surfaces and priorities

Public server-rendered discovery/product/catalogue/comparison pages and `GET /api/search`, `GET /api/categories` can cause database work. Existing Server Actions write private shopping-list/Collection data. Clerk handles authentication; local profiles identify ownership. Currency conversion fetches a fixed Bank of Canada endpoint; approved remote images use narrow Next image host/path allowlists. Source/retailer URLs are browser navigation metadata, not server fetch targets. Retailer ingestion remains an operator CLI. The narrow staged product-ingestion API and review pages are the only admin HTTP surface; there is still no upload, webhook, custom login/password, arbitrary external-fetch route, or generic database console.

Priority order: validate mutations before persistence; protect expensive public requests and private writes; add browser/payload protections; patch compatible vulnerable dependencies; test boundaries and record deployment-dependent gaps. Preserve pricing, identity, Purchased/ownership, and user-isolation semantics throughout.

## 1. Critical/high-risk issues found and fixed

- **Availability gap:** public dynamic routes/APIs and signed-in writes had no application-level rate limits. Shared atomic limits now apply before application database work; see the production configuration below. This limits individual actors, not distributed/volumetric attacks.
- **High-severity dependency findings:** Next's pinned PostCSS 8.4.31 had file-disclosure/source-map advisories, plus moderate XSS/incomplete-fix advisories. A narrow `next>postcss` override uses 8.5.28. Lockfile review confirms no unrelated dependency version changes. No attacker-controlled CSS upload/parser endpoint was found; these were dependency findings, not a demonstrated exploit against PuruPuru. See [PostCSS maintainer advisory](https://github.com/postcss/postcss/security/advisories/GHSA-6g55-p6wh-862q).
- No confirmed critical application exploit or cross-user authorization bypass was found in the inspected code. This does not establish that none can exist.

## 2. Medium/low-risk issues found and fixed

- Missing or malformed shopping-list IDs could become omitted Prisma predicates and select a different row belonging to the same user. Every action now checks required IDs and runtime shape before authentication/profile writes/queries. Existing user predicates remain mandatory.
- Wrong-type names/markets could throw before controlled error handling; validated bounded strings now precede normalization. Authentication/profile lookup failures now stay inside action error handling.
- Quantities previously accepted integers beyond PostgreSQL `Int`. The canonical quantity validator bounds all direct and additive updates to 1–2,147,483,647 without making zero removal or changing Purchased semantics.
- Persisted external URLs now pass a shared HTTP(S)-only, credential-free navigation check in retailer links, product sources, and shopping-list sources/offers. React escaping remains in place; no unsafe HTML renderer was found.
- Repeated/oversized catalogue filter and comparison parameters no longer reach string methods unchecked; autocomplete rejects queries over 80 characters. Comparison remains capped at four IDs. API failures return controlled messages instead of forwarding upstream exceptions.
- Added CSP, frame denial, MIME sniffing protection, referrer policy, restricted permissions, production HSTS, and disabled framework branding header. Server Action bodies are explicitly limited to 64 KiB; request URLs to 4096 characters.

## 3. Investigated and intentionally left unchanged

- No application raw SQL, unsafe HTML, dynamic open redirect, or request-controlled server fetch target was found. Prisma parameterization, narrow image allowlists, and fixed currency fetch URLs remain. Currency failures deliberately retain native prices without fabricated conversions.
- Server Actions retain Next's Origin/Host CSRF checks; no broad `allowedOrigins` exception or custom state-changing GET endpoint was introduced. See [Next's security guidance](https://nextjs.org/docs/15/app/guides/data-security). Clerk still owns cookies, credentials, and sessions; no replacement session system was added.
- Collection/Shopping List writes retain serializable transactions and bounded write-conflict retry. First Owned and repeated checklist toggles remain idempotent. Explicit Add another purchase remains a deliberate additional acquisition, not a generic retryable operation.
- Collection/history and catalogue alias matching still read complete scoped sets. Silent truncation would change factual filtering/history semantics. Current curated MVP size makes this a scaling concern; measured pagination/query redesign is required before substantially increasing catalogue or personal-history cardinalities.
- Collection/private-list pages still lazily upsert the local profile on signed-in viewing. These are authenticated, IP-throttled profile operations, not personal Collection mutations. Changing profile lifecycle was outside this focused pass.
- CSP is an enforced **baseline**, not a nonce-based strict policy: inline scripts/styles remain allowed for Next's static shell and Clerk CSS-in-JS. Production eval is disallowed; script/connect origins are restricted to the application and required Clerk/bot-protection hosts. A nonce policy would change rendering/cache behavior and needs a separate tested rollout. Clerk compatibility follows [official CSP guidance](https://clerk.com/docs/guides/secure/best-practices/csp-headers).

## 4. Rate limiting: implementation and setup

`apps/web/lib/rate-limit.ts` sends one atomic Redis Lua `EVAL` over HTTPS REST: increment a shared counter, set a 60-second expiry on its first request, and return count/TTL. No new package, database table, migration, or automatically provisioned service is required. Hashes—not raw IPs or Clerk IDs—are counter keys; counters expire after one minute. This is a fixed window starting with the first request, not a sliding-window guarantee.

Budgets per 60 seconds:

| Scope | Budget | Identity |
| --- | --- | --- |
| `/api/search` | 60 | Trusted Vercel ingress IP |
| Other application routes/APIs, including action POSTs | 120 | Trusted Vercel ingress IP |
| All authenticated Shopping List/Collection actions combined | 60 | Verified Clerk session user ID |

Middleware covers dotted dynamic paths too. Next static/image assets bypass it; Clerk's `/__clerk/` session transport is not application-throttled. The per-user write budget applies before profile upsert and once per action, not once per transaction retry. Invalid mutation inputs are rejected before private work. Authentication failures cannot grant access.

**Required manual production setup:** provision an Upstash-compatible Redis HTTPS REST store in an appropriate region, then configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as server-only deployment variables. Do not prefix either with `NEXT_PUBLIC_`. Consult the [official REST API](https://upstash.com/docs/redis/features/restapi). Use a store whose credentials permit the required `EVAL`/counter/expiry commands, scoped separately from other application data; monitor its quotas and availability. No store was provisioned during this task.

Production missing/partial configuration, timeout (1.5 seconds), redirect, malformed reply, or store failure **fails closed**: middleware returns generic 503 plus Retry-After; quota exhaustion returns 429 plus Retry-After. Mutations return a safe retry message. Consequently **production will not serve application routes until the store is configured**. Development without both variables bypasses limiting; partial configuration is never silently ignored.

Only real Vercel deployments (`VERCEL=1`) trust `x-vercel-forwarded-for`; other deployments/missing IPs share a conservative unidentified bucket rather than trusting caller-supplied headers. See [Vercel request-header guarantees](https://vercel.com/docs/headers/request-headers). Do not set VERCEL manually on an untrusted self-hosted origin. A different hosting/proxy architecture requires an explicitly reviewed trusted-IP adapter. Shared NATs can reach shared budgets; tune after observing real usage. Preview/production deployments using the same store share production-mode counters; isolate their stores if independent budgets are desired.

## 5. Authentication/authorization findings

- Clerk verifies the active session; `getMutationUser` derives the limiter identity from Clerk, and persistence resolves that identity to the local profile. Client-supplied `userId` is never authority.
- Shopping-list reads scope list ID plus active user/private visibility. Item writes scope item ID, list ID, and the list's owner before changing the exact located row. Removal detaches only that user's durable purchase history. Collection state/history/rating predicates include the active user; version/variant/family context is checked before Collection writes.
- Missing Clerk configuration leaves private operations unauthenticated, not public. Staged product ingestion requires a verified Clerk session plus exact membership in the server-only `PURUPURU_ADMIN_CLERK_USER_IDS` allowlist; it never trusts a submitted user ID and does not create a personal profile. Submission and approval use the existing authenticated mutation budget. Operator retailer ingestion remains separate from the admin route.
- Executed action tests check anonymous access, forged user IDs, cross-user row rejection, limiter-before-profile behavior, and mismatched product context. Database and Clerk stand-ins verify orchestration/predicates, **not** live provider/session or PostgreSQL isolation behavior.

## 6. Runtime validation findings

All seven current mutations accept untrusted inputs and validate at runtime. List names normalize only after bounded string checks and retain the 1–100 normalized length rule; markets retain the canonical CA/JP/KR whitelist. IDs are required bounded identifier strings; revalidation slugs cannot contain paths. Quantities use the canonical persisted integer bounds; Purchased requires a boolean. Collection intents are allowlisted, confirmations require booleans, and ratings use the canonical integer 2–10 half-star rule. No removal-through-zero or checklist-to-ownership coupling was introduced. Existing database quantity/rating CHECK constraints remain unchanged.

Scalar catalogue/search/price/comparison inputs are bounded; malformed/repeated values fall back safely. Sort enums retain their existing whitelist. Product selector parameters only select existing family-scoped records and are bounded. The current UI has no pagination input or mutation accepting arbitrary URLs. Future endpoints must add their own runtime validation rather than relying on TypeScript DTOs.

## 7. Secrets/environment findings

`.env.example` contains placeholders only; local env, keys/certificates, deployment metadata and dependency/build output remain ignored. The only `NEXT_PUBLIC_` application variable is Clerk's intentionally public publishable key. Database/Clerk secret/Redis credentials stay in server/edge configuration, not component props or API models. No sensitive application logging or forwarded stack/upstream bodies was found; operator CLI diagnostics remain local and should not be published.

`node scripts/verify/verify-security.mjs` performs read-only signature scanning of working files and all unique reachable Git blobs, plus browser bundles, and checks literal local database/Clerk/Redis secrets when available. It reports only credential type/location, never matching contents. The post-build scan found zero matches (375 historical blobs, 43 browser files). Gitleaks/TruffleHog were not installed. This limited scanner cannot prove absence of every credential format, secret in remote logs/artifacts, or unreachable/reflog history; enable managed repository secret scanning before release.

## 8. Dependency findings

Initial registry audit: five advisories (three high, two moderate). Final audit: **one high, zero critical/moderate/low**, nonzero audit exit status. PostCSS advisories are cleared by the targeted patch.

Remaining: `deepmerge-ts@7.1.5`, via Prisma 6.19.3's `@prisma/config`, [GHSA-ggr8-5vv4-36mx](https://github.com/RebeccaStevens/deepmerge-ts/security/advisories/GHSA-ggr8-5vv4-36mx). The advisory requires recursive object graphs; plain JSON alone does not create the condition. Inspection confirms the configuration package imports it, whereas the inspected Prisma request runtime does not. No request-controlled Prisma configuration or application deepmerge call was found. This is an exposure assessment, not proof of global non-reachability. Compatible Prisma 6.19.3 still pins 7.1.5; a forced deepmerge 8 major override or Prisma 7 migration was intentionally avoided. Track a supported patched dependency, or formally accept/verify the scoped risk before deployment. The audit is **not clean**.

Installed Next 15.5.25 and Clerk have no additional registry audit findings. ESLint 9.39.5 emits an upstream deprecation warning during dependency resolution; it is tooling, not a newly introduced application vulnerability. No unrelated major upgrades or audit-ignore rules were added.

## 9. Deployment/infrastructure tasks before release

1. Provision/configure the shared rate-limit store, budget/quota monitoring, regional placement, and 429/503 alerting. Test real atomic counters across concurrent application instances and timeout/outage recovery. The live-store path was not exercised here.
2. Configure Vercel firewall/bot/rate rules and spending/function limits **before origin/application execution**, including auth transport and image optimization. App limiting does not solve volumetric DDoS, distributed bots, signup abuse, or rate-store billing attacks. Verify ingress headers cannot be supplied by external clients and custom proxies cannot bypass the protected origin.
3. Configure production Clerk keys, exact production domains/redirect allowlists/authorized origins or parties, session lifetimes and appropriate MFA/bot protections. Run real signed-in/signed-out/two-user and cross-origin tests; verify Clerk modal, redirects, avatar assets and challenges under the CSP. Do not widen CSP origins indiscriminately to fix failures.
4. Verify HTTPS/custom-domain headers and HSTS on the deployed host. No HSTS preload or includeSubDomains commitment was made. Review any preview embedding requirement rather than weakening frame denial globally.
5. Review database least-privilege runtime credentials versus migration/operator credentials, TLS, connection limits, backups/recovery, and provider access controls. No hosted database configuration was inspected or modified.
6. Enable CI dependency/secret scanning, managed repository secret scanning, and access-controlled redacted operational monitoring. Resolve or formally review the remaining dependency advisory. Run new checks again on the final deployment artifact/configuration.
7. Profile growing catalogue, price-history and personal data; plan semantics-preserving pagination/query projections before large-scale ingestion. Set infrastructure request/time/resource limits and test realistic authenticated interactions against the budgets.

## 10. Verification results

- Targeted security tests: 18 passed (11 validation/headers/rate-limit tests plus 7 executed action-boundary tests).
- Full suite: 109 passed, zero failed. An old structural retailer assertion was updated to expect the safe-URL boundary; the initial full run exposed it, and the corrected full run passed.
- Lint: passed. Workspace typecheck: passed. Production build: passed (existing webpack cache warning about serializing a 192 KiB string remains). Prisma validation: passed, read-only; no generation/migration required. The final server-only environment marker was followed by another successful build/lint check.
- Registry audit: completed; one remaining high advisory as described above. First sandboxed registry access failed, elevated read-only access worked; an attempted pnpm timeout option hit a package-runner type error and was dropped. No audit failure is concealed as a pass.
- Read-only secret/history/bundle scan: zero matches. Reference review found no unsafe HTML, application raw SQL, or client secret environment reference; scoped query/action diffs reviewed. Diff whitespace check passed.
- Local production HTTP smoke: `/`, `/api/search?q=toner`, `/products/nonexistent.js`, and `/shopping-lists` correctly returned controlled 503, Retry-After/no-store, CSP/frame/MIME headers with the production rate store absent. No upstream/stack/credential text appeared in those bodies. The temporary server on port 3100 was stopped afterward.
- No manual browser QA, live Redis atomic/concurrency tests, hosted-provider audit, PostgreSQL-backed hostile-input/ownership tests, or authenticated Clerk end-to-end tests were performed. These remain explicit release tasks, not inferred from the passing tests/build.
