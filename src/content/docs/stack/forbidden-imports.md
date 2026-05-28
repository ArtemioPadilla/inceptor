---
title: Forbidden imports
description: Single source of truth for what this scaffold refuses to ship.
---

These are non-negotiable. `centinela` enforces them with grep; `forja` refuses
to install them. If you genuinely need one of these, file an ADR explaining
why.

| Import | Why forbidden | Use instead |
|---|---|---|
| `from '@astrojs/tailwind'` | Deprecated for Tailwind v4 | `@tailwindcss/vite` (Vite plugin, not Astro integration) |
| `from '@radix-ui/*'` | Slowed dev since WorkOS acquisition; we picked Base UI as the primitive layer | `@base-ui-components/react` |
| `from 'framer-motion'` | Merged into the `motion` package in Dec 2024 | `motion/react` (with `LazyMotion` + `domAnimation`) |
| `from '@tremor/react'` | Bundles too much, hard to tree-shake, hard to customize | Copy-paste Tremor Raw components into `src/components/ui/` |
| `React.createContext` for cross-island state | Astro's partial hydration breaks Context across islands | Nano Stores (`nanostores` + `@nanostores/react`) |

`React.createContext` is allowed **inside a single React island** for
compound-component plumbing (e.g. `<Form>` → `<FormField>` → `<FormControl>`)
because the entire composition lives in one file and hydrates as a single
island. This is documented in [the compound-component gotcha page](/docs/building/compound-components/).

## How `centinela` enforces this

```bash
grep -rE "from ['\"]@astrojs/tailwind['\"]" src/ && echo "FAIL" || echo "PASS"
grep -rE "from ['\"]@radix-ui/" src/         && echo "FAIL" || echo "PASS"
grep -rE "from ['\"]framer-motion['\"]" src/  && echo "FAIL" || echo "PASS"
grep -rE "from ['\"]@tremor/react['\"]" src/  && echo "FAIL" || echo "PASS"
```

Any match returns a `FORBIDDEN_IMPORT` failure class from centinela and routes
back to forja with the diagnosis.

## See also

- [ADR 0002 — Base UI over Radix UI](/docs/decisions/0002-base-ui-over-radix/)
- The [stack overview](/docs/stack/overview/) for full installed versions
