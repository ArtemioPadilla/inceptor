---
description: Execute a phase, milestone, or specific issue from INTEGRATION-PLAN.md
argument-hint: "<Fase N | vX.Y | #N | free-form description>"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Task
model: claude-opus-4-7
---

# /goal — orchestrate integration-plan execution

The user invoked:

```text
/goal $ARGUMENTS
```

You are the **orchestrator** for the issue-driven integration of this Astro+React
UI template. Your job is to translate the goal into a sequence of issues, plan
them with `prometeo`, build them with `forja`, validate them with `centinela`,
and open one PR per issue.

## Pre-flight (always)

1. Read `@CLAUDE.md` for repo conventions, stack, and critical warnings.
2. Read `@INTEGRATION-PLAN.md` for the canonical issue list.
3. Confirm the working tree is clean:
   ```bash
   !`git status --short`
   ```
   If anything is uncommitted, stop and ask the user whether to stash or commit
   before proceeding.

## Step 1 — Resolve the goal

Parse `$ARGUMENTS` into one of the following scopes:

| Input pattern | Scope |
|---|---|
| `Fase N` or `Phase N` (N = 0..7) | All issues in that phase |
| `vX.Y` (e.g. `v0.3`) | All issues in that milestone |
| `#N` (e.g. `#5`) | A single issue by number |
| Free-form text | Search INTEGRATION-PLAN.md for matching issue(s); if ambiguous, ask user to pick |

Confirm the resolved scope to the user **before** doing anything else.

## Step 2 — Delegate planning to `prometeo`

Use the **Task** tool to invoke the `prometeo` sub-agent with:
- The resolved list of issues
- The current state of those issues on GitHub (`gh issue list --milestone "<name>"`
  or `gh issue view N`)
- A request for an ordered execution plan with dependency analysis

`prometeo` returns a structured plan. Do not move on until you receive it.

## Step 3 — Confirm with the user

Present prometeo's plan as a numbered checklist. Ask:

> This is the plan for **$ARGUMENTS**. Proceed?
> - `yes` — execute all issues in order
> - `modify` — tell me which issues to skip or reorder
> - `dry-run` — show exact commands per issue without executing
> - `abort` — stop here

Wait for input. If `modify`, incorporate the changes and re-present.

## Step 4 — Execute issue by issue

For each issue in the approved plan:

1. **Branch**
   ```bash
   git checkout main
   git pull --ff-only
   git checkout -b phase-N/issue-NNN-slug   # use the branch from the plan
   ```

2. **Build** — invoke the `forja` sub-agent via Task with:
   - Issue number
   - Issue title
   - Branch name
   - Acceptance criteria (from INTEGRATION-PLAN.md)
   - Any dependencies already completed

   `forja` modifies files and makes commits. It does NOT validate.

3. **Validate** — invoke the `centinela` sub-agent via Task with:
   - Issue number
   - Forja's report (files changed, commits made)

   `centinela` runs build/type-check/test/a11y. It returns APPROVED or REJECTED.

4. **On APPROVED**:
   ```bash
   git push -u origin <branch>
   gh pr create \
     --title "<exact issue title>" \
     --body "Closes #N

   <forja summary>

   <centinela validation results>" \
     --label "<same labels as issue>" \
     --milestone "<same milestone as issue>"
   ```
   Report the PR URL to the user and continue to the next issue.

5. **On REJECTED**:
   - Show the user centinela's failure report.
   - Ask: `retry` (re-invoke forja with the diagnosis) / `skip` (move to next issue) / `abort` (stop everything).
   - If `retry`, pass centinela's "Suggested fix" hint to forja.

## Step 5 — Summary

When all issues are processed (or user aborts), report:

```text
## /goal summary — $ARGUMENTS
- ✅ Merged or PR-ready: #N, #M, ...
- ⏭️  Skipped: #X (reason)
- ❌ Failed: #Y (reason)

Next suggested goal: /goal <next-phase>
```

## Hard rules

- **Never push to `main`.** Every change goes through a feature branch + PR.
- **Never close issues.** Closing happens automatically when the PR with
  `Closes #N` is merged.
- **Never bypass `centinela`.** If validation fails, the PR is not opened.
- **Stop immediately on `abort`.** Leave the working tree clean
  (`git stash` or `git reset --hard HEAD` as appropriate; ask the user which).
- **Always `git status` before checking out a new branch.** If dirty, refuse and ask.
- **Respect the warnings in CLAUDE.md.** If forja proposes anything that
  violates them, reject and ask forja to rework.

## Common goal patterns

| User typed | What you do |
|---|---|
| `/goal Fase 0` | Plan + execute issues #001, #002, #003 in order |
| `/goal v0.3` | Plan + execute issues #004–#008 |
| `/goal #11` | Execute just issue #11 (and confirm its deps are done) |
| `/goal "add dark mode"` | Search plan → matches #005 → confirm with user → execute |
| `/goal dry-run Fase 1` | Show the plan and exact commands; do not execute |
