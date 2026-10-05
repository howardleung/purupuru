# Engineering quality overview

PuruPuru is maintained around explicit domain, persistence, server, and presentation boundaries. The repository prioritizes data integrity and user isolation over speculative abstraction.

Current guardrails include:

- strict TypeScript checks, including unused locals and parameters;
- runtime validation for mutations and versioned ingestion payloads;
- conservative product and offer identity matching;
- serializable transactions for compound personal and catalogue writes;
- deterministic domain tests for missing data, ownership, idempotency, and price semantics;
- explicit production builds, Prisma validation, and dependency/security checks;
- keyboard, focus, responsive, and missing-state contracts for core UI behavior.

Automated source-contract and narrow DOM-stand-in tests are not represented as complete browser E2E or accessibility certification. Live retailer accuracy, visual QA, third-party permissions, and deployment configuration require separate review.
