---
title: TDD with commit trailers
description: Red → green → refactor, enforced via Tdd-Red commit trailers.
---

`type:feat` and `type:fix` issues ship a **failing behavior test first**, then
the implementation. Enforcement uses commit trailers, not git-log topology (which
breaks on squash-merges, rebases, and legitimate single-commit fixes).

## The TDD tier rubric

Not every change deserves a red→green dance:

| Tier | Applies when | Required artifact |
|---|---|---|
| `tdd-tier:strict` | Default for `type:feat` and `type:fix` that change behavior | A `test(...)` commit *and* a `Tdd-Red: <sha>` trailer on the green commit |
| `tdd-tier:smoke` | One-line variants, CSS-only tweaks, prop additions with default | A `?raw` source-text or render-once assertion is enough |
| `tdd-tier:exempt` | Copy fixes, comments, ADR additions, dep bumps with no behavior change | No new test required |

`prometeo` proposes the tier; the human accepts or edits before the run starts.
`centinela` enforces against the labelled tier, not a global rule.

## The trailer convention

The green commit carries a Git trailer:

```text
feat(ui): button supports loading state (#N)

Adds a `loading` prop that disables clicks and shows a spinner.

Tdd-Red: 0a1b2c3
```

`Tdd-Red: <sha>` points back to the originating red commit on the branch
(survives rebase, survives squash because the trailer is preserved in the merge
commit message). For legitimate single-commit work (regression test+fix in one),
use `Tdd-Red-Verified: inline`.

## The loop

1. **prometeo** emits a `## Behavior contracts` section per issue: 1-3 user-observable
   behaviors that must hold.
2. **forja** writes the failing test, commits it (`test(scope): red for <behavior> (#N)`),
   runs `vitest --run` to confirm red, writes the implementation, commits it with the
   `Tdd-Red:` trailer.
3. **centinela** greps the green commit for the trailer and re-runs the red commit's
   test to confirm it failed.

Source-text `?raw` assertions stay as smoke tests but don't count as a strict-tier
behavior contract.

**Bugs found in production: regression test first, fix second — non-negotiable
regardless of tier.**

Full rationale → [`docs/PRINCIPLES.md §2`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/PRINCIPLES.md#2-tdd--red--green--refactor)
