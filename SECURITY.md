# Security policy

## Supported version

Security fixes are applied to the current `main` branch. Older commits, forks, and independently deployed versions are not supported.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Use GitHub's private vulnerability-reporting feature for this repository. If private reporting is unavailable, contact the repository owner privately through their GitHub profile and request a secure reporting channel.

Include the affected area, reproduction steps, likely impact, and any suggested mitigation. Do not include real credentials, personal data, or destructive proof-of-concept output.

## Security posture

PuruPuru treats client input and retailer data as untrusted. Server boundaries validate mutation and ingestion payloads, private data access is scoped to the authenticated user, catalogue ingestion uses conservative matching and explicit review, compound writes use database transactions, and production requests use shared rate limiting and restrictive browser security headers.

Secrets and production identifiers belong in provider-managed environment configuration, not source control. The repository includes a read-only security verifier for tracked files, Git history, browser output, and accidental matches with configured local secrets:

```bash
node scripts/verify/verify-security.mjs
```

This is defense in depth, not a substitute for dependency updates, provider controls, code review, or responsible disclosure.
