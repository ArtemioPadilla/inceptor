# Density

Density is how much breathing room the UI gives content. Inceptor ships a
single **comfortable** default and treats **compact** as a documented,
opt-in convention you apply locally — not a global theme switch. This page
defines both so teams make the choice deliberately instead of sprinkling
ad-hoc paddings.

## Comfortable is the default

Every primitive in `src/components/ui/` is tuned for comfortable density:
generous tap targets, roomy padding, and the spacing rhythm described in
[`layout.md`](./layout.md). This is the right default for marketing pages,
forms, dashboards, and anything a first-time user touches.

Rules of thumb for comfortable:

- Interactive controls are at least **44×44px** of hit area (see
  [`accessibility.md`](./accessibility.md)).
- Card and panel padding is `p-4` to `p-6`.
- Vertical rhythm between sections is `space-y-6` to `space-y-8`.

## When to reach for compact

Compact density suits **information-dense, expert surfaces**: data tables
with many rows, log/console views, admin panels where a power user scans
hundreds of items and vertical space is the scarce resource. It is a
deliberate trade — you spend comfort and tap-target slack to fit more on
screen.

Do **not** make a whole product compact by default. Apply it to the dense
region only, and keep the surrounding shell comfortable.

## How to apply compact

Compact is a **local override**, not a token swap. Scope tighter spacing
to the dense subtree with utilities — the semantic color tokens are
unchanged, only the spacing scale tightens:

| Aspect              | Comfortable           | Compact                 |
| ------------------- | --------------------- | ----------------------- |
| Control padding     | `px-3 py-2`           | `px-2 py-1`             |
| Row height (tables) | `h-12`                | `h-9`                   |
| Card padding        | `p-4`–`p-6`           | `p-2`–`p-3`             |
| Section rhythm      | `space-y-6`           | `space-y-2`–`space-y-3` |
| Font size           | `text-sm`/`text-base` | `text-xs`/`text-sm`     |

If you find yourself applying the same compact overrides across many
elements, lift them into a single wrapper class rather than repeating them
inline:

```css
/* In a scoped stylesheet or a component layer. The container opts its
   subtree into compact spacing; color tokens are untouched. */
.density-compact :where(button, [role='menuitem'], td, th) {
  padding-block: 0.25rem;
}
```

```tsx
<section className="density-compact">{/* dense table or log view */}</section>
```

## Component-level implications

- **Tables and lists** are the primary beneficiaries — compact rows let an
  operator scan more without scrolling.
- **Forms** should stay comfortable even in a dense app: input precision
  and tap targets matter more than row count.
- **Tap targets never shrink below the accessibility floor**, even in
  compact. If a compact control would fall under 44×44px of hit area, keep
  the visual size small but extend the hit area with padding or a
  pseudo-element.
- **Don't mix densities within one scannable group** — a table with some
  compact and some comfortable rows reads as broken alignment.

## Anti-patterns

- ❌ Making the entire app compact "to look professional." Comfortable is
  the trustworthy default; compact is a tool for genuinely dense data.
- ❌ Overriding color tokens as part of a density change. Density is
  spacing and sizing only — see [`tokens.md`](./tokens.md).
- ❌ Dropping interactive hit areas below the 44px floor to save space.
