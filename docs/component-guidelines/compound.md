# Compound components

`gallery.ts` category: `compound` — Dialog, Dropdown menu, Tabs, Toast, Form.
**Coverage in this file: all five** — this is the highest-risk category for
an agent to get wrong, because every component here shares internal state
across its sub-parts and **must be wrapped in a single React file under
`src/components/islands/` and hydrated as one island** (CLAUDE.md's
"compound-component gotcha" — read that section in full before touching any
component below; it is not repeated per-component here beyond a pointer).

All five are built on `@base-ui-components/react`, never `@radix-ui/*` — see
CLAUDE.md rule #4. If you're translating shadcn/Radix examples from the
public docs, expect two systematic API differences everywhere below:

- `asChild` (Radix) → `render={<Component />}` (Base UI).
- `data-[state=open|closed]` (Radix) → `data-[starting-style]` /
  `data-[ending-style]` for enter/exit animation hooks (Base UI).

---

## Dialog

Source: [`src/components/ui/dialog.tsx`](../../src/components/ui/dialog.tsx)

**Purpose**: Modal dialog — traps focus, dismisses on ESC/backdrop click,
renders through a portal.

**When to use**: Anything that must interrupt the user and block the rest of
the page (confirmation, a focused form, critical info). For non-blocking
contextual info anchored to a trigger element, use `Popover` or `HoverCard`
instead (see [`overlays.md`](./overlays.md)).

**API overview**:

```tsx
<Dialog>
  <DialogTrigger render={<Button variant="outline" />}>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose render={<Button />}>Confirm</DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- `Dialog` = `BaseDialog.Root` (controlled via `open`/`onOpenChange`, or
  uncontrolled by default).
- `DialogContent` internally renders its own `DialogOverlay` + portal — you
  do **not** need to add `DialogOverlay` yourself; it's wired in
  automatically inside `DialogContent`.
- `DialogHeader`/`DialogFooter` are plain styled `<div>`s, no Base UI
  mapping — safe to replace with your own markup if the layout doesn't fit.
- `DialogTrigger`/`DialogClose` use the `render` prop (not `asChild`) to
  render as a `<Button>` instead of Base UI's default trigger element.

**Common mistakes**:

- Splitting `<DialogTrigger>` and `<DialogContent>` across two `client:*`
  directives in an `.astro` page — the single most common mistake in this
  codebase per CLAUDE.md; each `client:*` is a separate React root and
  cannot share the Dialog's open state.
- Using `asChild` instead of `render={<Button />}` — copy-pasting from
  upstream shadcn/Radix docs verbatim silently fails to compile (or worse,
  silently no-ops) since this file has no `asChild` prop.
- Manually adding a second overlay/backdrop — `DialogContent` already
  includes one; a second `DialogOverlay` usage stacks two backdrops.

---

## Form

Source: [`src/components/ui/form.tsx`](../../src/components/ui/form.tsx)

**Purpose**: react-hook-form's `FormProvider` + `Controller`, wired to Base
UI's `Field` primitive for label→control→error a11y linking. Two **intra-
island** React Contexts (`FormFieldContext`, `FormItemContext`) pass the
current field name down to `FormLabel`/`FormControl`/`FormDescription`/
`FormMessage` — this is the one place in the codebase where
`React.createContext` is correct and expected (CLAUDE.md's prohibition is
specifically about state shared *across* islands, not within one).

**When to use**: Any form with Zod-schema validation. If you just need a
single ad-hoc input with no schema, plain `<Input>`/`<Label>` without `<Form>`
is fine and lighter-weight.

**API overview**:

```tsx
const form = useForm<Schema>({ resolver: zodResolver(schema) });

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormDescription>We'll never share it.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

- `Form` = `FormProvider` (react-hook-form), re-exported under the shadcn
  name for API parity — pass `{...form}` from `useForm()`.
- `FormField` wraps `Controller`; `name` must be a valid `FieldPath` of your
  schema's inferred type (TypeScript enforces this).
- `FormControl` uses `React.cloneElement` (not Base UI's `Field.Control`,
  which can't accept a custom child element without crashing SSR) to inject
  `aria-invalid` + the field's a11y wiring into **exactly one** child
  element.
- `FormMessage` renders react-hook-form's validation error automatically —
  don't also manually render `formState.errors.field?.message` next to it,
  you'll get the message twice.
- `useFormField()` throws if called outside a `<FormField>` — that's
  intentional, it's the guard against a missing context provider.

**Common mistakes**:

- Defining the Zod schema inline instead of in `src/schemas/` — cross-
  boundary types (and form fields count, per CLAUDE.md's forbidden-actions
  list item 8) must derive from a `z.infer<>` in `src/schemas/`, never a
  hand-written `interface`.
- Giving `FormControl` more than one child — `cloneElement` only clones the
  first/only child; wrapping two elements inside `<FormControl>` silently
  drops the a11y wiring on the second.
- Forgetting the whole `<Form>` tree must be one island (compound-component
  gotcha) — see `ShowcaseForm.tsx` for the canonical single-island example.

---

## DropdownMenu

Source: [`src/components/ui/dropdown-menu.tsx`](../../src/components/ui/dropdown-menu.tsx)

**Purpose**: Anchored, portal-rendered menu with items, checkbox items, radio
items, submenus, and separators — built on `@base-ui-components/react/menu`.

**When to use**: A list of actions or a small set of mutually-exclusive/
independent toggles anchored to a trigger (a "⋮" button, a column-visibility
toggle — see `DataTable`'s own "Columns" menu in
[`data.md`](./data.md)). For form-embedded single-select, prefer `Select`.

**API overview**:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger render={<Button variant="outline" />}>Open</DropdownMenuTrigger>
  <DropdownMenuContent align="end" side="bottom">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={...}>Edit</DropdownMenuItem>
    <DropdownMenuCheckboxItem checked={visible} onCheckedChange={setVisible}>
      Show column
    </DropdownMenuCheckboxItem>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>Nested action</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  </DropdownMenuContent>
</DropdownMenu>
```

- `DropdownMenuContent` accepts `align: 'start' | 'center' | 'end'` and
  `side: 'top' | 'right' | 'bottom' | 'left' | 'inline-end' | 'inline-start'`,
  forwarded straight to Base UI's `Menu.Positioner` — this is how
  `DataTable`'s column-visibility menu pins itself to `align="end"`.
- `DropdownMenuCheckboxItem`/`DropdownMenuRadioItem` are **controlled** —
  you own `checked`/`onCheckedChange` (or the `DropdownMenuRadioGroup`'s
  `value`/`onValueChange`) yourself; there's no internal toggle state.
- `DropdownMenuSub` + `DropdownMenuSubTrigger` + `DropdownMenuSubContent`
  build a nested flyout submenu.

**Common mistakes**:

- Same island-splitting mistake as Dialog — trigger and content must be in
  one island.
- Forgetting `DropdownMenuCheckboxItem` needs you to flip the checked state
  yourself in `onCheckedChange` — it doesn't self-toggle; the callback
  receives the *new* desired value, you decide what to do with it.
- Using it for navigation links — DropdownMenu items are action triggers
  (`onSelect`), not `<a>` replacements; for a navigation surface use
  `navigation-menu.tsx` instead.

---

## Tabs

Source: [`src/components/ui/tabs.tsx`](../../src/components/ui/tabs.tsx)

**Purpose**: Tabbed panel switcher on `@base-ui-components/react/tabs`.

**When to use**: Switching between mutually-exclusive views of *related*
content that's cheap to keep mounted (all panels render; only the active
one is visible via Base UI's internal handling — don't assume lazy mounting
unless you've verified it).

**API overview**:

```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">One</TabsTrigger>
    <TabsTrigger value="tab2">Two</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Panel one</TabsContent>
  <TabsContent value="tab2">Panel two</TabsContent>
</Tabs>
```

- `Tabs` accepts `value`/`onValueChange` (controlled) or `defaultValue`
  (uncontrolled) — same convention as every other compound component here.
- `TabsTrigger`'s `value` must match a sibling `TabsContent`'s `value`
  exactly (string equality) or that panel never shows.

**Common mistakes**:

- Same island-splitting mistake — the whole `Tabs`/`TabsList`/`TabsContent`
  tree is one compound component, one island.
- Mismatched `value` strings between `TabsTrigger` and `TabsContent` (a typo
  in one but not the other) — fails silently, the tab just never activates
  its panel; no runtime warning.

---

## Toast

Source: [`src/components/ui/toast.tsx`](../../src/components/ui/toast.tsx)

**Purpose**: Transient, auto-expiring notification, driven **imperatively**
(not by rendering JSX per-toast) via `@base-ui-components/react/toast`'s
`createToastManager()`.

**When to use**: Fire-and-forget confirmation of an action ("Saved",
"Copied to clipboard") that doesn't need to persist. For a notification that
should stay visible until the user dismisses it or an action resolves it
(e.g. "Save failed — here's why"), use `Flashbar` instead (see
[`feedback.md`](./feedback.md)) — that's the deliberate distinction the
`Flashbar` source comment draws.

**API overview**:

```tsx
// Once, near the root of the island tree that needs toasts:
<Toaster />

// Anywhere else in the same island (or a module that only runs client-side):
import { toast } from '@/components/ui/toast';
toast({ title: 'Saved', description: 'Your changes were saved.' });
toast({ title: 'Error', description: 'Something went wrong.', data: { variant: 'destructive' } });
```

- `Toaster` mounts the `Provider` + `Viewport` pair — place it **once** per
  island tree that needs toasts, not once per call site. The imperative
  `toast()` call must originate from a component rendered **within the same
  React tree** as the `<Toaster>` (same `Provider` instance) — calling it
  from an unrelated island whose tree never mounted a `<Toaster>` is a no-op.
- `toast(options)` is the imperative entry point — `options` matches
  `toastManager.add()`'s parameters (`title`, `description`,
  `data: { variant }`).
- `ToastData.variant`: `'default' | 'destructive'` — passed through
  `data.variant`, not a top-level `variant` prop (Base UI stores custom data
  under `.data`).

**Common mistakes**:

- Rendering `<ToastRoot>`/`<ToastTitle>` JSX yourself per notification
  instead of calling the imperative `toast()` function — this component's
  entire design is "call a function, don't render a component per toast."
- Mounting more than one `<Toaster>` in the same island tree — you'll get
  duplicate toasts (each `Toaster` subscribes to the same shared
  `toastManager`).
- Setting `variant` as a top-level prop on `toast({ variant: 'destructive' })`
  instead of nesting it — check the source: it reads
  `toast.data?.variant`, so pass `data: { variant: 'destructive' }` if
  calling `toastManager.add` directly (the `toast()` convenience re-export
  forwards whatever shape you give it verbatim).
