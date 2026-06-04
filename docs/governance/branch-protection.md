# Branch protection — recommended setup

This page documents the branch-protection rules the scaffold is designed for.
None of these are auto-configured (GitHub doesn't expose them in repo files),
but every CI workflow + sub-agent contract assumes they're in place. Run
these commands once per new project.

## What this enforces

1. `main` is never directly pushed to — every change goes through a PR.
2. PRs cannot merge until CI gates pass (build, type-check, tests, a11y).
3. Squash-merge keeps `main` linear, so `git log --oneline` reads as the
   list of shipped features.
4. Commits must be signed — verifies authorship and lets us drop the
   "Co-Authored-By" guard later if we want.

## One-shot setup via gh CLI

Replace `<owner>/<repo>` with your slug. Requires `gh auth login` first.

```bash
REPO=<owner>/<repo>

gh api -X PUT repos/$REPO/branches/main/protection \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=build \
  --field required_status_checks[contexts][]=test \
  --field required_status_checks[contexts][]=type-check \
  --field required_status_checks[contexts][]=visual \
  --field enforce_admins=true \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field required_pull_request_reviews[require_code_owner_reviews]=true \
  --field required_linear_history=true \
  --field required_signatures=true \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field block_creations=false
```

## Status-check names

These must match the `name:` field on the relevant CI jobs. Today's workflows
register checks under: `build`, `test`, `type-check`, `visual` (advisory until
Epic 1 closes — see `docs/governance/visual-gate.md`). Adjust if you rename
workflows.

## Why `required_signatures: true`

GitHub's "Verified" badge requires either a GPG-signed commit or a commit
made via the GitHub UI / `gh` CLI (which signs with GitHub's own key). The
The Inceptor sub-agents commit through git, so set up `gpgsign = true` in
`~/.gitconfig` once and every Claude commit auto-signs.

## What you give up

- **Branch protection on `main` only.** `release/*` branches stay open for
  release-prep without paperwork.
- **Bot pushes still go through PRs.** Dependabot's PRs hit the same gates,
  so a broken dep bump never auto-merges.
- **Squash-merge is the only merge type.** Rebase + merge would also work
  but linear history is easier to bisect.
