# 0003 — Centinela verdict tokens for orchestrator routing

> **Numbering note (June 2026 audit §4.5):** two distinct decisions share the
> number 0003 — this one and the superseded Starlight ADR — because the
> Starlight record was written and superseded within the same cycle and the
> number was reused by mistake. Both slugs are kept for URL stability; new
> ADRs continue from 0007.

## Status

Accepted

Date: 2026-06-01

## Context

`centinela` validates `forja`'s work (build, type-check, tests, forbidden-import
scan) and returns APPROVED or REJECTED. The orchestrating Claude Code session reads
that verdict and decides what to do next: re-dispatch `forja`, escalate to a
human, or stop because the failure is outside the repo's control.

Prior rejections were free-text prose. The orchestrator had to infer intent
from natural language — "tests fail", "this needs a design decision", "upstream
package is broken" all looked the same to a string match. Routing was ambiguous
and occasionally wrong: a `forja`-fixable lint error got escalated to a human,
while a genuinely blocked upstream dependency got retried in a loop.

The question: how does `centinela` communicate *why* it rejected in a way the
orchestrator can route on deterministically, without coupling the two agents'
prompts?

## Decision

On REJECTED, `centinela` appends a trailing fenced JSON block as the last thing
in its output. The block carries a `verdict_token` and a `failure_class`:

````text
```json
{
  "verdict": "REJECTED",
  "verdict_token": "RETRY_FORJA",
  "failure_class": "type-error"
}
```
````

`verdict_token` is one of three routing signals:

| Token | Orchestrator action |
|---|---|
| `RETRY_FORJA` | Re-dispatch `forja` with the failure detail — mechanically fixable (type error, failing test, lint, forbidden import) |
| `NEEDS_HUMAN` | Stop and surface to the operator — a design/spec decision the agent loop can't make |
| `BLOCKED_UPSTREAM` | Stop and record — failure is outside the repo (broken peer dep, upstream API down, registry outage) |

`failure_class` is a free-form-but-conventional short tag (e.g. `type-error`,
`test-fail`, `forbidden-import`, `spec-ambiguous`, `peer-dep-conflict`) for
logs and the lessons-learned trigger.

The block is **trailing and fenced** so the human-readable rejection prose stays
intact above it; the orchestrator parses the last fenced `json` block rather
than the whole message. APPROVED verdicts need no token.

Rejected alternatives:

- **Structured-only output (drop the prose)** — loses the human-readable
  rejection that operators rely on during a run.
- **Exit codes / a side-channel file** — agents communicate via transcript text,
  not process state; a file would not survive the sub-agent boundary cleanly.
- **A new label/field convention in the PR** — too slow; routing must happen
  inside the orchestration loop before any PR exists.

## Consequences

**Positive** — orchestrator routing is deterministic: parse the last fenced JSON
block, switch on `verdict_token`. Retry loops stop chasing `BLOCKED_UPSTREAM`
failures. The `failure_class` tag feeds the "centinela rejects the same issue
twice" lessons-learned trigger (ADR [0001](./0001-shape-up-over-scrum.md)).

**Negative** — `centinela` and the orchestrator now share a small contract (the
three token values); changing it means touching both. The token vocabulary is
deliberately tiny to keep that coupling cheap.

**Neutral** — the JSON block is implemented in the agent contract under
`.claude/agents/`; this ADR records the rationale rather than the schema, which
can evolve as long as the three routing tokens stay stable.

## Supersedes

None.

## References

- [`ROADMAP.md`](../../ROADMAP.md) Epic 14 — Centinela verdict tokens
- ADR [0001](./0001-shape-up-over-scrum.md) — lessons-learned rejection trigger
- `.claude/agents/centinela` — agent contract implementing the block (#63)
