# Foundation

The foundation is the layer beneath the components: the tokens, density,
layout rules, theming model, and accessibility baseline that every
component and page in Inceptor is built on. When you are about to make a
foundation-level decision — _"which spacing scale is normative?"_, _"how
do I support dark mode here?"_, _"is this contrast good enough?"_ — this
section is the canonical answer, so you don't have to reverse-engineer it
from component source.

Source roadmap: [`docs/CLOUDSCAPE-GAP-ROADMAP.md`](../CLOUDSCAPE-GAP-ROADMAP.md)
(Horizon 1).

## Pages

| Page                                     | Answers                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| [`tokens.md`](./tokens.md)               | What the semantic tokens are, how to use them, and the anti-patterns to avoid.  |
| [`density.md`](./density.md)             | Comfortable vs compact, and how density maps onto spacing and component sizing. |
| [`layout.md`](./layout.md)               | Page regions, spacing rhythm, and responsive behavior.                          |
| [`theming.md`](./theming.md)             | The light/dark model and how the CSS-variable layering works.                   |
| [`accessibility.md`](./accessibility.md) | The keyboard, focus, and contrast baseline — what is mandatory vs optional.     |

## How the foundation is wired

Everything below maps to real files — there is no parallel design system:

- **Tokens** live as CSS custom properties in
  [`src/styles/global.css`](../../src/styles/global.css) (`:root`/`.light`
  and `.dark` blocks), exposed to Tailwind v4 utilities through the
  `@theme inline` block in the same file.
- **Theming** is the `.dark` / `.light` class model, driven at runtime by
  the [`src/stores/theme.ts`](../../src/stores/theme.ts) Nano Store.
- **Accessibility** decisions are enforced by tests:
  [`src/tests/ux-contrast.test.ts`](../../src/tests/ux-contrast.test.ts),
  the axe pass in [`tests/visual/a11y.spec.ts`](../../tests/visual/a11y.spec.ts),
  and [`tests/visual/keyboard-nav.spec.ts`](../../tests/visual/keyboard-nav.spec.ts).

If a foundation rule is not reflected in one of those files, treat the
file as the source of truth and fix the doc.
