# PuruPuru identity migration

PuruPuru is the current working product name as of 2026-09-16. This is an identity-only change, not trademark/domain clearance or a final visual-brand redesign.

## Inventory and classification

The working tree was clean before edits. Case-insensitive tracked-content, source/test/config, filename, and redacted local configuration searches classified the former names before changes:

- **Current user-facing copy/metadata:** routes under `apps/web/app` (about, affiliate-disclosure, brands, catalogue, categories and category detail, contact, error, layout, loading, home, privacy, product detail, terms); collection/shopping-list action error messages; `site-header`, `site-footer`, `price-history-section`, and `shopping-list-details`. Updated to the new name, including the non-deliverable `hello@purupuru.example` placeholder. No real domain/email has been selected.
- **Current documentation/guidance:** `AGENTS.md`, `PRODUCT_SPEC_V0.md`, `README.md`, `data/seed/README.md`, and architecture, ingestion, naming, project-context, retailer-logo, testing, user-flow, and UX-spec docs. Updated current identity wording; removed the former name's etymology from current-name descriptions.
- **Historical decisions:** `docs/DECISIONS.md` retains the original Costmetic and Otoku decisions and historical rationale. The old naming decision is explicitly superseded; the new decision is appended rather than rewriting history.
- **Disposable verifier label:** `scripts/verify/verify-ingestion.ts` uses a new `example.invalid` URL prefix. This is a rollback-only QA fixture, not a real retailer URL or existing canonical identifier.
- **Package labels:** root `package.json` now names the private project `purupuru`. `@beauty-platform/*` scopes, workspace paths, imports, script filters, and lockfile remain generic and unchanged. No existing test expectations used the former name; a focused metadata/wordmark regression check was added.
- **External identity:** the current Git remote remains `https://github.com/howardleung/otoku.git`. No external rename was performed. No old-name matches were found in local environment files or `.neon`; their contents and identifiers were not modified.

No schema, migrations, seed records, database state, auth identities, credentials, or domain behavior were changed. Generated artifacts, dependency caches, and Git history are not current branding sources and must not be bulk-rewritten.

## Manual external rename checklist

These operations have not been performed. Confirm you are editing the existing resource, not creating a replacement. The repository does not establish the current Neon/Clerk display names or a deployed Vercel project's domains; verify those in their dashboards first.

1. **GitHub:** open `howardleung/otoku` → Settings → General → Repository name; enter `purupuru` (if available), then Rename. After confirming the rename, update each clone with `git remote set-url origin https://github.com/howardleung/purupuru.git`. Check the connected deployment's Git integration and any external links/workflow references. Do not reuse the former repository name, which would invalidate its redirects. [Official instructions](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository).
2. **Neon display name only:** open the existing project in the Neon Console → Settings → General; edit the project name to `PuruPuru` and save. Keep its project ID, branches, endpoints, database/role names, and both connection strings unchanged. If the current dashboard does not expose a name-only edit, stop and consult Neon support instead of recreating the project. [Project management reference](https://neon.com/docs/manage/projects). The reference could not be fetched during this pass, so the current dashboard labels need confirmation.
3. **Clerk application display name only:** select the existing application in the Clerk Dashboard → Configure → Settings → General; edit Application name to `PuruPuru` and save. Confirm both development and production instances still belong to the same application. Keep users, instance/application IDs, keys, and auth domains unchanged. If the dashboard labels differ, locate the application name setting rather than workspace rename or application creation. Review hosted authentication/email branding separately; a local copy change cannot update those. Current dashboard navigation was not verified live. [Clerk Dashboard](https://dashboard.clerk.com/).
4. **Vercel, if deployed:** select the existing project → Settings → General → Project Name; set `purupuru` and Save. Keep project/team IDs, secrets, and deployment settings intact. Then inspect Settings → Domains. Project renaming is not a custom-domain migration: choose/verify an available new domain separately, configure its DNS, retain the old domain until redirect and auth checks pass, and only then plan retirement. Generated deployment URLs may change. [Official rename instructions](https://vercel.com/kb/guide/how-do-i-change-the-name-of-my-vercel-project).

## URLs and environment configuration

No environment variables need renaming for this repository change. Do not edit `DATABASE_URL`, `DIRECT_URL`, or Clerk keys for a display-name rename. The Git remote update above is conditional on the GitHub rename. No selected production domain or name-specific deployment configuration is recorded here.

Before any real domain cutover, audit externally stored app URLs, Clerk allowed redirects/origins, OAuth callbacks, webhook destinations, email links, and deployment URL environment values. Update only verified old URL values, not secret identities. Verify anonymous navigation and end-to-end sign-in after that separate change. Domain/trademark clearance and a deliverable support email remain launch work.

## Files changed in this pass

`AGENTS.md`; `PRODUCT_SPEC_V0.md`; `README.md`; `package.json`; `data/seed/README.md`; `scripts/verify/verify-ingestion.ts`; `tests/domain/ux-integration.test.mts`.

`apps/web/app/{about,affiliate-disclosure,brands,catalogue,categories,contact,privacy,terms}/page.tsx`; `apps/web/app/categories/[slug]/page.tsx`; `apps/web/app/{error,layout,loading,page}.tsx`; `apps/web/app/products/[slug]/{page.tsx,collection-actions.ts}`; `apps/web/app/shopping-lists/actions.ts`.

`apps/web/components/{price-history-section,shopping-list-details,site-footer,site-header}.tsx`.

`docs/{ARCHITECTURE,BRANDING,DECISIONS,INGESTION,NAME_IDEAS,PROJECT_CONTEXT,RETAILER_LOGOS,TESTING,USER_FLOWS,UX_SPEC}.md`.
