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

| Guardrail                                                                                              | Where                   |
| ------------------------------------------------------------------------------------------------------ | ----------------------- |
| One CI run per commit: push triggers only on `main`; PRs run via `pull_request`                        | `ci.yml`                |
| Superseded PR runs are cancelled (`concurrency`, never in progress on `main`)                          | `ci.yml`                |
| Draft PRs fail fast (no tests run, about 5 billed min per push); `ready_for_review` starts the full CI | `ci.yml`, `changes` job |
| Docs-only diffs skip the heavy steps (short allowlist in `scripts/ci-changes.mjs`)                     | `changes` job           |
| Playwright visual runs on dispatch and weekly, not on every PR                                         | `visual.yml`            |
| Tauri builds: dispatch only (Android also on version tags)                                             | `tauri-*.yml`           |
| Deploys are never cancelled mid-upload (a newer run replaces one still pending)                        | `deploy.yml`            |
| Daily budget breaker                                                                                   | `scripts/ci-budget.mjs` |

### Required checks stay correct

- A job skipped by its own `if` reports **success** and satisfies a required
  check. So no required job has a job-level skip condition (in `ci.yml`): every
  required job always runs and reports, and only its _steps_ are gated (the
  non-required `changes` job does have an `if`).
- The gate is fail-safe: heavy steps run when
  `needs.changes.outputs.heavy != 'false'` (so also when `changes` fails or is
  unknown), never `== 'true'`.
- Heavy steps use `success() && ...`, not `!cancelled() && ...`, so they stop
  after the breaker step fails.
- **A draft must not leave a green required check.** Marking a draft ready
  does not change the commit SHA, and a new run's jobs (which `need: changes`)
  only appear once `changes` finishes. If the draft run had passed, that stale
  green would sit on the SHA and `gh pr ready N && gh pr merge N` (or
  auto-merge) could merge with no tests run. So on a draft every required job
  _fails_ at a step ("Draft: full CI has not run; mark ready"). A red draft
  check is the honest state.
- After `ready_for_review`, **wait for the new run** before merging. If the
  event was sent with `GITHUB_TOKEN` (or a fork run waits for approval) GitHub
  creates no run at all: the red draft check stays, which is safe. To get a
  real run, push a new commit, or close and reopen the PR (`reopened` carries
  draft=false). Re-running the draft run will fail again: a re-run keeps the
  original event payload, so it still says draft.
- The `changes` job runs on `pull_request` only. On push to `main` it is
  skipped (no billed minute); dependents use `!cancelled()` and an empty
  output counts as heavy.
- The `DOCS_ONLY` allowlist holds only files nothing reads (not tests, not
  `scripts/init.mjs`); a unit test enforces it. The diff uses `--no-renames`
  so a file moved into an allowlisted folder still counts at its old path.
- Add the job names you require (`Build & Check`, ...) in branch protection;
  they will always report.

## 3. The daily budget breaker

`scripts/ci-budget.mjs` is the first step (after checkout) of every job in
`ci.yml`. It makes one REST call (`GET /actions/runs?event=pull_request`,
`total_count` of PR runs created in the last 24h) using only `GITHUB_TOKEN`
with `actions: read`. Only PR-event runs count: pushes and `issue_comment` runs do not.
**Dependabot PRs are counted**: they are `pull_request` runs like any other, and
each Dependabot rebase starts a new one. We keep the single call rather than
subtracting `actor=dependabot[bot]` with a second call (that doubles the API
calls in every job and adds failure surface to a breaker that must stay
simple), so **set the limit with headroom for Dependabot** (its open-PR cap in
`dependabot.yml` times a few rebases a week is a small, predictable share).

- Over the limit: `::error::` and **exit 1**, so the required check goes red.
  It fails rather than skips because a skipped job satisfies a required check.
- Limit: repository variable `CI_DAILY_RUN_LIMIT` (default `50` PR runs per
  rolling 24h). It counts runs, not minutes. Calibrate it:
  `limit ~ monthly budget minutes / 30 / average billed minutes per PR run`.
  Example: 3,000 min / 30 / 6 min is about 16 runs a day; 50 is a deliberately
  loose ceiling that still stops an incident (the 2026-11 one ran about 1,280
  minutes a day). Lower it once you know your real average. Cancelled runs
  still count, so cancelling does not buy headroom. Re-runs are not counted
  ("Re-run failed jobs" and `gh run rerun` add attempts to an existing run
  and `total_count` does not move), so a re-run sweep spends minutes without
  moving the breaker; `AGENTS.md` rule 7 and the hook cover them.
- It fails open: any API/parse error only emits a `::warning::` and passes.
- Label `ci:override` on the PR bypasses it (one extra call, looked up only
  when over the limit; needs `pull-requests: read`). Humans only: `AGENTS.md`
  forbids agents from adding it.
- It applies to `pull_request` only. It never runs for pushes to `main`
  (merges must still deploy), schedules or dispatches.

If you trip it: stop pushing, wait for the 24h window to roll, or have a
maintainer apply `ci:override` for one urgent PR. `labeled` is not a trigger,
so after applying the label the maintainer must **re-run the failed jobs**.

## 4. Optional: Claude Code PreToolUse hook

`.claude/hooks/ci-push-guard.mjs` asks the human for confirmation once more
than N CI-triggering Bash commands ran today in the checkout (default 5,
`CI_GUARD_LIMIT`). It answers `ask`, never blocks, and fails open. The command
is split on `&&`, `||`, `;`, `&`, `|`, `(` and newlines, and a segment counts
only if it STARTS with one of these (a commit message that mentions "git push"
does not count):

- `git push`, also with `-C dir` / `-c k=v` options, and after leading
  `VAR=val` assignments or `env [VAR=val]`; `--dry-run` and `-n` are not counted.
- `gh pr create|merge|ready|update-branch|reopen`.
- `gh workflow run` and `gh run rerun`.
- `gh api` calls that WRITE (an explicit `-X/--method POST|PUT|PATCH|DELETE`,
  or a body flag `-f/-F/--field/--raw-field/--input`) on the pulls,
  merge/update-branch, auto-merge/ready, workflow dispatch or run rerun routes,
  plus the `enablePullRequestAutoMerge` and `markPullRequestReadyForReview`
  GraphQL mutations. An explicit `-X GET` is a read even with body flags.
  Plain reads are never counted.

It is **opt-in** on purpose: a committed `.claude/settings.json` would prompt
every contributor and every unattended agent run (where a prompt can stall a
pipeline), and teams differ on the right N. To enable it:

```bash
cp .claude/settings.example.json .claude/settings.json   # or merge the "hooks" block into your own
```

The command uses `$CLAUDE_PROJECT_DIR`, so it keeps working after the agent
`cd`s into a subfolder, and the daily count is keyed by that directory.

## 5. Tuning checklist for a new project

- [ ] Budget with "stop usage" and alerts (section 1)
- [ ] `CI_DAILY_RUN_LIMIT` repository variable (see the calibration formula in section 3)
- [ ] Required checks set in branch protection (name the `ci.yml` jobs your project has: Build & Check, Lint workflows (actionlint), plus the server test jobs if you have a backend; never the Changes gate; each fails on drafts)
- [ ] Review the `DOCS_ONLY` allowlist in `scripts/ci-changes.mjs`
- [ ] Decide whether to enable the hook (section 4)
