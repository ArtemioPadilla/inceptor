---
title: Issue-Driven Development
description: Every feature ships as issue → PR → merge → deploy.
---

This scaffold practices **Issue-Driven Development**. There is no "just push
to main", no "I'll write the tests later", no "we'll document it after launch".
Every change has:

1. A **GitHub issue** that names the problem, the appetite, the solution sketch, the rabbit-holes
2. A **feature branch** named `phase-N/issue-NNN-slug` (or `chore/...`, `docs/...`, `fix/...`)
3. A **PR** that closes the issue via `Closes #N` in the body
4. **Three sub-agent passes** — `prometeo` plans, `forja` implements, `centinela` validates
5. **Squash merge** to `main`, branch deleted

Read [the 60-second tour](/docs/start-here/idd-tour/) for the workflow walkthrough.

## When NOT to use IDD

Some changes are noise as full PRs. Use the `chore/<week>` train branch (when
[Epic 14](https://github.com/ArtemioPadilla/issue-driven-web-template/blob/main/ROADMAP.md)
lands) for:

- Typo fixes
- Dependabot dep bumps
- ADR additions (these are docs, not features)
- Comment edits

Squash-merge these in batches on Fridays. Full IDD is for behavior changes.

## See also

- [Shape Up cadence](/docs/how-we-work/shape-up/)
- [Sub-agents](/docs/how-we-work/sub-agents/)
