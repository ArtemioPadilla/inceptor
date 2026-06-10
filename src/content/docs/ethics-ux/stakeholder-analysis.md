---
title: Stakeholder Analysis for risk:high
description: 7-step audit for highest-risk PRs.
---

When `prometeo` auto-applies the `risk:high` label, a Stakeholder Analysis is
required in `docs/decisions/` before merge. `centinela` blocks until it exists.

## When risk:high is triggered (mechanical, not self-labelled)

`prometeo` auto-applies `risk:high` when the planned changes match any of:

- New network request to a non-same-origin endpoint
- New `localStorage` / `IndexedDB` / cookie write of user input
- Routes under `/learn`, `/kids`, `/payments`, `/auth`
- Any change to `src/lib/diagnostics.*` or telemetry surfaces

## The 7-step procedure

For each `risk:high` issue, complete the following in `docs/decisions/<NNNN>-stakeholder-<short-name>.md`:

1. **List direct stakeholders** — who interacts with this feature directly?
2. **List indirect stakeholders** — who is affected but doesn't touch the UI?
3. **List intended values** — what does the system optimise for?
4. **List excluded values** — what does it explicitly *not* optimise for?
5. **Identify conflicts** between values (intended vs excluded, stakeholder vs stakeholder)
6. **Identify mitigations** for each conflict
7. **Document trade-offs accepted** — what harm remains after mitigation, and why it's acceptable

Output goes in `docs/decisions/` as an ADR variant using the [template](/docs/decisions/template/).

## Example triggers and mitigations

| Trigger | Common conflicts | Typical mitigation |
|---|---|---|
| New IndexedDB write | User's stored data vs privacy expectations | Overt disclosure (privacy toast), user-initiated clear |
| Non-same-origin fetch | Data leaving domain vs user trust | Minimal payload, user consent before first call |
| Auth routes | Convenience vs access control | Rate limiting, session expiry, audit log |

## Enforcement

`centinela` greps `docs/decisions/` for a file matching `*-stakeholder-*` before
issuing APPROVED on a `risk:high` PR. No ADR → REJECTED with `NEEDS_HUMAN` token.

Full procedure → [`docs/ETHICS.md — Stakeholder Analysis`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/ETHICS.md#stakeholder-analysis-deep-dive-for-riskhigh)
