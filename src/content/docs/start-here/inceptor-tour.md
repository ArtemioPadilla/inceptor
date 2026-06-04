---
title: The 60-second Inceptor tour
description: How a feature actually moves from idea to shipped in this scaffold.
---

Every feature ships through the same loop.

## 1. File the issue

Use one of the [issue templates](https://github.com/ArtemioPadilla/inceptor/issues/new/choose)
or run `npm run new-issue` (auto-detects labels from your branch).

The issue should answer four Shape Up questions:

- **Problem** — what changes
- **Appetite** — how much time / scope you're spending
- **Solution sketch** — your current best guess
- **Rabbit holes / no-gos** — what's out of scope

## 2. Hand it to Claude Code

In a Claude Code session, point Claude at the issue — a plain request is enough:

```text
Land issue #N from INTEGRATION-PLAN.md / ROADMAP.md / this issue.
End state: PR open, centinela APPROVED, tests green.
```

Claude orchestrates three sub-agents in sequence:

| Agent | Role |
|---|---|
| `prometeo` | Plans: dependency graph, behavior contracts, Functional Triad classification |
| `forja` | Implements: writes the failing test first, then the code, with `Tdd-Red:` trailer |
| `centinela` | Validates: build, type-check, tests, ethics checklist, forbidden-import scan |

## 3. Centinela validates

If approved, the branch is pushed and a PR is opened with `Closes #N` and
both sub-agent reports in the body.

If rejected, the verdict carries one of three tokens:

- `RETRY_FORJA` — fix is mechanical; route back to forja with the diagnosis
- `NEEDS_HUMAN` — fix needs judgment; surface to you
- `BLOCKED_UPSTREAM` — fix depends on something outside this issue

## 4. Merge

CI re-runs validation. Merge squashes the branch into `main`. The issue
closes automatically via the `Closes #N` convention.

## What this is NOT

It's not Scrum. There are no daily standups, no sprint reviews, no retros.
The decision is recorded in [ADR 0001](/docs/decisions/0001-shape-up-over-scrum/).
