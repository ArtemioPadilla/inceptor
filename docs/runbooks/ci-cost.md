# Runbook: CI cost guardrails

GitHub Actions minutes are free on public repos but billed on private ones
(`GitHub Pro` includes 3,000 min/month). Coding agents can burn that in days
by pushing often. This template ships layered guardrails; the first one is
the only one that is actually a hard cap.

## 1. Set a spending limit (the hard cap, do this first)

In GitHub: **Settings (account or organization) > Billing and licensing >
Budgets and alerts**. Create a budget for **Actions**, set a monthly amount
(use `0` to stay inside the included minutes), enable **stop usage when the
budget is exceeded**, and add alert thresholds (for example 50% and 90%).

Without "stop usage", GitHub keeps billing past your included minutes.
Everything below only reduces the rate of spending; it cannot stop it.

## 2. What the template does by itself

| Guardrail                                                                          | Where                   |
| ---------------------------------------------------------------------------------- | ----------------------- |
| One CI run per commit: push triggers only on `main`; PRs run via `pull_request`    | `ci.yml`                |
| Superseded PR runs are cancelled (`concurrency`, never on `main`)                  | `ci.yml`                |
| Draft PRs run only the cheap parts; `ready_for_review` starts the full CI          | `ci.yml`, `changes` job |
| Docs-only diffs skip the heavy steps (short allowlist in `scripts/ci-changes.mjs`) | `changes` job           |
| Playwright visual runs on dispatch and weekly, not on every PR                     | `visual.yml`            |
| Tauri builds: dispatch only (Android also on version tags)                         | `tauri-*.yml`           |
| Deploys are never cancelled mid-upload                                             | `deploy.yml`            |
| Daily budget breaker                                                               | `scripts/ci-budget.mjs` |

### Required checks stay correct

- A job skipped by its own `if` reports **success** and satisfies a required
  check. So no job in `ci.yml` has a job-level skip condition: every job
  always runs and reports, and only its _steps_ are gated.
- The gate is fail-safe: heavy steps run when
  `needs.changes.outputs.heavy != 'false'` (so also when `changes` fails or is
  unknown), never `== 'true'`.
- Heavy steps use `success() && ...`, not `!cancelled() && ...`, so they stop
  after the breaker step fails.
- Draft PRs cannot be merged, so cheap checks on drafts do not weaken the
  gate. Marking ready (`ready_for_review`) runs the full CI; the newest check
  run of a given name on a commit is the one branch protection counts.
- Add the job names you require (`Build & Check`, ...) in branch protection;
  they will always report.

## 3. The daily budget breaker

`scripts/ci-budget.mjs` is the first step (after checkout) of every job in
`ci.yml`. It makes one REST call (`GET /actions/runs`, `total_count` of runs
created in the last 24h) using only `GITHUB_TOKEN` with `actions: read`.

- Over the limit: `::error::` and **exit 1**, so the required check goes red.
  It fails rather than skips because a skipped job satisfies a required check.
- Limit: repository variable `CI_DAILY_RUN_LIMIT` (default `200` workflow
  runs per rolling 24h). It counts runs, not minutes: tune it to your plan.
- It fails open: any API/parse error only emits a `::warning::` and passes.
- Label `ci:override` on the PR bypasses it (one extra call, looked up only
  when over the limit; needs `pull-requests: read`). Humans only: `AGENTS.md`
  forbids agents from adding it.
- It applies to `pull_request` only. It never runs for pushes to `main`
  (merges must still deploy), schedules or dispatches.

If you trip it: stop pushing, wait for the 24h window to roll, or have a
maintainer apply `ci:override` for one urgent PR.

## 4. Optional: Claude Code PreToolUse hook

`.claude/hooks/ci-push-guard.mjs` asks the human for confirmation once more
than N CI-triggering Bash commands (`git push`, `gh pr merge|ready`,
`gh workflow run`, `gh run rerun`) ran today in the checkout (default 5,
`CI_GUARD_LIMIT`). It answers `ask`, never blocks, and fails open.

It is **opt-in** on purpose: a committed `.claude/settings.json` would prompt
every contributor and every unattended agent run (where a prompt can stall a
pipeline), and teams differ on the right N. To enable it:

```bash
cp .claude/settings.example.json .claude/settings.json   # or merge the "hooks" block into your own
```

## 5. Tuning checklist for a new project

- [ ] Budget with "stop usage" and alerts (section 1)
- [ ] `CI_DAILY_RUN_LIMIT` repository variable if 200 is wrong for you
- [ ] Required checks set in branch protection
- [ ] Review the `DOCS_ONLY` allowlist in `scripts/ci-changes.mjs`
- [ ] Decide whether to enable the hook (section 4)
