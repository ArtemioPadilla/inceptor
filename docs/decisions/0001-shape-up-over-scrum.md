# 0001 — Shape Up over Scrum for solo + AI development

## Status

Accepted

Date: 2026-05-28

## Context

This scaffold's primary developer is one person, sometimes working with Claude
Code sub-agents (`prometeo`, `forja`, `centinela`). The Inceptor workflow already in
place — issue → PR → merge, orchestrated by the main Claude Code session — needs a cadence
framework on top of it.

Scrum requires team ceremonies (standups, sprint reviews, retros with peers)
that don't function with N=1. Shape Up (Basecamp, 2019) was designed for small
teams running fixed-time-variable-scope cycles. Its primitives translate
cleanly to solo + AI work.

Alternatives considered:

- **Scrum-lite** (no standups, but keep sprints + retros) — still ceremony for
  one person; sprints encourage fixed-scope which fights well with AI-assisted
  velocity variance
- **Kanban** — no cadence at all; loses the "appetite" discipline that prevents
  scope creep
- **Ad-hoc** — what we'd been doing; degraded into the 17-item deferred backlog
  the integration shipped with

## Decision

Use Shape Up's cadence primitives:

| Shape Up | This repo |
|---|---|
| Pitch | A written issue spec — `INTEGRATION-PLAN.md` entries or `.github/ISSUE_TEMPLATE/` forms |
| Appetite | Phase or milestone (fixed time, variable scope) |
| Betting table | Monday ritual — pick the next pitch, hand the scope to Claude Code |
| Cycle | The phase duration |
| Cooldown | 2-day gap after each phase for docs, refactors, dep bumps, debt |

Agile Manifesto values stay as taste guiding choices, not ceremonies on a
calendar.

Standups, sprint reviews, sprint retros are dropped. Lessons-learned go to
`docs/lessons.md` **only when centinela rejects the same issue twice in a row**
— specific trigger, low overhead.

Full framework: [`docs/PRINCIPLES.md`](../PRINCIPLES.md) §1.

## Consequences

**Positive**:

- Zero ceremony overhead for solo work
- Pitches force explicit appetite + boundaries up front (better than open-ended
  sprints)
- Cooldown gives explicit space for non-feature work (the 17 deferred items
  from prior phases live there)
- Cleanly maps onto the sub-agent roles already in place

**Negative**:

- "Betting table" with one person is a self-discipline ritual, easily skipped
- No retro cadence means lessons can be forgotten — mitigated by the
  rejection-trigger rule, but not perfectly

**Neutral**:

- Sub-agents (prometeo / forja / centinela) absorb roles that would otherwise
  be PO / dev / QA — Shape Up doesn't prescribe these roles, so the mapping is
  clean and unforced

## Supersedes

None — first methodology ADR.

## References

- Singer, R. (2019). [Shape Up: Stop Running in Circles and Ship Work that
  Matters.](https://basecamp.com/shapeup) Basecamp.
- Beck, K. et al. (2001). [Manifesto for Agile Software Development.](https://agilemanifesto.org/)
- Schwaber, K. & Sutherland, J. (2020). [The Scrum Guide.](https://scrumguides.org/)
