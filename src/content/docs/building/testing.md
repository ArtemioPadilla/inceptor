---
title: Testing — Vitest + Playwright
description: Unit tests with Vitest, visual regression with Playwright.
---

This scaffold uses two test layers: **Vitest** for source-level and behavior tests,
**Playwright** for visual regression and end-to-end accessibility checks.

## Vitest — unit and source-text tests

Test files live next to the source they test (for component behavior tests) or in
`src/tests/` (for page-level and cross-cutting assertions).

### Pattern A — source-text inspection (`?raw`)

Useful for verifying exports, forbidden imports, and structural properties without
needing a DOM:

```ts
// src/tests/my-component.test.ts
import { describe, expect, it } from 'vitest';
import source from '../components/ui/my-component.tsx?raw';

describe('MyComponent', () => {
  it('exports MyComponent', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bMyComponent\b/);
  });

  it('uses cn from @/lib/utils', () => {
    expect(source).toMatch(/from ['"]@\/lib\/utils['"]/);
  });
});
```

### Pattern B — behavior tests (React Testing Library)

For testing interactive behavior, render the component in a DOM environment:

```ts
// src/components/ui/button.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeDefined();
  });
});
```

### Running tests

```bash
npm run test            # vitest watch
npx vitest --run        # single run (CI mode)
```

## Playwright — visual regression + accessibility

Playwright tests live in `tests/` at the repo root. Two separate runs:

- **`visual.yml`** CI workflow — snapshots in `tests/__screenshots__/`
- **`a11y/keyboard-nav.spec.ts`** — tab-walk on `/showcase`, asserts 100% keyboard reachability

```bash
npx playwright test                         # run all
npx playwright test tests/a11y/             # a11y only
npx playwright test --update-snapshots      # refresh screenshots (Linux env required)
```

> Snapshot updates must be run in the same Linux environment as CI to avoid
> pixel-level OS rendering differences. See `CONTRIBUTING.md — Visual regression`.

## TDD tier rubric

Not every change needs a full red→green dance. See [TDD with commit trailers](/docs/how-we-work/tdd/)
for the `tdd-tier:strict` / `tdd-tier:smoke` / `tdd-tier:exempt` rubric.

**Bugs found in production: regression test first, fix second — non-negotiable
regardless of tier.**

Full guide → [`docs/COMPONENTS.md §7`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/COMPONENTS.md#7-tests)
