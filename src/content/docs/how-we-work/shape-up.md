---
title: Shape Up cadence
description: Pitches, appetites, cycles, cooldown.
---

This project uses **Shape Up** instead of Scrum. Solo-dev-plus-AI-sub-agents makes
Scrum ceremonies degenerate — Shape Up's primitives translate cleanly.

## Core concepts

| Shape Up | This repo |
|---|---|
| Pitch | A written issue spec — problem, appetite, solution sketch, rabbit-holes, no-gos. Examples: `INTEGRATION-PLAN.md` entries; `.github/ISSUE_TEMPLATE/` forms |
| Appetite | Phase or milestone — *fixed time, variable scope* |
| Betting table | Monday ritual: pick the next pitch, hand the scope to Claude Code |
| Cycle | The phase duration |
| Cooldown | 2-day gap after each phase — no new features, only docs / refactors / dep bumps / debt-paying |

## Cooldown is structural, not on honor

Between phases, `main` carries a `cooldown/<phase>-end` git tag. `prometeo` refuses
to plan `type:feat` issues until the tag is replaced by `cooldown-cleared`. Only
`type:chore` and `type:docs` pass during cooldown.

## The Monday ritual (15 min, solo)

1. Open `ROADMAP.md`, pick a phase / milestone — that's the appetite
2. Open or write the pitch as a GitHub issue (use `.github/ISSUE_TEMPLATE/`)
3. Hand the scope to Claude Code — prometeo plans, you approve, forja+centinela execute per issue
4. Friday afternoon: hill-chart update on `ROADMAP.md`
5. End of phase: cooldown — no new features, only debt-paying work

## Why Shape Up over Scrum?

- **Fixed time, variable scope** — the scaffold ships incrementally; a sprint that
  misses its scope goal feels like failure. Shape Up treats scope as the lever.
- **No estimation debt** — pitches contain appetite (time box), not story-point
  estimates. One number, not two.
- **Cooldown pays debt** — mandatory cooldown after each phase prevents the
  accumulation of known-bad code that Scrum often lets slide.

Decision recorded in [ADR 0001](/docs/decisions/0001-shape-up-over-scrum/).

Full rationale → [`docs/PRINCIPLES.md §1`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/PRINCIPLES.md#1-way-of-working--shape-up--inceptor)
