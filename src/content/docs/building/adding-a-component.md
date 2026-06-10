---
title: Adding a component
description: "Two paths: shadcn CLI for primitive-free, hand-write for interactive Base UI."
---

There are two paths depending on whether the component needs an interactive
primitive (popover, focus trap, portal, etc.).

## Path A — CLI (primitive-free components)

Use this for: `button`, `input`, `label`, `card`, `table`, `badge`, and any component
that is pure styling with no interaction primitive.

```bash
npx shadcn@latest add <name> --yes
```

The CLI places the component in `src/components/ui/<name>.tsx` and updates
`components.json`. After running, check for Radix imports immediately:

```bash
grep -r '@radix-ui' src/components/ui/
```

**Any hit means the component pulled in a Radix primitive.** The default shadcn
registry is Radix-based. If you see a Radix import, discard the file and use Path B.

## Path B — Hand-written with Base UI (interactive primitives)

Use this for: `dialog`, `dropdown-menu`, `tabs`, `toast`, `form`, and any component
that requires a focus trap, portal, controlled open/close, or keyboard navigation primitive.

**Why Base UI instead of Radix?** We chose `@base-ui-components/react` as our
primitive layer. Mixing Radix and Base UI in a single component is forbidden
([ADR 0002](/docs/decisions/0002-base-ui-over-radix/)).

### How to write a Base UI wrapper

1. Import the primitive from `@base-ui-components/react/<primitive>`.
2. Map Base UI sub-components to the shadcn API names consumers expect.
3. Apply `cn()` with the same Tailwind classes the shadcn registry uses.
4. Export named exports matching the shadcn API.

`src/components/ui/dialog.tsx` is the canonical example — it exports `Dialog`,
`DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`,
`DialogDescription`, `DialogClose`, `DialogOverlay`, and `DialogPortal`.

Key Base UI differences vs Radix:

- Base UI uses a `render` prop instead of `asChild`:
  ```tsx
  <DialogTrigger render={<Button variant="outline" />}>Open</DialogTrigger>
  ```
- Base UI uses `data-[starting-style]` / `data-[ending-style]` for CSS-driven
  enter/exit animations instead of `data-[state=open|closed]`.

## After adding either path

1. **Check for Radix imports** — `grep -r '@radix-ui' src/components/ui/` must return nothing.
2. **Add a test** — `src/components/ui/<name>.test.ts` with at least an export assertion.
3. **Add to `/gallery`** — update `src/content/gallery.ts` so the component appears in the gallery.
4. **Add to `/showcase`** if it deserves a composed demo — create a `ShowcaseFoo.tsx` island.

Full guide → [`docs/COMPONENTS.md §2`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/COMPONENTS.md#2-adding-a-shadcn-component)
