# AGENTS.md

Instructions for any coding agent working in this repository (Claude Code,
Codex, Cursor, Copilot, Gemini, ...). Tool-specific context lives in
`CLAUDE.md`; this file holds the rules that apply whatever agent you are.

## CI budget

GitHub Actions minutes cost real money on private repositories. A project
generated from this template once burned more than twice its monthly included
minutes in five days: agents pushed constantly to many PRs and every push ran
the full CI. Treat CI minutes as a budget you spend, not a free oracle.

1. **Validate locally before pushing.** Run `npm run format`, `npm run check`
   (and `npm run test`) on your machine first. CI confirms; it does not
   discover.
2. **Push once per ready PR.** Iterate in a **draft** PR: drafts run no checks
   (each required job fails on purpose after the budget breaker, so a draft
   cannot be merged by accident). Mark it ready for review when it is done, which starts
   the full CI once. After marking ready, **wait for the new run** to finish
   green before merging; never `gh pr ready && gh pr merge` in one go.
3. **Do not "update branch with main"** (the button, `git merge main`, rebase
   plus force-push) unless there is a real conflict. Every update re-runs CI.
4. **No parallel mass sweeps** over many PRs (rebasing, re-running, relabelling,
   dispatching workflows across a list of PRs).
5. **Estimate and ask the human first** before any action that would trigger
   more than about 10 CI runs (a batch of pushes, re-runs, dispatches or
   merges). Say the number you expect.
6. **Never add the `ci:override` label.** It bypasses the daily budget
   breaker and is for a human maintainer to apply, knowingly.
7. **Do not re-run failed jobs blindly.** Read the log, fix locally, push once.
8. **Never cancel or work around the budget breaker.** A failing
   `CI budget breaker` step means stop and tell the human.

How the guardrails work (breaker, `changes` gate, the optional Claude Code
hook, and the GitHub-side spending limit) is in `docs/runbooks/ci-cost.md`.
Humans: set an Actions budget with **stop usage** and alerts, see the runbook.
