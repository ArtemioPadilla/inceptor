#!/usr/bin/env bash
# create-issues.sh
# Bootstraps labels, milestones, and the 27 integration-plan issues for this repo.
#
# Requirements:
#   - gh CLI installed and authenticated: `gh auth login`
#   - Run from the repo root (the script uses the current `gh` repo context)
#   - Idempotent: re-running skips items that already exist (matches by name)
#
# Usage:
#   bash scripts/create-issues.sh                  # dry-run preview
#   bash scripts/create-issues.sh --apply          # actually create everything
#   bash scripts/create-issues.sh --apply --issues-only   # skip labels/milestones

set -euo pipefail

APPLY=false
SKIP_META=false
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=true ;;
    --issues-only) SKIP_META=true ;;
    -h|--help)
      sed -n '2,15p' "$0"
      exit 0
      ;;
  esac
done

if ! command -v gh >/dev/null; then
  echo "ERROR: gh CLI not found. Install: https://cli.github.com" >&2
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: gh not authenticated. Run: gh auth login" >&2
  exit 1
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Target repo: $REPO"
$APPLY || echo "[DRY RUN — pass --apply to actually create things]"
echo

# ----------------------------------------------------------------------
# Labels
# ----------------------------------------------------------------------
declare -A LABELS=(
  ["phase-0"]="6E6E6E"
  ["phase-1"]="0E8A16"
  ["phase-2"]="1D76DB"
  ["phase-3"]="5319E7"
  ["phase-4"]="B60205"
  ["phase-5"]="D93F0B"
  ["phase-6"]="FBCA04"
  ["phase-7"]="0052CC"
  ["type:chore"]="C5DEF5"
  ["type:feat"]="A2EEEF"
  ["type:docs"]="D4C5F9"
)

create_label() {
  local name="$1" color="$2"
  if gh label list --limit 200 --json name -q '.[].name' | grep -Fxq "$name"; then
    echo "  · label exists: $name"
  else
    if $APPLY; then
      gh label create "$name" --color "$color" --description "Auto-created by create-issues.sh"
    fi
    echo "  + label: $name (#$color)"
  fi
}

# ----------------------------------------------------------------------
# Milestones (gh has no first-class milestone CLI; use the REST API)
# ----------------------------------------------------------------------
create_milestone() {
  local title="$1" description="$2"
  local existing
  existing=$(gh api "repos/$REPO/milestones?state=all" -q ".[] | select(.title == \"$title\") | .number" || true)
  if [[ -n "$existing" ]]; then
    echo "  · milestone exists: $title (#$existing)"
  else
    if $APPLY; then
      gh api "repos/$REPO/milestones" \
        -f title="$title" \
        -f description="$description" \
        -f state=open >/dev/null
    fi
    echo "  + milestone: $title"
  fi
}

# ----------------------------------------------------------------------
# Issues
# ----------------------------------------------------------------------
create_issue() {
  local title="$1" milestone="$2" labels="$3" body="$4"
  # Skip if an open or closed issue with the exact title already exists
  if gh issue list --state all --search "in:title \"$title\"" --json title -q '.[].title' | grep -Fxq "$title"; then
    echo "  · issue exists: $title"
    return
  fi
  if $APPLY; then
    gh issue create \
      --title "$title" \
      --body "$body" \
      --label "$labels" \
      --milestone "$milestone" >/dev/null
  fi
  echo "  + issue: $title"
}

# Standardized issue body. Source of truth remains INTEGRATION-PLAN.md.
make_body() {
  local issue_num="$1" branch="$2" depends="$3" effort="$4" desc="$5" accept="$6"
  cat <<EOF
> Source of truth: see [\`INTEGRATION-PLAN.md\`](../blob/main/INTEGRATION-PLAN.md#issue-$(printf '%03d' "$issue_num")).

**Branch**: \`$branch\`
**Depends on**: $depends
**Effort**: $effort

## Description

$desc

## Acceptance criteria

$accept

## Workflow

Run \`/goal #$issue_num\` in Claude Code to execute this issue automatically.
EOF
}

# ======================================================================
# Step 1 — labels
# ======================================================================
if ! $SKIP_META; then
  echo "==> Labels"
  for name in "${!LABELS[@]}"; do
    create_label "$name" "${LABELS[$name]}"
  done
  echo
fi

# ======================================================================
# Step 2 — milestones
# ======================================================================
if ! $SKIP_META; then
  echo "==> Milestones"
  create_milestone "v0.2 - Stack modernization"   "Phase 0 — bring base stack to current versions (Astro 5, Tailwind v4, React)"
  create_milestone "v0.3 - Component system"      "Phase 1 — shadcn/ui + Base UI foundation"
  create_milestone "v0.4 - State"                 "Phase 2 — Nano Stores + TanStack Query + offline persister"
  create_milestone "v0.5 - Data grids"            "Phase 3 — TanStack Table/Virtual + URL state"
  create_milestone "v0.6 - Dashboards"            "Phase 4 — Tremor Raw + Recharts + /dashboard page"
  create_milestone "v0.7 - Offline-first"         "Phase 5 — @vite-pwa/astro + offline UI"
  create_milestone "v0.8 - Motion"                "Phase 6 — view transitions + tailwindcss-motion + Motion lazy"
  create_milestone "v1.0 - Inceptor-aware stack"       "Phase 7 — FeedbackFAB+React + visual regression + issue templates"
  echo
fi

# ======================================================================
# Step 3 — issues
# ======================================================================
echo "==> Issues"

create_issue "chore: upgrade Astro 4.16 → 5.x" \
  "v0.2 - Stack modernization" "phase-0,type:chore" \
  "$(make_body 1 'phase-0/issue-001-upgrade-astro-5' 'none' 'S' \
    'Required for Tailwind v4, native View Transitions, Skew Protection, React 19.' \
    '- [ ] \`npm ls astro\` reports 5.x
- [ ] \`astro.config.mjs\` updated for breaking changes
- [ ] \`npm run build\` passes
- [ ] Hello World renders identically')"

create_issue "chore: migrate Tailwind v3 → v4 via @tailwindcss/vite" \
  "v0.2 - Stack modernization" "phase-0,type:chore" \
  "$(make_body 2 'phase-0/issue-002-tailwind-v4' '#1' 'M' \
    'Replace deprecated \`@astrojs/tailwind\` with \`@tailwindcss/vite\`. Move config to CSS-first.' \
    '- [ ] \`@astrojs/tailwind\` removed
- [ ] \`tailwindcss@^4\` + \`@tailwindcss/vite@^4\` installed
- [ ] \`astro.config.mjs\` uses Vite plugin
- [ ] \`tailwind.config.mjs\` deleted; tokens in \`src/styles/global.css\`')"

create_issue "chore: add @astrojs/react + path aliases" \
  "v0.2 - Stack modernization" "phase-0,type:chore" \
  "$(make_body 3 'phase-0/issue-003-react-and-aliases' '#2' 'S' \
    'Add React 19 via \`npx astro add react\`. Configure \`@/*\` path alias.' \
    '- [ ] React 19 installed
- [ ] tsconfig has \`@/*\` → \`./src/*\`
- [ ] \`<HelloReact client:load />\` renders')"

create_issue "feat: bootstrap shadcn/ui with Base UI primitives" \
  "v0.3 - Component system" "phase-1,type:feat" \
  "$(make_body 4 'phase-1/issue-004-shadcn-init' '#3' 'M' \
    'Run \`npx shadcn@latest init\` choosing Base UI primitives.' \
    '- [ ] \`components.json\` at root
- [ ] \`src/lib/utils.ts\` exports \`cn()\`
- [ ] CSS vars in \`global.css\` (light + dark)')"

create_issue "feat: dark mode toggle (zero-flash)" \
  "v0.3 - Component system" "phase-1,type:feat" \
  "$(make_body 5 'phase-1/issue-005-dark-mode' '#4' 'M' \
    'Inline script in <head> applies theme before paint; toggle is .astro (no React).' \
    '- [ ] \`ThemeToggle.astro\` exists
- [ ] No flash on hard reload
- [ ] \`aria-pressed\` correct')"

create_issue "feat: install base component set" \
  "v0.3 - Component system" "phase-1,type:feat" \
  "$(make_body 6 'phase-1/issue-006-base-components' '#4' 'M' \
    'Install button, input, label, card, dialog, dropdown-menu, table, badge, tabs, toast, form.' \
    '- [ ] All components under \`src/components/ui/\`
- [ ] No \`@radix-ui\` imports (Base UI only)
- [ ] No \`framer-motion\` imports')"

create_issue "feat: /showcase page" \
  "v0.3 - Component system" "phase-1,type:feat" \
  "$(make_body 7 'phase-1/issue-007-showcase-page' '#6' 'M' \
    'Render every installed component on /showcase as living docs + visual-regression target.' \
    '- [ ] \`src/pages/showcase.astro\` exists
- [ ] All components in light + dark
- [ ] No console errors')"

create_issue "docs: component contribution guide" \
  "v0.3 - Component system" "phase-1,type:docs" \
  "$(make_body 8 'phase-1/issue-008-component-docs' '#7' 'S' \
    'Document adding components, the multi-island gotcha, theming via CSS vars.' \
    '- [ ] \`docs/COMPONENTS.md\` exists
- [ ] Linked from README')"

create_issue "feat: Nano Stores for cross-island state" \
  "v0.4 - State" "phase-2,type:feat" \
  "$(make_body 9 'phase-2/issue-009-nano-stores' '#5' 'M' \
    'Install \`nanostores\` + \`@nanostores/react\`. Migrate theme state to Nano.' \
    '- [ ] \`src/stores/theme.ts\` exports \`\$theme\`
- [ ] No \`React.createContext\` anywhere
- [ ] Two islands share theme state live')"

create_issue "feat: TanStack Query + idb-keyval persister" \
  "v0.4 - State" "phase-2,type:feat" \
  "$(make_body 10 'phase-2/issue-010-tanstack-query' '#6' 'L' \
    'TanStack Query with AsyncStoragePersister + idb-keyval. Provider per-island.' \
    '- [ ] Packages installed
- [ ] \`src/lib/queryClient.ts\` factory
- [ ] Opt-in via \`meta: { persist: true }\`
- [ ] IndexedDB shows cache')"

create_issue "feat: example data island — GitHub Issues fetcher (dogfood)" \
  "v0.4 - State" "phase-2,type:feat" \
  "$(make_body 11 'phase-2/issue-011-issues-fetcher' '#10' 'M' \
    'React island lists open issues from this very repo. Loading/error/empty states.' \
    '- [ ] \`IssuesList.tsx\` exists
- [ ] Cache survives reload
- [ ] /data demo page')"

create_issue "feat: TanStack Table + Virtual integration" \
  "v0.5 - Data grids" "phase-3,type:feat" \
  "$(make_body 12 'phase-3/issue-012-tanstack-table' '#10' 'L' \
    'Generic <DataTable> on shadcn <Table>. Sort, filter, pinning, resize, virtualization.' \
    '- [ ] \`data-table.tsx\` exports \`<DataTable>\`
- [ ] Generic-typed columns
- [ ] Documented')"

create_issue "feat: 50k-row virtualization demo" \
  "v0.5 - Data grids" "phase-3,type:feat" \
  "$(make_body 13 'phase-3/issue-013-large-list-demo' '#12' 'M' \
    'Demo page at /data/large rendering 50,000 rows. Budget: <16ms/frame, <50ms input.' \
    '- [ ] Page works
- [ ] 60fps scroll verified
- [ ] Filter <50ms')"

create_issue "feat: URL state sync for filters" \
  "v0.5 - Data grids" "phase-3,type:feat" \
  "$(make_body 14 'phase-3/issue-014-url-state' '#12' 'M' \
    'Persist DataTable state in URLSearchParams. Shareable, back/forward works.' \
    '- [ ] Filters update URL without reload
- [ ] Pasting URL restores state')"

create_issue "feat: Tremor Raw KPI components (copy-paste)" \
  "v0.6 - Dashboards" "phase-4,type:feat" \
  "$(make_body 15 'phase-4/issue-015-tremor-raw' '#6' 'M' \
    'Copy Tremor Raw Card/Metric/ProgressBar/Tracker/Callout/Divider. DO NOT install @tremor/react.' \
    '- [ ] Components in \`src/components/ui/\`
- [ ] No \`@tremor/react\` import
- [ ] In /showcase')"

create_issue "feat: Recharts wrappers themed to shadcn CSS vars" \
  "v0.6 - Dashboards" "phase-4,type:feat" \
  "$(make_body 16 'phase-4/issue-016-recharts-wrappers' '#15' 'M' \
    'Line/Bar/Area/Donut wrappers reading var(--chart-1)..(--chart-5). Lazy-load on /dashboard only.' \
    '- [ ] Wrappers exist
- [ ] Dark mode flips colors automatically
- [ ] Recharts in separate chunk')"

create_issue "feat: /dashboard demo page" \
  "v0.6 - Dashboards" "phase-4,type:feat" \
  "$(make_body 17 'phase-4/issue-017-dashboard-page' '#15, #16, #12' 'L' \
    '3 KPIs + 2 charts + 1 table, fed by the dogfood GitHub Issues source.' \
    '- [ ] Page renders the full layout
- [ ] Lighthouse Performance ≥ 90
- [ ] Mobile 375px works')"

create_issue "feat: @vite-pwa/astro" \
  "v0.7 - Offline-first" "phase-5,type:feat" \
  "$(make_body 18 'phase-5/issue-018-vite-pwa' '#17' 'M' \
    'Install @vite-pwa/astro. Manifest, icons, autoUpdate, Workbox stale-while-revalidate.' \
    '- [ ] manifest.webmanifest generated
- [ ] SW registered
- [ ] App installable
- [ ] Lighthouse PWA passes')"

create_issue "feat: offline indicator + retry UI" \
  "v0.7 - Offline-first" "phase-5,type:feat" \
  "$(make_body 19 'phase-5/issue-019-offline-ui' '#18' 'M' \
    'Detect navigator.onLine. Banner + Retry wired to queryClient.invalidateQueries().' \
    '- [ ] Banner appears <1s offline
- [ ] Retry refetches failed queries')"

create_issue "feat: install + update prompts" \
  "v0.7 - Offline-first" "phase-5,type:feat" \
  "$(make_body 20 'phase-5/issue-020-pwa-prompts' '#18' 'M' \
    'beforeinstallprompt → custom install button. SW updated → toast with Reload CTA.' \
    '- [ ] Install button shows on prompt event
- [ ] Update toast after deploy
- [ ] Reload activates new SW')"

create_issue "feat: native @view-transition for cross-page" \
  "v0.8 - Motion" "phase-6,type:feat" \
  "$(make_body 21 'phase-6/issue-021-view-transitions' '#3' 'S' \
    'CSS @view-transition { navigation: auto; }. Hero elements get view-transition-name.' \
    '- [ ] Rule in global.css
- [ ] At least one named element
- [ ] No breakage on older browsers')"

create_issue "feat: tailwindcss-motion utilities" \
  "v0.8 - Motion" "phase-6,type:feat" \
  "$(make_body 22 'phase-6/issue-022-tw-motion' '#2' 'S' \
    'Install tailwindcss-motion. Replace imperative micro-animations with utilities.' \
    '- [ ] Plugin registered
- [ ] ≥3 components use it
- [ ] No JS bundle growth')"

create_issue "feat: Motion (lazy) for complex islands" \
  "v0.8 - Motion" "phase-6,type:feat" \
  "$(make_body 23 'phase-6/issue-023-motion-lazy' '#6' 'M' \
    'Install \`motion\` (NOT framer-motion). Document LazyMotion + domAnimation pattern.' \
    '- [ ] motion installed
- [ ] One island uses LazyMotion
- [ ] Motion in own chunk
- [ ] No \`framer-motion\` imports anywhere')"

create_issue "feat: FeedbackFAB captures React errors" \
  "v1.0 - Inceptor-aware stack" "phase-7,type:feat" \
  "$(make_body 24 'phase-7/issue-024-feedback-react' '#6' 'L' \
    'ErrorBoundary on each island. Capture component path. Hydration mismatch detection.' \
    '- [ ] ErrorBoundary auto-applied
- [ ] Thrown error pre-fills issue with stack
- [ ] Hydration mismatches captured')"

create_issue "chore: update CLAUDE.md with installed stack context" \
  "v1.0 - Inceptor-aware stack" "phase-7,type:chore" \
  "$(make_body 25 'phase-7/issue-025-claude-md' '#17' 'S' \
    'Refresh CLAUDE.md to reflect actually-installed versions and add /goal docs.' \
    '- [ ] Versions current
- [ ] /goal + sub-agents documented
- [ ] Compound-component gotcha with example')"

create_issue "docs: new issue templates (component, dashboard, table)" \
  "v1.0 - Inceptor-aware stack" "phase-7,type:docs" \
  "$(make_body 26 'phase-7/issue-026-issue-templates' '#25' 'M' \
    'add_component.yml, add_dashboard.yml, add_data_table.yml. Pre-fill Claude triage context.' \
    '- [ ] Three YAML templates
- [ ] Selectable from New Issue UI
- [ ] Pre-applied labels')"

create_issue "chore: visual regression in CI (Playwright)" \
  "v1.0 - Inceptor-aware stack" "phase-7,type:chore" \
  "$(make_body 27 'phase-7/issue-027-visual-regression' '#7, #17' 'L' \
    'Playwright CI job snapshots /showcase and /dashboard in light + dark.' \
    '- [ ] Playwright configured
- [ ] Snapshots both pages, both themes
- [ ] Baselines committed
- [ ] Update process documented')"

echo
echo "✅ Done."
$APPLY || echo "[That was a dry run. Re-run with --apply to actually create everything.]"
