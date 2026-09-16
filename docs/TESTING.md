# Testing

Test the behavior PuruPuru promises, not framework internals. Prioritize domain invariants and user-visible outcomes: product/version/variant separation, missing-data handling, offer ordering, benchmark precedence, collection transitions, shopping-list quantities, user isolation, and ingestion idempotency. Add a regression test when fixing a meaningful bug.

## Test levels

- **Unit/domain:** deterministic tests in `tests/domain` exercise exported pure rules from `packages/domain`.
- **Integration:** use database-backed coverage when query shape, constraints, transaction semantics, ownership, or idempotency depends on PostgreSQL/Prisma. The rollback-only ingestion verifier is an example: `pnpm ingest:verify`.
- **Manual browser QA:** use for interaction and responsive behavior that automated coverage cannot establish. State it separately; code or automated tests do not constitute manual browser verification.

Keep tests deterministic and focused on contracts. Prefer readable fixtures and exact assertions over gratuitous snapshots, timing dependence, private implementation details, or mocks that merely reproduce the implementation. Include failure and missing-data cases when they are meaningful. Do not invent test data that implies unsupported product certainty.

## Verification

Choose checks proportional to the change:

```text
pnpm test          # domain contracts
pnpm lint          # web linting
pnpm typecheck     # workspace TypeScript
pnpm db:validate   # Prisma schema
pnpm build         # production web build
pnpm ingest:verify # database-backed ingestion idempotency, when configured/relevant
```

Run relevant tests before claiming completion; run migration validation and inspect migration SQL for schema work. A passing test suite does not establish browser behavior, live retailer data, or deployment correctness.
