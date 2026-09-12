# Agent Instructions

This repository is the durable source of truth for the product. Chat history is not authoritative. Before making any non-trivial change, read the relevant documentation listed below.

## Required reading order

1. `PRODUCT_SPEC_V0.md` — current product scope and MVP decisions.
2. `docs/DECISIONS.md` — settled decisions and rationale.
3. `docs/DESIGN_PRINCIPLES.md` — UX and product-quality constraints.
4. `docs/DATA_MODEL.md` — canonical domain concepts and invariants.
5. `docs/USER_FLOWS.md` — expected user interactions.
6. `docs/ROADMAP.md` — what is MVP, post-MVP, and intentionally deferred.
7. `docs/PROJECT_CONTEXT.md` — compact background and product narrative.

Read `README.md` for repository conventions and project status.

## Core rules

- Do not invent undocumented product features during implementation.
- If a request conflicts with the docs, flag the conflict before silently choosing a direction.
- Trust and accuracy beat catalogue breadth. Unknown is better than guessed.
- Never merge product versions or variants unless identity is sufficiently verified.
- Affiliate commission must never influence offer ordering or recommendation prominence.
- Keep frontend interactions simple even when backend modeling is complex.
- Do not introduce medical diagnosis, treatment claims, skin-condition diagnosis, or AI skin analysis into the MVP.
- Do not rely on unauthorized scraping or copied third-party review corpora.
- Preserve native retailer currency and source/verification metadata for price data.
- Default offer order is product price ascending; shipping is displayed separately and does not change the default order.
- Bundles/extras are factual information and do not affect offer ordering in MVP.
- Missing benchmark prices must be excluded from savings calculations, never treated as zero.
- Public/social functionality should not be added merely because the schema anticipates it.

## Documentation maintenance protocol

Documentation updates are part of the implementation, not optional cleanup.

When changing product behavior, update the appropriate document in the same task:

- Product scope, MVP inclusion/exclusion, target users → `PRODUCT_SPEC_V0.md`
- A settled product/technical decision and rationale → `docs/DECISIONS.md`
- Screen behavior or interaction → `docs/USER_FLOWS.md`
- Domain entities, fields, invariants, relationships → `docs/DATA_MODEL.md`
- UX philosophy, visual/interaction standards → `docs/DESIGN_PRINCIPLES.md`
- MVP/post-MVP sequencing → `docs/ROADMAP.md`
- High-level project narrative or assumptions → `docs/PROJECT_CONTEXT.md`

If an implementation reveals that a documented assumption is wrong, do not quietly code around it. Update the documentation and note the change in `docs/DECISIONS.md`.

## Decision log format

For material decisions, append to `docs/DECISIONS.md`:

```md
### YYYY-MM-DD — Decision title
**Status:** Accepted | Superseded | Experimental
**Decision:** ...
**Why:** ...
**Implications:** ...
```

Do not rewrite historical decisions simply to hide prior reasoning. If a decision changes, mark the old one superseded and add a new entry.

## Coding-agent workflow

For a scoped implementation task:

1. Read the relevant docs.
2. Summarize the constraints that affect the task.
3. Inspect existing code before proposing a new abstraction.
4. Implement the smallest coherent change.
5. Run relevant tests/lint/type checks.
6. Update docs when behavior or architecture changed.
7. Report assumptions, unresolved uncertainty, and files changed.

Do not scaffold large unrelated feature areas without explicit instruction.
