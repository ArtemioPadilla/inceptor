# Overlays

`gallery.ts` category: `overlays` — Tooltip, Popover, Alert dialog,
Hover card, Context menu, all anchored/portal popups on
`@base-ui-components/react`. **Coverage in this file: Tooltip only.**

---

## Tooltip

Source: [`src/components/ui/tooltip.tsx`](../../src/components/ui/tooltip.tsx)

**Purpose**: A hover/focus-triggered label anchored to a trigger element,
built on `@base-ui-components/react/tooltip`.

**When to use**: A short supplementary label for an element whose meaning
isn't already obvious from its own text (e.g. an icon-only button). Not for
content the user must interact with — Tooltip content isn't reliably
focusable/clickable across input methods; if the popup needs interactive
content, use `Popover` instead.

**API overview**:

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger render={<Button variant="ghost" size="icon" />}>
      <InfoIcon />
    </TooltipTrigger>
    <TooltipContent sideOffset={6}>Explains the icon</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

- `TooltipProvider` wraps the app or a section **once** — it's
  `BaseTooltip.Provider`, shared across every `Tooltip` inside it (controls
  things like shared open/close delay timing across nearby tooltips).
- `TooltipContent`'s `sideOffset` defaults to `6` (px gap from the trigger).
- Uses `render` (not `asChild`) to make `TooltipTrigger` render as another
  element — same Base UI convention as every compound component in this
  library.

**Common mistakes**:

- Omitting `TooltipProvider` — `Tooltip`/`TooltipTrigger`/`TooltipContent`
  depend on context it establishes; without it the tooltip won't position or
  time correctly.
- Wrapping every individual `<Tooltip>` in its own `<TooltipProvider>` — one
  Provider per page/section is the intended pattern, not one per tooltip
  instance.
- Putting interactive controls (buttons, links, form fields) inside
  `TooltipContent` — expected to fail for touch/keyboard users since
  tooltips aren't designed to hold focus. Reach for `Popover` instead.
