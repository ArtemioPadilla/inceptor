# Design Tokens

## Purpose

Design tokens are the single source of truth for Inceptor's visual language.
They map semantic intent to CSS custom properties defined in
`src/styles/global.css`. Every primitive and island reads from these tokens —
never hard-coded colour literals.

## Token categories

| Category | CSS var prefix | Intent |
|---|---|---|
| Surface | `--background`, `--card`, `--popover` | Page backgrounds and elevated surfaces |
| Text | `--foreground`, `--muted-foreground` | Primary and secondary prose |
| Brand / action | `--primary`, `--primary-foreground` | CTAs, active states, links |
| Secondary | `--secondary`, `--secondary-foreground` | Lower-priority actions |
| Accent | `--accent`, `--accent-foreground` | Hover / highlight washes |
| Destructive | `--destructive`, `--destructive-foreground` | Delete, revoke, danger |
| Border / input | `--border`, `--input`, `--ring` | Lines, field outlines, focus rings |
| Chart palette | `--chart-1` … `--chart-5` | Data-visualisation series |
| Radius | `--radius` | Shared border-radius ramp |
| Sidebar | `--sidebar-*` | Left-nav shell (see layout docs) |

All tokens are `oklch()`-based, which preserves perceptual uniformity across
light and dark modes with simple lightness inversions.

## Usage guidelines

**Do** use Tailwind semantic utilities that resolve to these tokens:

```html
<!-- ✅ semantic -->
<div class="bg-background text-foreground border-border" />
<button class="bg-primary text-primary-foreground" />
```

**Don't** reach for raw palette names or hex literals:

```html
<!-- ❌ anti-pattern: bypasses token system -->
<div class="bg-white text-black" />
<button style="background: #059669" />
```

**Don't** hardcode a dark-mode variant that duplicates what a token already
handles:

```html
<!-- ❌ redundant — tokens already handle dark -->
<div class="bg-white dark:bg-zinc-900" />
```

## Practical example

A status badge that adapts to light and dark automatically:

```tsx
// ✅ Uses semantic tokens — no dark: override needed
export function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
                     bg-accent text-accent-foreground text-xs font-medium">
      {label}
    </span>
  );
}
```

Compare with the anti-pattern:

```tsx
// ❌ Ignores tokens; breaks in dark mode
export function StatusBadge({ label }: { label: string }) {
  return (
    <span style={{ background: '#d1fae5', color: '#065f46' }}>{label}</span>
  );
}
```

## Anti-patterns summary

| Anti-pattern | Why it's wrong |
|---|---|
| Hex / RGB literals in style prop | Bypasses dark mode, breaks theme swap |
| `dark:bg-*` paired with a light literal | Token already handles both modes |
| Accessing `--primary` via `var()` in a `.tsx` file | Use Tailwind utility; avoids specificity fights |
| Using chart colours for UI chrome | Chart tokens are for data only; use `--accent` for highlights |

## See also

- [`docs/foundation/theming.md`](./theming.md) — dark/light switching mechanics
- [`docs/foundation/accessibility.md`](./accessibility.md) — contrast requirements per token
- [`src/styles/global.css`](../../src/styles/global.css) — canonical token values
