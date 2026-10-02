# PuruPuru engineering guidance

This file is the primary operational instruction for coding agents. The repository—not chat history—is the durable source of truth. Change application behavior only when the request authorizes it.

## Read before non-trivial work

1. `PRODUCT_SPEC_V0.md` for scope.
2. `docs/DECISIONS.md` for settled choices.
3. `docs/DESIGN_PRINCIPLES.md` and `docs/DATA_MODEL.md` for UX and domain invariants.
4. The task-specific references: `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/INGESTION.md`, `docs/USER_FLOWS.md`, `docs/ROADMAP.md`, and `docs/PROJECT_CONTEXT.md` as relevant.
5. `README.md` for commands and current status, then the existing code, schema, migrations, and tests that the change touches.

If a request conflicts with these documents, flag it before choosing a direction. Validate assumptions against the codebase; never fabricate missing data or infer business facts from absent values.

## Engineering standard

> Senior engineering means choosing the simplest solution that correctly satisfies current requirements while preserving reasonable future flexibility. Do not introduce abstractions, layers, frameworks, services, factories, repositories, or schema complexity merely to appear sophisticated.

- Find and fix root causes. Do not mask them with superficial patches.
- Extend established patterns only after inspecting them. Prefer explicit, small, well-named units over premature generalization.
- Keep a rule in one canonical place; do not duplicate domain semantics across components, actions, or queries.
- Keep domain, persistence, server, and presentation responsibilities separate as described in `docs/ARCHITECTURE.md`. React components are never the canonical source of business rules, and Prisma/database access stays out of them.
- Treat external input as untrusted: validate and normalize it before it reaches canonical data. Unknown stays unknown; missing values are not zero.
- Use safe TypeScript. Avoid unchecked assertions, broad `any`, and swallowed errors; represent expected failures deliberately and surface actionable unexpected ones.
- Consider authentication/ownership, concurrency, retry behavior, idempotency, transactions, failure states, and query shape whenever the change makes them relevant. Avoid N+1 reads.
- Add dependencies only for a clear, current benefit. Do not add speculative infrastructure.
- Keep migrations conservative and reviewable. Prefer additive, backward-compatible steps where practical; never apply destructive database changes silently.
- Comment on non-obvious reasoning or constraints, not syntax.

## PuruPuru invariants

- Treat PuruPuru primarily as a skincare price-comparison and shopping-intelligence product: help shoppers compare available retailer prices for the exact product and size they want, identify the best tracked buying option, and save money. Keep versioning, identifiers, provenance, and other data-model complexity out of shopper-facing hierarchy unless they materially affect a purchase.
- Preserve `ProductFamily → ProductVersion → ProductVariant → Offer`; never silently merge ambiguous versions, variants, or retailer listings.
- Treat `ProductVersion` as an exception for meaningful shopper-facing differences, not every barcode, release-year, wording, or minor packaging revision. A unique uncontradicted brand/product/exact-size match may associate an offer without exact release proof; contradictory evidence still requires review.
- Retailer data must pass normalization and conservative identity matching before it affects canonical catalogue data. `Offer.availableMarkets` means customer/delivery markets, not retailer location.
- Preserve native prices and provenance. Currency conversions are approximate presentation values. MSRP, Retail Price, and Reference Price have distinct meanings. Missing benchmarks are excluded from savings, never treated as zero.
- Affiliate relationships never affect ranking. Default offer order is product price ascending; shipping and extras are factual supporting data.
- Authenticated reads and mutations must enforce active-user ownership. Keep product/version/variant context explicit through links and mutations.
- Shopping-list `Purchased` is reversible checklist completion, not personal Collection ownership: it must not create or delete `PurchaseInstance` history, change Owned, or remove Want without a separate explicit Collection action.
- Retryable ingestion and equivalent operations must be idempotent.

## Proportionate workflow

For substantial work: (1) read the relevant docs and code, (2) state the approach and blockers, (3) make the smallest coherent change, (4) test important invariants, (5) run relevant checks, (6) inspect the diff and migration implications, (7) update documentation only when behavior or architecture changed, and (8) report the change, verification, compromises, and remaining risk.

Small obvious changes should stay lightweight. For meaningful code changes, run the applicable `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm db:validate` checks; do not claim a check or browser QA that was not run. See `docs/TESTING.md` for scope.

## Agent efficiency

> Optimize for correct work with minimal unnecessary context. Save tokens by avoiding redundant reads, oversized command output, repeated validation, and unrelated scope—not by skipping reasoning, safety, verification, or data-integrity checks.

### Context

- Inspect repository structure first, then read only the files and canonical docs relevant to the task.
- Prefer targeted `rg`, symbol searches, focused file ranges, and diffs over broad recursive reads.
- Do not reopen files already understood unless they changed, new evidence requires it, or verification depends on them.
- Reuse settled product and architecture decisions from canonical documents instead of rediscovering or restating them.
- Do not inspect generated files, dependency directories, lockfiles, build artifacts, generated Prisma clients, or large data files unless the task specifically requires them.
- When resuming interrupted work, inspect the current repository state and continue from completed work rather than reconstructing the task from scratch.

### Command output

- Bound commands whose output size is unknown or potentially large.
- Prefer targeted queries or bounded output such as `COMMAND 2>&1 | head -c 6000` when only a sample or failure excerpt is needed.
- Do not print entire lockfiles, generated files, build output, dependency trees, minified files, or large JSON/data files into context.
- For failures, capture the relevant error and surrounding context rather than the entire log.
- Do not truncate output when the complete result is necessary to make a correct or safe decision.

### Validation

- Use proportional validation while implementing.
- Run targeted tests and checks for the changed area during iteration.
- Run one coherent full verification pass near completion when appropriate: tests, lint, typecheck, build, and database validation as required by `docs/TESTING.md`.
- Do not repeatedly rerun the full suite after every small edit; rerun only checks that could have been invalidated by later changes or previous failures.
- Do not perform browser or visual QA for non-visual changes unless the task or risk requires it.

### Scope

- Make the smallest correct coherent change.
- Do not perform unrelated refactors, cleanup, documentation rewrites, dependency changes, or research.
- Expand scope only when actual dependencies, root-cause investigation, correctness, or security require it.
- Avoid external web research when repository sources are sufficient; use current external information only when the task genuinely depends on it.
- Ask for clarification only when ambiguity materially affects correctness; otherwise make the smallest safe assumption consistent with repository documentation.

### Communication

- Keep planning and progress updates concise: for non-trivial work, state the approach and blockers, then execute.
- Do not narrate routine commands or obvious implementation details unless they affect a decision, risk, or required user action.
- Keep final reports focused on what changed, verification performed, and remaining blockers, risks, or technical debt.

## Documentation maintenance

Update the appropriate canonical document in the same task when behavior, architecture, data invariants, scope, flows, or design principles change. Append material decisions to `docs/DECISIONS.md` using its established format; do not rewrite history to hide superseded reasoning. Report assumptions, unresolved risks, and technical debt explicitly.
