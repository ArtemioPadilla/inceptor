---
title: The orchestration workflow
description: How the main Claude Code session drives the Inceptor sub-agents.
---

There is no special command to start an Inceptor run. The main Claude Code
session is the orchestrator: you point it at an issue in a normal conversation,
and it dispatches the three project sub-agents to plan, implement, and validate
the work.

## The loop

1. **prometeo** reads the issue (and `INTEGRATION-PLAN.md` / `ROADMAP.md`) and
   returns an ordered, dependency-aware plan. You approve it.
2. **forja** implements one issue on a feature branch with atomic commits.
3. **centinela** validates the build, types, tests, ethics checklist, and
   forbidden-import scan, then returns APPROVED or REJECTED.
4. On REJECTED, centinela emits a routing token (`RETRY_FORJA`, `NEEDS_HUMAN`,
   or `BLOCKED_UPSTREAM`) that the session uses to re-dispatch forja, escalate to
   you, or stop. On APPROVED, it pushes the branch and opens a PR that closes the
   issue.

A typical kickoff is just a request, for example: "Land issue #N — PR open
against `main`, centinela APPROVED, branch named per the plan."

## See also

- [The 60-second tour](/docs/start-here/inceptor-tour/) — the same loop, walked
  end to end
- [Sub-agents](/docs/how-we-work/sub-agents/) — prometeo, forja, centinela
- [`CLAUDE.md` § Workflow](https://github.com/ArtemioPadilla/inceptor/blob/main/CLAUDE.md)
  — the canonical, in-repo reference
