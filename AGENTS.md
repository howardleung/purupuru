# Otoku engineering guidance

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

## Otoku invariants

- Preserve `ProductFamily → ProductVersion → ProductVariant → Offer`; never silently merge ambiguous versions, variants, or retailer listings.
- Retailer data must pass normalization and conservative identity matching before it affects canonical catalogue data. `Offer.availableMarkets` means customer/delivery markets, not retailer location.
- Preserve native prices and provenance. Currency conversions are approximate presentation values. MSRP, Retail Price, and Reference Price have distinct meanings. Missing benchmarks are excluded from savings, never treated as zero.
- Affiliate relationships never affect ranking. Default offer order is product price ascending; shipping and extras are factual supporting data.
- Authenticated reads and mutations must enforce active-user ownership. Keep product/version/variant context explicit through links and mutations.
- Retryable ingestion and equivalent operations must be idempotent.

## Proportionate workflow

For substantial work: (1) read the relevant docs and code, (2) state the approach and blockers, (3) make the smallest coherent change, (4) test important invariants, (5) run relevant checks, (6) inspect the diff and migration implications, (7) update documentation only when behavior or architecture changed, and (8) report the change, verification, compromises, and remaining risk.

Small obvious changes should stay lightweight. For meaningful code changes, run the applicable `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm db:validate` checks; do not claim a check or browser QA that was not run. See `docs/TESTING.md` for scope.

## Token and execution efficiency

> Minimize redundant context, commands, narration, and verification passes; do not minimize necessary reasoning, correctness, safety, or data integrity.

- Read only the files needed for the current task. Prefer targeted searches, symbol lookups, focused reads, and focused diffs over broad repository inspection.
- Reuse settled product and architecture decisions from canonical documents. Do not repeatedly restate known project context or redo completed research, schema analysis, architecture decisions, or verified work unless new evidence requires it.
- Keep planning and progress updates brief: for non-trivial work, state the approach and blockers, then execute. Do not explain routine commands or obvious implementation details unless they affect a decision, risk, or user action.
- During implementation, use focused tests for the changed area. Run expensive full-suite checks once the change is coherent; rerun them only when later changes could invalidate those results.
- Do not rewrite documentation wholesale for a small change. Do not inspect generated files, build output, lockfiles, generated Prisma clients, or dependency trees unless the task requires them.
- When resuming interrupted work, inspect the current repository state and continue from completed work rather than reconstructing the task from scratch.
- Avoid web research unless current external information is necessary. Ask for clarification only when ambiguity materially affects correctness; otherwise make the smallest safe assumption consistent with project documentation.
- Keep final reports focused on what changed, verification performed, and remaining blockers, risks, or technical debt.

## Documentation maintenance

Update the appropriate canonical document in the same task when behavior, architecture, data invariants, scope, flows, or design principles change. Append material decisions to `docs/DECISIONS.md` using its established format; do not rewrite history to hide superseded reasoning. Report assumptions, unresolved risks, and technical debt explicitly.
