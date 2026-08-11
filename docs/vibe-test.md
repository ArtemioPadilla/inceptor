# The vibe-test harness

ROADMAP Epic 26's stretch item. Astryx runs exactly this against its own
docs; Inceptor's entire workflow — `forja` building UI from
`docs/component-guidelines/` and `mcp-server/`'s `get_component` tool rather
than reading component source directly — depends on the same property
holding. Nothing measured that property until this harness existed.

## What it validates, and why

Every component guideline in `docs/component-guidelines/` is a bet: that
*Purpose / When to use / API overview / Common mistakes*, written **without**
the component's real source in front of the reader, is enough for a coding
agent to build correct, compiling usage code. If that bet is wrong for a
given component, the guideline doc is actively misleading `forja` (and any
other agent reading it) — worse than no doc at all.

The harness tests the bet directly:

1. Spawn a fresh model call.
2. Give it **only** one component's guideline section — the same markdown
   text a human or agent would read from `docs/component-guidelines/*.md`
   or get back from `mcp-server`'s `list_components`/`get_component` tools
   — never the component's real `.tsx` source.
3. Ask it to build a minimal, working usage example from the doc alone.
4. **Score it for real**: write the generated code to a throwaway file and
   type-check it against the actual project `tsconfig.json` (inherited
   `"@/*"` alias, strict mode, the real `jsx` settings) and the actual
   component source it imports from. Not a heuristic, not a second LLM
   grading the first — the real TypeScript compiler.
5. Report pass/fail with the real `tsc` diagnostics, and the code the model
   generated, so a failure is immediately actionable ("the doc doesn't
   mention X, the model guessed Y, that doesn't exist").

## Running it manually today

```bash
# One random component (the default — cheap enough to run often without
# thinking about it):
npm run vibe-test

# A specific component, by slug (see --list for the exact spelling):
npm run vibe-test -- --component dialog

# Every documented component in one run (costs one API call per component —
# 21 as of this writing; see docs/component-guidelines/README.md's coverage
# table for the current count):
npm run vibe-test -- --all

# List every available slug without calling the API:
npm run vibe-test -- --list
```

Requires `ANTHROPIC_API_KEY` in the environment — the same variable name
`.github/workflows/claude.yml` already reads from `secrets.ANTHROPIC_API_KEY`
for AI issue triage. If it's unset, the script prints a clear message and
exits non-zero; it never silently no-ops or calls the API with an empty key.

Sample output for a passing run:

```text
[PASS] Button  (primitives/button)

1/1 passed.
```

Sample output for a failing run (the diagnostics + generated code make the
doc gap obvious without re-running anything):

```text
[FAIL] Dialog  (compound/compound.md)
  What the model got wrong (real tsc diagnostics):
    .vibe-test-tmp/dialog-a1b2c3d4/dialog.gen.tsx(6,20): error TS2322: Property 'asChild' does not exist on type ...
  --- generated code ---
    import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
    ...
```

## Architecture (for anyone extending this)

- `scripts/vibe-test/guideline-index.ts` — parses
  `docs/component-guidelines/*.md` into per-component sections (pure
  `extractGuidelineSections()`, plus an I/O wrapper `loadGuidelineIndex()`).
- `scripts/vibe-test/prompt.ts` — builds the doc-only prompt; extracts
  generated code back out of the model's fenced markdown response.
- `scripts/vibe-test/score.ts` — the real `tsc` invocation. Writes the
  generated file into a throwaway `.vibe-test-tmp/<slug>-<id>/` directory
  with its own `tsconfig.json` (`extends` the root config, `include` scoped
  to just that one file) so it inherits real path aliases and strict mode
  without re-checking the whole project. Always cleans up after itself.
- `scripts/vibe-test/run.ts` — orchestrates prompt → `generate()` → extract
  → score. `generate` is an **injected function**, not a direct SDK import —
  this is what lets `src/tests/vibe-test.test.ts` exercise the full pipeline
  with hardcoded known-good/known-bad code fixtures and zero network calls,
  so the harness's own logic stays covered by `npm run check` without
  needing (or spending) a real `ANTHROPIC_API_KEY` in CI.
- `scripts/vibe-test/anthropic-client.ts` — the one file that actually calls
  `@anthropic-ai/sdk`. Not imported from `src/`, not covered by
  `npm run check`; verified manually (see the commit history for this file).
- `scripts/vibe-test.ts` — the CLI entrypoint (`npm run vibe-test`).

## Turning this into a real nightly cron — a human decision, not automated here

This harness is deliberately **not** wired into a scheduled GitHub Actions
workflow. Running it nightly means spending real Anthropic API credits on an
unattended, recurring schedule — that's a cost commitment a human should
explicitly opt into, not something a coding agent enables silently while
building the scaffolding. If you (a maintainer) decide to activate it:

1. Add a new workflow file, e.g. `.github/workflows/vibe-test.yml`, modeled
   on `.github/workflows/claude.yml`'s existing secret-usage pattern:
   - `on: schedule: - cron: '<your schedule>'` (plus `workflow_dispatch:` so
     it can also be run on demand from the Actions tab).
   - `permissions:` — this workflow needs less than `claude.yml`: no
     `issues:`/`pull-requests:` write access is required to just run the
     harness and report results. Start from `contents: read` only and add
     the minimum needed for whatever you choose for step 3 below.
   - Pass the key the same way: `env: ANTHROPIC_API_KEY:
     ${{ secrets.ANTHROPIC_API_KEY }}` (the secret already exists in this
     repo for `claude.yml`; no new secret to provision).
   - Run `npm ci` then `npm run vibe-test -- --all` (or a curated subset, if
     running all 21+ components nightly is more spend than you want).
2. Decide how failures surface — options in increasing order of
   intrusiveness: (a) just let the Actions run go red and check it
   occasionally, (b) upload the report as a workflow artifact, (c) open (or
   comment on) a tracking issue when a component that previously passed
   starts failing (regression signal — a doc or a component API drifted out
   of sync), (d) post to a Slack/Discord webhook. Start with (a) or (b); add
   (c) once the false-positive rate from real model non-determinism is
   understood (the same doc can produce a passing example on one run and a
   flaky one on the next — that's information too, but needs a few real
   runs of history before treating a single failure as signal).
3. Consider capping cost further: run against a random sample (e.g. 3–5
   components per night, cycling through the full set over a week) instead
   of `--all` every night, or gate the schedule behind a lower frequency
   (weekly) until the false-positive rate above is characterized.
4. This file (`docs/vibe-test.md`) and `CLAUDE.md`'s workflow section should
   both get a one-line update once the cron exists, so the next reader knows
   it's live and where its results show up.

None of the above is implemented — this section is the runbook for the
human who decides to do it, same pattern as the other "needs external
action" items in `ROADMAP.md`'s "Still genuinely deferred" section.
