---
title: Sub-agents — prometeo, forja, centinela
description: The three agents that execute the Inceptor loop.
---

Three Claude Code sub-agents under `.claude/agents/` execute the Inceptor
development loop. The main Claude Code session is the orchestrator — it dispatches
agents via the Task tool and reads their output to drive the next step.

## The three agents

### prometeo — planner

Reads `INTEGRATION-PLAN.md` and decomposes a phase, milestone, or issue into an
ordered, dependency-aware execution plan.

- **Does:** read the plan, check GitHub issue state, build a dependency graph,
  produce a typed execution plan with risk ratings
- **Does not:** write code, run `npm`/`npx`, or modify files
- **Invoked when:** the orchestrator receives a phase/milestone/issue to work

### forja — implementer

Implements a single issue: writes code, runs `npx` commands, makes atomic commits
on a feature branch.

- **Does:** create/modify files per acceptance criteria, run `npx shadcn add` /
  `npx astro add`, commit with Conventional Commits + issue ref
- **Does not:** validate work (centinela's job), open PRs (orchestrator's job)
- **Invoked when:** prometeo's plan is approved for a specific issue

### centinela — validator

Validates forja's work and returns APPROVED or REJECTED with a routing token.

- **Does:** run `npm run build`, `npm run check`, `npm run test`, forbidden-import
  scan, ethics checklist check
- **Returns:** `APPROVED` | `REJECTED` + one of `RETRY_FORJA`, `NEEDS_HUMAN`,
  `BLOCKED_UPSTREAM`
- **Invoked when:** forja finishes a commit sequence

## The loop

```
orchestrator
  → prometeo (plan)     → you approve
  → forja (implement)   → commits on branch
  → centinela (verify)  → APPROVED / REJECTED
  → (on APPROVED) push branch, open PR, close issue
  → repeat for next issue
```

On REJECTED, the routing token drives what happens next:

| Token | Meaning | Next step |
|---|---|---|
| `RETRY_FORJA` | Fixable code issue | Re-dispatch forja with centinela's diff |
| `NEEDS_HUMAN` | Ambiguous / outside spec | Escalate to human |
| `BLOCKED_UPSTREAM` | Dependency unresolved | Stop; fix the upstream issue first |

## Agent spec files

- [prometeo](https://github.com/ArtemioPadilla/inceptor/blob/main/.claude/agents/prometeo.md)
- [forja](https://github.com/ArtemioPadilla/inceptor/blob/main/.claude/agents/forja.md)
- [centinela](https://github.com/ArtemioPadilla/inceptor/blob/main/.claude/agents/centinela.md)

Also see the [Inceptor overview](/docs/how-we-work/inceptor/) for the complete
loop description with usage examples.
