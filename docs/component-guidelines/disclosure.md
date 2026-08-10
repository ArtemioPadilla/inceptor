# Disclosure & layout

`gallery.ts` category: `disclosure` — Accordion, Collapsible, Avatar,
Skeleton, Separator, Scroll area, Aspect ratio. **Coverage in this file:
Accordion only.**

---

## Accordion

Source: [`src/components/ui/accordion.tsx`](../../src/components/ui/accordion.tsx)

**Purpose**: Expand/collapse panels, built on
`@base-ui-components/react/accordion`.

**When to use**: Progressive disclosure of grouped content the user opens on
demand (FAQs, settings sections). For a single expand/collapse toggle with
no grouping semantics, `Collapsible` (same category, not yet covered here) is
lighter-weight.

**API overview**:

```tsx
<Accordion type="single" collapsible defaultValue="item-1">
  <AccordionItem value="item-1">
    <AccordionTrigger>Section title</AccordionTrigger>
    <AccordionContent>Panel content</AccordionContent>
  </AccordionItem>
</Accordion>
```

- `Accordion` = `BaseAccordion.Root` — accepts Base UI's own props directly
  (`type: 'single' | 'multiple'`, `collapsible`, `value`/`onValueChange` or
  `defaultValue`); this wrapper adds no extra abstraction on top of Root.
- `AccordionTrigger` renders inside a `BaseAccordion.Header` internally — you
  don't add the header yourself, just `AccordionTrigger` directly inside
  `AccordionItem`.
- `AccordionContent`'s open/close animation reads a CSS custom property,
  `--accordion-panel-height`, set by Base UI at runtime — don't hardcode a
  fixed height on it or you'll break the animation.

**Common mistakes**:

- Nesting `AccordionTrigger` inside your own header wrapper — the component
  already provides `BaseAccordion.Header` internally; adding another wrapping
  header element around it is redundant and can break the flex layout
  (`AccordionTrigger`'s trigger button expects to be the header's only flex
  child).
- Forgetting `type="single"` needs `collapsible` if you want the open item to
  be closable by clicking it again — without `collapsible`, a single-type
  Accordion always keeps exactly one item open once one has been opened.
- Same island rule as every compound component here — `Accordion` +
  `AccordionItem` + `AccordionTrigger` + `AccordionContent` must live in one
  island file if used inside an Astro page.
