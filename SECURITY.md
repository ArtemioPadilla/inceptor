# Security policy

Only the `main` branch is supported.

## Reporting

Please do not file public issues for sensitive findings. Use:

- GitHub's private advisory flow: [report here](https://github.com/ArtemioPadilla/inceptor/security/advisories/new)
- Or email the maintainer (update this line in your fork)

Acknowledgement within ~72 hours; remediation within 14 days for confirmed issues, severity-dependent.

## Scope

In scope:

- Runtime correctness bugs in scaffold code (XSS, prototype pollution, SSRF, etc.)
- Dependency CVEs this scaffold amplifies
- Prompt-injection vectors in the sub-agent flow that could push to `main` or exfiltrate secrets
- Build-pipeline issues that could leak repo secrets

Out of scope (file as regular issues):

- Tooling preferences
- Forbidden-import scan misses (workflow tuning, not a vulnerability)
- Upstream dependency findings — report those to the dependency

## No-penalty pledge

Researchers acting in good faith under this policy are welcome. With consent, we credit reporters in the resulting advisory.
