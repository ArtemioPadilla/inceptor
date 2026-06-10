---
title: Theming & dark mode
description: Two-layer CSS-var model + class-based dark variant.
---

This repo uses a two-layer theming model: **design tokens → Tailwind utilities**.
Dark mode is class-based, not media-query-based, so a subtree can be forced dark
independently of the page theme (as the showcase does).

## Layer 1 — design tokens in `global.css`

All color and radius tokens live in `src/styles/global.css` under `@layer base`:

```css
@layer base {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    --primary: oklch(0.205 0 0);
    --primary-foreground: oklch(0.985 0 0);
    --border: oklch(0.922 0 0);
    --radius: 0.625rem;
    /* ... full list in global.css ... */
  }

  .dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    /* dark overrides ... */
  }
}
```

Tokens use `oklch()` for perceptual uniformity. Do not use hex or rgb for semantic tokens.

## Layer 2 — Tailwind utility mapping via `@theme inline`

Tokens become Tailwind utilities through the `@theme inline` block:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-border: var(--border);
}
```

This is what makes `bg-background`, `text-foreground`, `border-border`, etc. work
as Tailwind classes. Only tokens that appear in `@theme inline` become utilities.

## How dark mode works

Dark mode is **class-based**:

```css
@variant dark (&:where(.dark, .dark *));
```

Adding `class="dark"` to `<html>` makes the whole page dark. Adding it to any
inner `<div>` makes that subtree dark — as used in the showcase's "Dark" preview column.

## Zero-flash initialization

`BaseLayout.astro` includes an inline script in `<head>` that runs synchronously
before the browser renders any content. `is:inline` prevents Astro from deferring
it to a module script:

```html
<script is:inline>
  (function () {
    try {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (stored === 'dark' || (stored === null && prefersDark)) {
        document.documentElement.classList.add('dark');
      }
    } catch (_) {}
  })();
</script>
```

Without this, users with dark preference see a white flash on every page load.

## Adding a new token

1. Add the raw value under `:root { }` and its dark override under `.dark { }` in `global.css`.
2. Map it in `@theme inline { }` so Tailwind generates the utility.
3. Use the utility class in components.

## Prefer semantic over literal

```tsx
// Good — adapts to dark mode automatically
<div className="bg-background text-foreground border border-border">
  <span className="text-muted-foreground">subtitle</span>
</div>

// Avoid — locked to a specific color, dark mode won't flip it
<div className="bg-gray-50 text-gray-900 border border-gray-200">
```

Full guide → [`docs/COMPONENTS.md §5-6`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/COMPONENTS.md#5-theming-via-css-vars)
