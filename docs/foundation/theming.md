# Theming

## Purpose

Inceptor supports **light** and **dark** modes out of the box. This page
explains how the theme system works, how to add a new theme, and how CSS
variable layering lets sub-trees opt out of the document theme.

## How it works

The theme is driven by a single class on `<html>`: `class="dark"` for dark
mode, absent for light mode. Tailwind v4's custom `@variant dark` directive in
`src/styles/global.css` ensures that `dark:` utilities only apply inside
`.dark` — and, crucially, **not** inside a `.light` container nested below it.

```css
/* src/styles/global.css */
@variant dark (&:where(.dark, .dark *):not(:where(.light, .light *)));
```

This lets the gallery render a genuine side-by-side light preview and a dark
preview on the same page.

## CSS variable layering

Token values live in two blocks:

```css
:root, .light { /* light tokens */ }
.dark          { /* dark tokens  */ }
```

Because `:root` and `.light` share the same declarations, wrapping any element
in `class="light"` resets that sub-tree to light tokens regardless of the
document class. This is intentional: it powers the gallery's light/dark
split-preview.

## Switching the theme

The `ThemeIndicator` island handles toggle logic. It writes `localStorage.theme`
and flips the `html` class. Never toggle the theme from CSS — always use JS to
update `html.className`.

```ts
// ✅ Correct toggle
document.documentElement.classList.toggle('dark', isDark);
localStorage.setItem('theme', isDark ? 'dark' : 'light');

// ❌ Wrong — media query can't see JS-driven changes
@media (prefers-color-scheme: dark) { … }
```

## Adding a custom theme

1. Add a new CSS class (e.g. `.ocean`) to `src/styles/global.css` that
   re-declares every required token.
2. Add `@variant ocean (&:where(.ocean, .ocean *):not(:where(.light, .ocean-light *)))`.
3. Update `ThemeIndicator` to cycle through the new class.

Minimal example:

```css
.ocean {
  color-scheme: dark;
  --background: oklch(0.18 0.04 230);
  --foreground: oklch(0.95 0 0);
  --primary: oklch(0.65 0.18 220);
  /* … declare all tokens … */
}
```

> **Rule:** A custom theme must declare _all_ tokens defined in `:root`. Missing
> a token falls through to the light value, which creates contrast bugs.

## Practical example

Forcing a sub-tree to always render in light mode (e.g. a print preview):

```tsx
export function PrintPreview({ children }: { children: React.ReactNode }) {
  return (
    // The `.light` class overrides .dark on html — tokens stay light here
    <div className="light rounded-lg border border-border bg-background p-6">
      {children}
    </div>
  );
}
```

## Anti-patterns

| Anti-pattern | Why it's wrong |
|---|---|
| `dark:bg-zinc-900` paired with a `bg-white` base | Duplicates what `bg-background` already handles |
| Reading `localStorage.theme` in server-side `.astro` | SSR runs before the browser; causes flash-of-wrong-theme |
| Separate stylesheet per theme | Cascades diverge; use CSS variable layers instead |
| Using `prefers-color-scheme` as the sole signal | Ignores user's explicit in-app preference |

## See also

- [`docs/foundation/tokens.md`](./tokens.md) — full token catalogue
- [`src/styles/global.css`](../../src/styles/global.css) — token definitions
- [`src/components/islands/ThemeIndicator.tsx`](../../src/components/islands/ThemeIndicator.tsx)
