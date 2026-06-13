# Accessibility baseline

This page defines the accessibility floor for Inceptor: what is
**mandatory** (enforced by tests and lint, a PR cannot merge without it)
versus **recommended** (good practice, reviewed by humans). The
distinction matters — mandatory rules are backed by a check you can run.

## Mandatory (enforced)

Each rule below is enforced by a specific gate. If your change violates
one, CI fails.

### 1. No serious or critical axe violations

Every public route is scanned with axe-core (WCAG 2.0/2.1 A & AA tags) and
must report **zero `serious` or `critical` violations**. Lower-impact
findings are reported but don't gate.

- Enforced by: [`tests/visual/a11y.spec.ts`](../../tests/visual/a11y.spec.ts).
- New top-level routes must be added to its route list so they're covered.
- This catches missing labels, bad roles, landmark problems, and many
  contrast failures automatically.

### 2. Text contrast clears WCAG AA

Body text and UI text on its intended surface must clear **4.5:1**
(normal) / **3:1** (large). The semantic token pairs in
[`tokens.md`](./tokens.md) are pre-tuned to pass — using them correctly is
how you satisfy this.

- Enforced by: [`src/tests/ux-contrast.test.ts`](../../src/tests/ux-contrast.test.ts).
- New `surface` / `surface-foreground` token pairs must be added to that
  test and clear the threshold.

### 3. Keyboard reachable with a visible focus indicator

Everything interactive must be reachable by Tab in a sensible order, and
the focused element must show a visible indicator (a non-zero `outline` or
a `box-shadow`). WCAG 2.4.7.

- Enforced by: [`tests/visual/keyboard-nav.spec.ts`](../../tests/visual/keyboard-nav.spec.ts).
- Don't remove focus outlines without replacing them. Use
  `focus-visible:ring-2 focus-visible:ring-ring` rather than `outline-none`
  alone.

### 4. No jsx-a11y lint violations

JSX must pass `eslint-plugin-jsx-a11y` (recommended set) and
`eslint-plugin-react-hooks`. This flags missing `alt`, click handlers on
non-interactive elements, invalid ARIA, and label associations before they
reach axe.

- Enforced by: `npm run lint` (part of `npm run check`).

### 5. Minimum tap target

Interactive controls must present at least a **44×44px** hit area, even
under compact density (see [`density.md`](./density.md)). Keep the visual
size small if you must, but extend the hit area with padding.

## Recommended (reviewed, not gated)

- **Semantic HTML first.** A real `<button>`/`<a>`/`<nav>`/`<main>` beats a
  `<div role="…">`. Reach for ARIA only when no native element fits.
- **One `<h1>` per page**, with a logical heading hierarchy (no skipped
  levels). The patterns in [`docs/patterns/`](../patterns/) model this.
- **Landmarks.** Wrap regions in `<header>`, `<nav>`, `<main>`,
  `<aside>`, `<footer>` so screen-reader users can jump between them.
- **Respect `prefers-reduced-motion`.** Motion is decorative; gate
  non-essential animation behind the media query (the design system already
  disables view-transition animation under it).
- **Accessible names for icon-only controls** — an `aria-label` on a button
  whose only child is an icon.
- **Announce async state changes** (loading, errors, success) via a live
  region so they aren't silent to assistive tech.

## How to check before you push

```bash
npm run lint          # jsx-a11y + react-hooks  (rule 4)
npm run test          # includes ux-contrast     (rule 2)
npm run build && npm run a11y          # axe pass        (rule 1)
npm run build && npm run keyboard-nav  # focus + tab order (rule 3)
```

`npm run check` runs lint + unit tests (rules 2 and 4) in one shot; the
Playwright suites (rules 1 and 3) run in the visual-regression CI job.

## Why the floor is non-negotiable

Inceptor is a template: every accessibility shortcut it ships is inherited
by every project built on it, multiplied across all of them. A serious
violation here isn't one bug — it's a defect distributed to every
downstream app. That's why these five rules are gates, not suggestions.
