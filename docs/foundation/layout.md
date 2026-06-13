# Layout

This page defines the page regions Inceptor expects, the spacing rhythm
that holds them together, and the responsive behavior every page should
follow. It is the bridge between raw [`tokens.md`](./tokens.md) and the
composed patterns (the service shell, details pages, and wizard) built on
top.

## Page regions

A typical Inceptor page nests three concerns:

1. **Document shell** — `BaseLayout.astro` provides `<head>`, the theme
   class on `<html>`, fonts, skip link, and the `FeedbackFAB`. Every page
   goes through it.
2. **Page frame** — a centered content column with a max width and
   responsive horizontal padding. This is where most pages live.
3. **App shell** _(optional)_ — for product surfaces, the service shell
   pattern (see [`docs/patterns/`](../patterns/) and issue #198) replaces
   the simple frame with navigation, a tools region, a content region, and
   an optional split panel.

### The content column

Center content and cap its width so long-line readability holds on wide
monitors:

```astro
<main class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
  <!-- page content -->
</main>
```

| Width cap          | Use for                                                 |
| ------------------ | ------------------------------------------------------- |
| `max-w-2xl`        | Long-form prose, a single form.                         |
| `max-w-4xl`        | Article + sidebar, focused tools.                       |
| `max-w-6xl`        | Dashboards, galleries, multi-column content.            |
| `max-w-screen-2xl` | Full app shells that manage their own internal columns. |

## Spacing rhythm

Spacing uses Tailwind's default scale (each step = `0.25rem`). Keep a
consistent rhythm rather than picking arbitrary values:

| Scope                                      | Spacing                     |
| ------------------------------------------ | --------------------------- |
| Inside a control (padding)                 | `px-3 py-2`                 |
| Between related items (a form field group) | `space-y-2`                 |
| Between blocks in a section                | `space-y-4`                 |
| Between sections on a page                 | `space-y-8` to `space-y-12` |
| Page top/bottom padding                    | `py-8` to `py-16`           |

The same scale tightens under compact density — see
[`density.md`](./density.md). Stick to the scale; if you need a value
between steps, you almost certainly want the nearest step.

## Responsive behavior

Inceptor is **mobile-first**: author the small-screen layout with no
prefix, then add complexity at breakpoints. Tailwind's breakpoints:

| Prefix         | Min width     | Typical shift                                 |
| -------------- | ------------- | --------------------------------------------- |
| _(none)_       | 0             | Single column, stacked.                       |
| `sm:`          | 640px         | Comfortable phone landscape / small tablet.   |
| `md:`          | 768px         | Two columns appear; side navigation can dock. |
| `lg:`          | 1024px        | Full multi-column; split panels open inline.  |
| `xl:` / `2xl:` | 1280 / 1536px | Wider gutters, capped content width.          |

Patterns:

- **Stack, then split.** Multi-region layouts stack vertically on mobile
  and become columns at `md:`/`lg:` (`flex-col md:flex-row`,
  `grid-cols-1 lg:grid-cols-[16rem_1fr]`).
- **Navigation collapses.** Persistent side nav becomes a toggle/drawer
  below `md:`. The service shell handles this for you.
- **Nothing overflows horizontally.** Test at 360px. Wide elements (tables,
  code blocks) scroll inside their own container, never the page.

## Example: a standard page frame

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Settings" description="Manage your workspace">
  <main class="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <header class="space-y-1">
      <h1 class="font-display text-3xl">Settings</h1>
      <p class="text-muted-foreground">Manage your workspace.</p>
    </header>

    <div class="mt-8 space-y-8">
      <!-- sections, each space-y-4 internally -->
    </div>
  </main>
</BaseLayout>
```

## Anti-patterns

- ❌ Uncapped full-bleed text columns on wide screens (lines get too long
  to read). ✅ Cap with `max-w-*` and center with `mx-auto`.
- ❌ Arbitrary one-off spacings (`mt-[13px]`). ✅ Use the scale.
- ❌ Desktop-first layouts retrofitted for mobile. ✅ Mobile-first, add at
  breakpoints.
- ❌ Page-level horizontal scroll. ✅ Contain wide content locally.
