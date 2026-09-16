# Architecture

PuruPuru is a pnpm workspace: `apps/web` is the Next.js application; `packages/domain`, `packages/database`, and `packages/ui` are shared packages; `scripts/import` runs developer-operated ingestion; `tests/domain` contains Node test-runner coverage. The documented structure is intentional even where the current implementation is small.

## Dependency boundaries

| Concern | Current home | Rule |
| --- | --- | --- |
| Domain rules and pure transformations | `packages/domain/src` | Presentation- and Prisma-independent rules: collection, shopping-list, ingestion matching, price history, and product-image contracts. |
| Schema and Prisma client | `packages/database/prisma`, `packages/database/src` | PostgreSQL schema, migrations, seed data, and the shared Prisma client only. |
| Reads and server orchestration | `apps/web/lib` | Server-only query helpers assemble read models and enforce current-user context. Shape queries deliberately to avoid N+1 work. |
| Mutations | `apps/web/app/**/actions.ts`, colocated server action files, `apps/web/lib` | Authenticate, validate, enforce ownership, invoke domain rules, and use transactions for compound writes. |
| UI | `apps/web/app`, `apps/web/components`, `packages/ui` | Routes and React components render supplied models and capture interaction; they do not own canonical business rules or access Prisma. |
| Ingestion | `scripts/import`, `packages/domain/src/ingestion.ts` | Adapters normalize source records; domain matching is conservative; the Prisma repository persists only confirmed canonical matches. |
| Tests | `tests/domain` | Test public domain contracts and persistence-sensitive behavior at the lowest useful layer. |

`apps/web` may depend on workspace domain/database/UI packages. `packages/domain` must remain independent of React, Next.js, Prisma, and infrastructure. Database access belongs on the server; client components receive serializable view data and invoke narrow server actions.

## Data and write boundaries

The canonical identity chain is `ProductFamily → ProductVersion → ProductVariant → Offer`. Version and exact variant context must travel through links, queries, and mutations. Canonical catalogue identity is not created from uncertain retailer text: source adapters normalize untrusted input, matching requires sufficiently strong evidence, and unmatched or ambiguous records stay review outcomes. See `INGESTION.md`.

Prisma migrations live beside the schema. Review generated SQL, backfill needs, indexes, constraints, locking, and compatibility before applying a migration. Use transactions for compound state changes; the existing personal-collection write paths use serializable transactions with bounded conflict retry. Retryable ingestion uses stable source identities and must remain idempotent.

All private data access starts from the active authenticated user and scopes reads and writes by ownership. Do not accept a user ID, list ID, or collection ID as authority without verifying its relation to that user.

## Practical placement

Before adding a helper, look for an existing domain module or server helper. Put a stable, pure rule in `packages/domain`; keep Prisma query composition in server-only code; keep request/session handling and revalidation at the Next.js boundary; keep rendering and transient interaction in components. Introduce a new package, layer, or repository abstraction only when an existing boundary cannot express the need clearly.
