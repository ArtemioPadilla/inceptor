---
title: Commands cheatsheet
description: Every npm script and shell helper, in one table.
---

## Daily

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server (port 4321, includes `/docs/*`) |
| `npm run build` | Production build (static + service worker) |
| `npm run check` | Composite: `check:astro` + `type-check` + `test` + `build` |
| `npm run test` | Vitest unit tests (one-shot) |
| `npm run test:watch` (alias `npm run tdd`) | Vitest in watch mode |
| `npm run test:visual` | Playwright visual regression |
| `npm run test:visual:update` | Refresh visual baselines |

## Workflow

| Command | What it does |
|---|---|
| `npm run monday` | Monday-morning dashboard (open PRs, recent merges, top issues) |
| `npm run ship` | Run `check` + push + open PR via gh |
| `npm run doctor` | Preflight: node version, gh auth, working tree, etc. |
| `npm run new-issue` | `gh issue create` wrapper with branch-inferred labels |
| `npm run docs` | Open `docs/INDEX.md` |

## Sub-agents (dispatched by the main Claude Code session)

| Agent | When |
|---|---|
| `prometeo` | Plans an issue/phase: dependency graph, behavior contracts, Functional Triad |
| `forja` | Implements with red-then-green commits + `Tdd-Red:` trailer |
| `centinela` | Validates: build, type-check, tests, ethics checklist, forbidden-import scan |

## Maintenance

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm outdated` | List packages with newer versions |
| `npx shadcn@latest add <name>` | Add a primitive-free shadcn component |
