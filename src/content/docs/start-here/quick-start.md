---
title: Quick start
description: Get a working local copy of the scaffold in under five minutes.
---

## Prerequisites

- **Node.js** ≥ 22 (use `nvm` or `fnm`)
- **npm** ≥ 10
- **git**, **gh** (GitHub CLI) — gh is required for the Inceptor sub-agent workflow

Run `npm run doctor` at any time to verify your environment.

## Clone & install

```sh
gh repo create my-thing --template ArtemioPadilla/inceptor --public --clone
cd my-thing
npm install
```

## Run the dev server

```sh
npm run dev
```

Visit `http://localhost:4321/` for the app, `http://localhost:4321/docs/` for these docs.

## The 5-second tour

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server with HMR |
| `npm run build` | Production build (static + service worker) |
| `npm run check` | All gates: type-check + Astro check + tests + build |
| `npm run test` | Vitest unit tests |
| `npm run test:visual` | Playwright visual regression |
| `npm run monday` | Monday-morning dashboard |
| `npm run ship` | Push current branch + open PR |
| `npm run doctor` | Preflight environment check |
| `npm run docs` | Open the docs INDEX |

## Next

Read [What you get](/docs/start-here/what-you-get/) for the feature inventory,
or [The 60-second Inceptor tour](/docs/start-here/inceptor-tour/) to understand the
workflow before you make your first change.
