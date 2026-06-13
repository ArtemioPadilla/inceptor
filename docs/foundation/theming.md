# Theming

Inceptor supports light and dark mode through a single, layered
CSS-variable model. There is no second theme file and no JavaScript
restyle pass — a mode change is one class on `<html>`, and every semantic
token re-resolves underneath it.

## The model in one sentence

Tokens are declared for light under `:root, .light`, overridden for dark
under `.dark`, and the active mode is whichever class is on `<html>`.

## The three layers

1. **Token declarations** — [`src/styles/global.css`](../../src/styles/global.css)
   declares every semantic token twice: once in the `:root, .light` block
   (light values) and once in `.dark` (dark overrides). Same token names,
   different values. See [`tokens.md`](./tokens.md) for the list.

2. **Tailwind mapping** — the `@theme inline` block maps each token to a
   Tailwind color (`--color-primary: var(--primary)`), so `bg-primary`
   resolves to whatever `--primary` currently is. Utilities never bake in a
   value; they always indirect through the variable.

3. **The dark variant** — instead of Tailwind's default, Inceptor defines:

   ```css
   @variant dark (&:where(.dark, .dark *):not(:where(.light, .light *)));
   ```

   This means `dark:` utilities activate under `.dark` **but switch back
   off inside a nested `.light` container**. That is what lets the gallery
   render a true light preview and a true dark preview side-by-side on the
   same page — a `.light` wrapper re-declares the light tokens _and_ opts
   its subtree out of `dark:` utilities.

## Runtime: the theme store

The active class is managed by the [`src/stores/theme.ts`](../../src/stores/theme.ts)
Nano Store, not React Context (cross-island state rule — see
[`CLAUDE.md`](../../CLAUDE.md)). It:

- reads the initial mode from the `.dark` class / `localStorage` on mount,
- toggles the `<html>` class and persists the choice on change,
- syncs across tabs via the `storage` event.

A flash-free initial paint is handled by an inline script in `BaseLayout`
that sets the class before first paint, so there is no light-to-dark flash
on load.

Any island reads the current mode reactively:

```tsx
import { useStore } from '@nanostores/react';
import { $theme, toggleTheme } from '@/stores/theme';

export default function ThemeAwareThing() {
  const theme = useStore($theme); // 'light' | 'dark'
  return <button onClick={toggleTheme}>Current: {theme}</button>;
}
```

## Principles

- **Author once, theme for free.** If you only use semantic tokens, your
  component is correct in both modes with zero `dark:` overrides. Reach for
  a `dark:` utility only for a genuine per-mode exception, not as the
  primary styling method.
- **Same hue, shifted lightness.** Dark values keep the light hue and move
  lightness/chroma (emerald stays emerald, just luminous on near-black).
  This keeps the brand coherent across modes.
- **Borders get softer in dark.** Dark mode uses translucent borders
  (`oklch(1 0 0 / 12%)`) rather than a solid gray, so edges read without
  glowing.

## Practical example: a panel that needs no `dark:`

```tsx
// Correct in both modes purely through tokens.
<aside className="rounded-lg border border-border bg-card p-4 text-card-foreground">
  <h2 className="font-display">Activity</h2>
  <p className="text-sm text-muted-foreground">No new events.</p>
</aside>
```

## Anti-patterns

- ❌ A second theme stylesheet or a JS pass that swaps colors. ✅ One class
  on `<html>`; tokens do the rest.
- ❌ `dark:bg-[#1a1a1a]` literals scattered through components. ✅ `bg-card`
  — it is already the right value in each mode.
- ❌ Reading/writing theme through React Context or prop-drilling. ✅ The
  `$theme` Nano Store.
- ❌ Toggling theme without persisting / without the pre-paint script
  (causes a flash). ✅ Use the store + `BaseLayout`'s inline init.
