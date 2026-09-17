# PuruPuru (working name) — Repository Context

This repository is for a web-first global skincare discovery, collection, and shopping-intelligence product.

`PuruPuru` is the current working product name. Domain and trademark clearance remain pending; generic technical identifiers stay unchanged. See [branding migration and manual infrastructure checklist](docs/BRANDING.md).

## Start here

For humans and agents:

1. Read `PRODUCT_SPEC_V0.md`.
2. Read `AGENTS.md`.
3. Read the relevant document under `docs/` for the task at hand.

## Documentation map

- `PRODUCT_SPEC_V0.md` — authoritative current product specification and MVP scope.
- `AGENTS.md` — primary operational guidance for coding agents.
- `docs/ARCHITECTURE.md` — current package, server, persistence, UI, and ingestion boundaries.
- `docs/TESTING.md` — test levels, contracts, and verification expectations.
- `docs/SECURITY.md` — security audit, runtime protections, rate-limit setup, and release checklist.
- `docs/PROJECT_CONTEXT.md` — compact narrative and rationale for the product.
- `docs/DECISIONS.md` — accepted decisions and rationale; append when decisions change.
- `docs/DESIGN_PRINCIPLES.md` — UX philosophy and interaction constraints.
- `docs/DATA_MODEL.md` — canonical domain entities and invariants.
- `docs/INGESTION.md` — developer retailer/source ingestion contract, safety rules, and commands.
- `docs/USER_FLOWS.md` — current user-facing flows.
- `docs/ROADMAP.md` — sequencing of MVP and future work.

## Settled MVP technical stack

- Next.js, React, and TypeScript for the web application
- Tailwind CSS and shadcn/ui for modular presentation components
- PostgreSQL with Prisma for persistence and data access
- Clerk for authentication
- Vercel for application hosting and deployment
- Neon for managed PostgreSQL

This stack prioritizes fast MVP development, strong TypeScript support, SEO and server rendering, low operational overhead, and a clean path to redesign the UI without restructuring domain logic.

## Intended repository structure

```text
/
├─ apps/
│  └─ web/
│     ├─ app/
│     ├─ components/
│     └─ lib/
├─ packages/
│  ├─ database/
│  ├─ domain/
│  └─ ui/
├─ data/
│  └─ seed/
├─ scripts/
│  ├─ import/
│  └─ verify/
├─ docs/
│  ├─ PROJECT_CONTEXT.md
│  ├─ DECISIONS.md
│  ├─ DESIGN_PRINCIPLES.md
│  ├─ DATA_MODEL.md
│  ├─ INGESTION.md
│  ├─ USER_FLOWS.md
│  └─ ROADMAP.md
├─ tests/
│  ├─ domain/
│  └─ e2e/
├─ PRODUCT_SPEC_V0.md
├─ AGENTS.md
├─ README.md
└─ .env.example
```

Empty folders/packages are acceptable initially if they represent intentional future boundaries.

## Documentation workflow

The docs are intended to replace reliance on any one chat history.

When discussing a new feature or decision with an AI agent, ask it to update the corresponding documentation in the same task. For example:

> Before implementing this change, read `PRODUCT_SPEC_V0.md`, `AGENTS.md`, and the relevant docs. If this discussion changes a product decision or flow, update the appropriate documentation and append the decision to `docs/DECISIONS.md` before or alongside the code change.

This allows Cursor Codex, Codex app, future ChatGPT sessions, or another coding agent to recover the project context by reading the repo.

## Current development posture

Do not generate the entire startup in one prompt.

Preferred sequence:
1. finalize core product-page flow
2. confirm technical stack
3. scaffold foundation
4. implement one end-to-end vertical slice
5. validate architecture against real product/version/offer data
6. expand catalogue and personal features gradually

The first implementation should optimize for clarity and correctness, not maximum feature count.

## Local development

1. Copy `.env.example` to `apps/web/.env.local` and `packages/database/.env`, then set the real values when available. The web environment needs the Clerk keys and both database URLs because signed-in server actions resolve the local user profile; the database package environment supplies Prisma CLI commands.
2. Install dependencies with `pnpm install`.
3. Generate Prisma Client with `pnpm db:generate`.
4. Seed the curated catalogue with `pnpm db:seed`.
5. Start the web app with `pnpm dev`.

Catalogue routes:

- `/` — public discovery homepage with product/brand search and category entry points
- `/catalogue` — searchable, sortable catalogue with canonical category and price filters
- `/categories/[slug]` — canonical category browse
- `/products/[slug]` — version-aware product detail and market offers
- `/collection` — private version-normalized personal collection with state filters and sorting
- `/shopping-lists` — private authenticated list creation and overview
- `/shopping-lists/[id]` — exact-variant quantities, purchase progress, and target-market estimates

Useful checks:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm db:validate`
- `pnpm ingest --fixture all --dry-run` — inspect fixture matches and planned writes without mutation
- `pnpm ingest:verify` — run rollback-only database idempotency checks
- `pnpm build`

Before production deployment, follow `docs/SECURITY.md`. Application requests require the server-only shared rate-limit store variables from `.env.example`; missing/unavailable production storage deliberately returns 503. Local development without either variable remains available. `node scripts/verify/verify-security.mjs` runs the read-only repository/history/browser-bundle credential checks (no credential values are printed).
