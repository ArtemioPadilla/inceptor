# Primitives

`gallery.ts` category: `primitives`. This category bundles six components
(Button, Input, Label, Card, Table, Badge) under `src/components/ui/`.
**Coverage in this file: Button only** — the rest are plain, low-risk
wrappers around native elements; read them directly if needed, they rarely
surprise an agent. This file will grow as coverage expands.

---

## Button

Source: [`src/components/ui/button.tsx`](../../src/components/ui/button.tsx)

**Purpose**: The single button primitive for the whole app — every other
button-like control (`DialogClose`, `DropdownMenuTrigger` rendered as a
button, etc.) composes this one via `render`/`asChild`, not a second
implementation.

**When to use**: Any clickable action that isn't a link to another page. If
it navigates, use an `<a>`/Astro `<Link>`-style element instead (or `asChild`
with an anchor — see below) so screen readers announce it correctly.

**API overview**:

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

- `variant`: `'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'`
  (default `'default'`).
- `size`: `'default' | 'sm' | 'lg' | 'icon'` (default `'default'`).
- `asChild`: when `true`, Button clones its single child element instead of
  rendering its own `<button>` — merges `className` and forwards `ref`. Use
  this to make an `<a>` or another component look like a Button without
  nesting an interactive element inside one (an axe/a11y violation).
- All native `<button>` props pass through (`onClick`, `disabled`, `type`,
  `aria-*`, etc.).

**Common mistakes**:

- Nesting a `<Button>` inside another interactive element (a `role="button"`
  div, another `<button>`) instead of using `asChild` — trips axe's
  nested-interactive rule (see `file-upload.tsx`'s comment on the exact same
  class of bug for the dropzone pattern).
- Forgetting `type="button"` on a Button that lives inside a `<form>` but
  isn't the submit action — it defaults to the native `<button>` behavior
  (`type="submit"` when unset inside a form), which will submit the form on
  click.
- Importing Radix's `Slot` instead of using the `asChild` prop as implemented
  here — this file's `Slot` is a **hand-rolled**, Radix-free implementation
  specifically to keep the project Radix-free (see CLAUDE.md rule #4). Don't
  swap it for `@radix-ui/react-slot`.
