# commit-with-retry composite action

A reusable composite action for bot committers that write to `main`.

Solves the data-loss and race conditions found in Watchboard (#166):
six workflows raced to push bare `git push` calls; silent failures and a
rebase freeze let a state file grow to 7.2 MB / 9,400 entries over 19 days.

---

## What it does

1. Stages the paths you specify (`git add <paths>`).
2. Commits with your message (no-op if nothing staged — returns empty `sha`).
3. Enters a retry loop (default: 5 attempts):
   - `git pull --rebase origin main` to incorporate concurrent commits.
   - `git push origin HEAD:main`.
   - On failure: waits 2-10 s with random jitter, then retries.
   - On rebase conflict: `git rebase --abort`, then retries.
4. On exhaustion: exits 1 with an `::error::` annotation. The local commit
   is preserved — data is never silently lost.

---

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `paths` | yes | — | Space-separated paths/globs to stage (`git add`) |
| `message` | yes | — | Commit message (Conventional Commits format recommended) |
| `attempts` | no | `5` | Max push attempts before `exit 1` |
| `git_user_name` | no | `github-actions[bot]` | Git author name |
| `git_user_email` | no | `41898282+github-actions[bot]@users.noreply.github.com` | Git author email |

## Outputs

| Output | Description |
|---|---|
| `sha` | SHA of the pushed commit; empty string if nothing was committed |

---

## Basic usage

```yaml
- uses: actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10 # v6
  with:
    token: ${{ secrets.GITHUB_TOKEN }}

- name: Generate state file
  run: node scripts/update-state.mjs

- uses: ./.github/actions/commit-with-retry
  with:
    paths: 'data/state.json'
    message: 'chore(data): update state [skip ci]'
    attempts: '5'
```

---

## Concurrency pattern

Bot committers should declare a `concurrency` group so multiple workflows
writing to main are serialized without cancelling each other.

### Choosing the right group

There are two common patterns. Pick based on the job's runtime:

**Pattern A — short state-commit jobs (< 2 min)**

All short bot committers share one group so they queue instead of race.
`cancel-in-progress: false` ensures no commit is dropped.

```yaml
# workflow that writes a small state file
concurrency:
  group: main-commits
  cancel-in-progress: false

jobs:
  update-state:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@... # v6
      - run: node scripts/update-state.mjs
      - uses: ./.github/actions/commit-with-retry
        with:
          paths: 'data/state.json'
          message: 'chore(data): update state'
```

**Pattern B — long-running pipelines (> 5 min)**

Use a self-group so a long job never serializes behind a 30-second one.
`cancel-in-progress: true` is safe here because the pipeline is idempotent.

```yaml
# long build/generate pipeline
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@... # v6
      - run: npm run docs:build
      - uses: ./.github/actions/commit-with-retry
        with:
          paths: 'docs/generated/**'
          message: 'docs(generated): rebuild (${{ github.sha }})'
```

**Wrong pattern — do not do this:**

```yaml
# BAD: putting a 30-second state-commit job in the same group as a
# 20-minute pipeline means every pipeline run queues ALL short jobs.
concurrency:
  group: main-commits       # shared with short jobs
  cancel-in-progress: false # so the 20-min job never cancels

# This guarantees a 20-min wait for every state write after a pipeline runs.
```

---

## Why random jitter?

Without jitter, two workflows that fail simultaneously will retry at the same
time and keep colliding. The `RANDOM % 9 + 2` sleep (2-10 s) spreads retries
across a 8-second window, reducing collision probability to near zero within
2-3 attempts even with 4-5 concurrent bots.

---

## Why `exit 1` on exhaustion instead of `echo "non-fatal"`?

Watchboard had a `git push || echo "non-fatal"` that swallowed failures.
A rebase race froze state-file pruning for 19 days. This action treats
push failures as real failures so your pipeline is aware and human review
can happen. The local commit is always preserved — you can recover manually
if needed.

---

## References

- Issue #166 — Infra: commit-with-retry composite action
- `.github/workflows/ci.yml` — uses this action as the in-repo reference
- `docs/SETUP.md` — "Bot commits without losing data"
