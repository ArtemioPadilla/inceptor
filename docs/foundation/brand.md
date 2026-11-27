# Brand

## Purpose

[`tokens.md`](./tokens.md) and [`theming.md`](./theming.md) explain how colour
works in the scaffold. This page is the other half: a **template** a project
instanced from Inceptor fills in to record what its brand is. Copy it to your
project (for example `docs/brand.md`), replace every `…`, and record the
decision in an ADR (`docs/decisions/TEMPLATE.md`).

Write it before the second person touches the UI. The questions are cheap to
answer once and expensive to rediscover from the CSS.

If this page and `src/styles/global.css` disagree, the CSS wins and the page
is wrong: fix the page.

## Palette

One row per colour the brand owns. Neutrals (background, border, muted text)
stay the scaffold's unless you change them on purpose.

| Colour | Hex | Token (`global.css`) | Text on it | What it is for                                       |
| ------ | --- | -------------------- | ---------- | ---------------------------------------------------- |
| …      | `…` | `--primary`          | …          | The action colour: buttons, active links, focus ring |
| …      | `…` | `--…`                | …          | …                                                    |

State how each colour changes in dark mode (the scaffold's convention: the
primary gets lighter and carries dark text).

In components use the Tailwind classes the tokens generate
(`bg-primary text-primary-foreground`), never a hex value.

To add a brand colour beyond the primary, declare the fill and its text
together, once, with `light-dark()`:

```css
:root {
  --brand-x: light-dark(oklch(…), oklch(…));
  --brand-x-foreground: light-dark(oklch(…), oklch(…));
}
@theme inline {
  --color-brand-x: var(--brand-x);
  --color-brand-x-foreground: var(--brand-x-foreground);
}
```

## Usage rules

Keep the ones that apply and add your own.

1. **One action colour.** If everything is the primary, nothing is: one
   primary button per screen.
2. **Supporting colours are fills.** They paint one block, never body text on
   the page background and never a hairline border.
3. **Colour is never the only message.** A level, a state or an error reads
   in the text; the colour only accompanies it (WCAG 1.4.1).
4. **Contrast.** Text ≥ 4.5:1 and components ≥ 3:1 in both themes.
   `src/tests/ux-contrast.test.ts` guards the token pairs: a new text token
   goes in there.

## Colours we do not use

The most useful table on the page, and the one nobody writes down. For each
colour the brand avoids, say why: a competitor owns it, it means something in
your market, or the product reserves it for a state.

| Colour | Why not |
| ------ | ------- |
| …      | …       |

Questions that fill it in:

- Which colours do the closest competitors, and anything users could confuse
  you with, already own?
- Does a colour carry a meaning in your market or country that the product
  must not claim (approval, danger, an official body)?
- Which hues are reserved for states (`--destructive`, success, warning)? The
  brand should stay away from them.

The scaffold's default primary is emerald. A green brand reads as "approved"
or "safe" in many contexts: decide on purpose whether to keep it
(issue #326 proposes an `--accent` flag on `scripts/init.mjs` to re-brand at
instantiation).

## Type

| Use     | Family | Weights | Token            |
| ------- | ------ | ------- | ---------------- |
| Display | …      | …       | `--font-display` |
| Text    | …      | …       | `--font-sans`    |
| Data    | …      | …       | `--font-mono`    |

## Logo

| File                 | Use                                    |
| -------------------- | -------------------------------------- |
| `…`                  | Mark alone                             |
| `public/favicon.svg` | Icon                                   |
| `…`                  | Maskable icon, touch icon, share image |

State the rules in one paragraph: what the mark stands for, the smallest size
it must survive (check it at 16 px), which version goes on coloured
backgrounds, and what may not be done to it. A mark that only works in colour
fails in print, forced colours and for colour-blind users: check it in one
ink.

### Handing the logo to someone outside the repo

`npm run brand:kit` builds `brand-kit/` (git-ignored) and a zip from
`brand-kit.config.json`: horizontal, stacked, symbol and wordmark, each in
colour, negative and one ink, as SVG, PNG and JPG, plus a brand sheet. The
lettering is converted to outlines, so nobody needs the font. Every variant
is derived from the one symbol file; a hand-tuned one-ink symbol is accepted
only while it stays within `oneInk.allowance` of the colour geometry. Write
the differences that are on purpose (a simplified favicon, for example) in
`notes`: they are printed on the sheet. Recipe:
[`docs/recipes/brand-kit.md`](../recipes/brand-kit.md).

## Open items

- …
