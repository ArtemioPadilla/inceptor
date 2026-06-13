# Tokens

Inceptor styles everything through **semantic tokens** — named roles like
`background`, `primary`, or `muted-foreground` — never raw colors. The
tokens are CSS custom properties defined once in
[`src/styles/global.css`](../../src/styles/global.css) and exposed to
Tailwind v4 utilities through the `@theme inline` block in the same file.

Using a token instead of a literal is what makes light/dark mode, theming,
and contrast guarantees work automatically. A `bg-card text-card-foreground`
element is correct in both modes for free; a `bg-white text-black` element
is a dark-mode bug waiting to happen.

## The semantic color tokens

Each token is a **pair**: a surface and the foreground that is guaranteed
to read on it. Always use them together.

| Token                                    | Utility                                      | Use for                                                            |
| ---------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| `background` / `foreground`              | `bg-background text-foreground`              | The page canvas and its default text.                              |
| `card` / `card-foreground`               | `bg-card text-card-foreground`               | Raised surfaces — cards, panels, sheets.                           |
| `popover` / `popover-foreground`         | `bg-popover text-popover-foreground`         | Floating surfaces — menus, popovers, tooltips.                     |
| `primary` / `primary-foreground`         | `bg-primary text-primary-foreground`         | The main action color (emerald). Primary buttons, active states.   |
| `secondary` / `secondary-foreground`     | `bg-secondary text-secondary-foreground`     | Secondary actions and quiet fills.                                 |
| `muted` / `muted-foreground`             | `bg-muted text-muted-foreground`             | De-emphasized surfaces and secondary text.                         |
| `accent` / `accent-foreground`           | `bg-accent text-accent-foreground`           | Hover/selected highlights.                                         |
| `destructive` / `destructive-foreground` | `bg-destructive text-destructive-foreground` | Dangerous or irreversible actions.                                 |
| `border` / `input` / `ring`              | `border-border`, `border-input`, `ring-ring` | Hairlines, control borders, and focus rings.                       |
| `chart-1` … `chart-5`                    | `fill-chart-1`, `stroke-chart-2`, …          | Data-viz series. Same hues across modes; only lightness shifts.    |
| `sidebar*`                               | `bg-sidebar`, `text-sidebar-foreground`, …   | The app-shell navigation surface (see [`layout.md`](./layout.md)). |

### Color space

Tokens are authored in **OKLch** (`oklch(L C H)` — lightness, chroma,
hue), chosen because it is perceptually uniform: equal numeric steps look
like equal visual steps, which makes contrast tuning reliable. The brand
hue is emerald (`H ≈ 163`). You rarely touch raw values — reach for the
semantic utility instead.

## Radius

A single `--radius` (`0.625rem`) seeds a scale via `@theme inline`:

| Utility      | Value            |
| ------------ | ---------------- |
| `rounded-sm` | `--radius - 4px` |
| `rounded-md` | `--radius - 2px` |
| `rounded-lg` | `--radius`       |
| `rounded-xl` | `--radius + 4px` |

Change the look of the whole product by editing the one `--radius`
declaration; everything downstream follows.

## Typography

Three font roles are registered in the `@theme` block and loaded in
`BaseLayout`:

| Role    | Utility        | Family           | Use for                                  |
| ------- | -------------- | ---------------- | ---------------------------------------- |
| Display | `font-display` | Fraunces (serif) | Headlines and hero type.                 |
| Body    | `font-sans`    | Hanken Grotesk   | All UI and prose. The default on `body`. |
| Mono    | `font-mono`    | JetBrains Mono   | Code, tokens, and tabular figures.       |

## Anti-patterns

- ❌ **Literal colors** — `bg-white`, `text-black`, `bg-[#10b981]`,
  `text-gray-500`. They don't flip in dark mode and bypass the contrast
  guarantees. ✅ Use the semantic token (`bg-card`, `text-muted-foreground`).
- ❌ **Mismatched pairs** — `bg-primary text-foreground`. The foreground
  isn't guaranteed to read on that surface. ✅ Use the paired foreground
  (`bg-primary text-primary-foreground`).
- ❌ **A parallel palette** — introducing a new raw color or a second set
  of variables for one feature. ✅ Add a semantic token to `global.css` if
  a genuinely new role exists; otherwise reuse an existing one.
- ❌ **Hardcoding the brand hue** — `oklch(0.50 0.123 163)` inline. ✅
  Reference `--primary` / `bg-primary`.

## Practical example

A status card that is correct in light and dark mode, with no literal
colors:

```tsx
<div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
  <h3 className="font-display text-lg">Deployment</h3>
  <p className="text-sm text-muted-foreground">Last run 4 minutes ago</p>
  <button className="mt-3 rounded-md bg-primary px-3 py-1.5 text-primary-foreground">
    Redeploy
  </button>
</div>
```

Adding a new token? Define it in **both** the `:root`/`.light` and `.dark`
blocks of `global.css`, then map it under `@theme inline`. The contrast of
any new `surface`/`surface-foreground` pair must clear the bar in
[`accessibility.md`](./accessibility.md).
