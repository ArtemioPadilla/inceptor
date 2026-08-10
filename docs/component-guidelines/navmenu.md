# Navigation & menus

`gallery.ts` category: `navmenu` — Combobox, Command palette (⌘K),
Navigation menu, Menubar, Stepper, all under `src/components/ui/`.
**Coverage in this file: Combobox, Command palette, Menubar.**

---

## Combobox

Source: [`src/components/ui/combobox.tsx`](../../src/components/ui/combobox.tsx)

**Purpose**: A typeahead single-select with built-in text filtering, built on
`@base-ui-components/react/combobox` (not Radix). This is the **high-level**
wrapper — it takes a flat `string[]`, not a render-prop-driven item API.

**When to use**: Choosing one value out of a list large/open enough that the
user benefits from filtering as they type (e.g. picking a repo, a timezone, a
country). For a small closed set with no need to filter, use `Select`
instead (see [`forms.md`](./forms.md)) — it's simpler and has no search
input to trip over.

**API overview**:

```tsx
interface ComboboxProps {
  items: string[];
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;    // default 'Search…'
  emptyMessage?: string;   // default 'No results.'
  className?: string;
}
```

- **`items` is `string[]` only** — this wrapper does not support
  `{ label, value }` object items or async/remote filtering. If you need
  either, you'll need to drop down to `@base-ui-components/react/combobox`
  directly (Base UI's own `Combobox.Root` accepts arbitrary item shapes and
  `itemToStringLabel`) rather than extending this wrapper's narrow surface in
  place — check with a human before widening a shared primitive like this.
- Controlled component: pass `value` + `onValueChange`; there's no
  uncontrolled/`defaultValue` escape hatch in this wrapper.
- Filtering is client-side and built into Base UI's `Combobox.Root` — you do
  not need to filter `items` yourself before passing them in.

**Common mistakes**:

- Passing object items (`{ id, label }`) expecting the wrapper to handle
  them — it stringifies whatever `items` you pass and uses the string both
  as the display label and the `value`. Map to `string[]` before calling.
- Expecting async loading — there's no `loading` state or debounced fetch
  hook here; this is a synchronous, client-side-filtered list only.
- Treating it as a free-text input — `onValueChange` only fires with an item
  from `items` (or `null`), never arbitrary typed text; it's a select, not a
  text field with suggestions.

### Keyboard

Inherited unmodified from `@base-ui-components/react/combobox`'s root +
input parts (verified against the installed package's source — not the
Radix combobox pattern, which this repo doesn't use). ROADMAP Epic 18
keyboard-navigation contract table format.

| Key | Description |
|---|---|
| <kbd>↓</kbd> / <kbd>↑</kbd> | Move the highlighted item in the open popup list (Base UI's shared `useListNavigation`, the same list-navigation primitive `DropdownMenu`/`Menubar` use — see [`compound.md`](./compound.md)). |
| <kbd>Enter</kbd> | Select the highlighted item and close the popup. If no item is highlighted, allows normal form submission instead of swallowing the key. |
| <kbd>Esc</kbd> | Close the popup. If nothing is selected yet, also clears the query text. |
| <kbd>Home</kbd> / <kbd>End</kbd> | Move the text caret to the start/end of the typed query — this is native `<input>` text-cursor behavior, **not** "jump to first/last item" (don't confuse it with the `Home`/`End` list-navigation convention `DropdownMenu`/`Menubar` use). |
| *(typing)* | Filters `items` live, built into `Combobox.Root` — you never filter `items` yourself before passing them in. |

---

## Command palette

Source: [`src/components/ui/command-palette.tsx`](../../src/components/ui/command-palette.tsx)

**Purpose**: A searchable action launcher (⌘K) built on Base UI's `Dialog`
primitive with a hand-rolled, manually-filtered `<ul>`/`<button>` list —
**not** Base UI's Combobox. Opens on ⌘K / Ctrl+K (registered globally via a
`document`-level `keydown` listener) or under external control.

**When to use**: A global "jump to any action" launcher for a dashboard or
admin console with enough commands/pages that browsing a menu tree is
slower than typing to filter. Not a replacement for `Combobox` (a bound
single-select form field) or `DropdownMenu` (a small, positioned menu next
to its trigger).

**API overview**:

```tsx
interface CommandItem {
  label: string;
  hint?: string;
  onSelect?: () => void;
}

interface CommandPaletteProps {
  items: CommandItem[];
  placeholder?: string;    // default 'Type a command or search…'
  shortcut?: boolean;      // default true — registers the ⌘K / Ctrl+K global shortcut
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

- Filtering is a plain `.filter()` over `items` on every keystroke (case-
  insensitive substring match on `label`) — not Base UI's Combobox
  filtering, since this component doesn't use `Combobox.Root` at all.
- `shortcut={false}` if you're mounting more than one `CommandPalette` on a
  page, or want to trigger it from your own keybinding instead — otherwise
  every mounted instance registers its own `document` `keydown` listener and
  they'll all toggle open together.

**Common mistakes**:

- Mounting `CommandPalette` more than once with `shortcut` left at its
  default `true` — each instance adds its own global listener; ⌘K then
  toggles all of them at once. Set `shortcut={false}` on every instance but
  one, or control `open` externally from a single source.
- Forgetting `onSelect` on an item — clicking it still closes the palette
  and clears the query (that part always happens), it just does nothing
  else. Not a bug, but easy to mistake for one while wiring up commands.

### Keyboard

| Key | Description |
|---|---|
| <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> | Toggle the palette open/closed, from anywhere on the page (when `shortcut` is `true`, the default). |
| <kbd>Esc</kbd> | Close the palette — Base UI `Dialog`'s default dismiss behavior (this component doesn't add its own Escape handler). |
| <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> | Move focus between the search `<input>` and each result `<button>` — native tab order; there is **no** arrow-key roving-highlight over the result list (unlike `Combobox`'s Base UI-provided list navigation above). |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Activate the focused result `<button>` — calls `onSelect`, closes the palette, clears the query. |
| *(typing)* | Filters `items` live (the search input has `autoFocus` when the palette opens). |

---

## Menubar

Source: [`src/components/ui/menubar.tsx`](../../src/components/ui/menubar.tsx)

**Purpose**: A desktop-app-style menu bar (File / Edit / View…) built on
Base UI's `Menubar` primitive wrapping per-menu `Menu.Root` instances — the
same `Menu` primitive `DropdownMenu` uses (see [`compound.md`](./compound.md)),
composed side-by-side under one roving-focus container.

**When to use**: A persistent, always-visible row of top-level menus (dense
admin-tool chrome). For a single anchored menu triggered by one button, use
`DropdownMenu` instead — `Menubar` is specifically for **multiple**
top-level menus that share horizontal keyboard navigation between them.

**API overview**:

```tsx
// Menubar, MenubarMenu (= Menu.Root), MenubarTrigger, MenubarContent,
// MenubarItem, MenubarSeparator
<Menubar>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem onClick={...}>New</MenubarItem>
      <MenubarSeparator />
      <MenubarItem onClick={...}>Open…</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>Edit</MenubarTrigger>
    <MenubarContent>{/* ... */}</MenubarContent>
  </MenubarMenu>
</Menubar>
```

- `Menubar` renders `orientation="horizontal"` and `loopFocus={true}`
  (Base UI defaults, not overridden here) — see the Keyboard table below
  for what that actually means for navigation.
- Per the compound-component rule (`docs/COMPONENTS.md` §4): the whole
  `<Menubar>` composition — every `MenubarMenu`/`MenubarTrigger`/
  `MenubarContent` — must live in one island file, never split across
  separate `client:*` boundaries.

**Common mistakes**:

- Reaching for `Menubar` when you only need one menu — that's
  `DropdownMenu`; `Menubar`'s horizontal roving-focus behavior between
  top-level triggers only makes sense with 2+ `MenubarMenu`s.
- Splitting `MenubarTrigger` and its `MenubarContent` across islands (the
  general compound-component mistake, see `docs/COMPONENTS.md` §4) — they
  share Base UI `Menu` state and must stay in one React root.

### Keyboard

Inherited unmodified from Base UI's `Menubar` (top-level roving focus,
`orientation="horizontal"`, `loopFocus={true}` — confirmed by reading the
installed `Menubar.js` source, not assumed) composing `Menu` instances
(same primitive as `DropdownMenu`) for each open submenu.

| Key | Description |
|---|---|
| <kbd>→</kbd> / <kbd>←</kbd> | Move focus between top-level `MenubarTrigger`s. Wraps from the last back to the first and vice versa (`loopFocus={true}`). |
| <kbd>Home</kbd> / <kbd>End</kbd> | Jump focus to the first/last top-level `MenubarTrigger`. |
| <kbd>↓</kbd> / <kbd>Enter</kbd> / <kbd>Space</kbd> | Open the focused menu's `MenubarContent`. |
| <kbd>↓</kbd> / <kbd>↑</kbd> | Inside an open menu, move the highlighted `MenubarItem` — same `Menu` list-navigation as `DropdownMenu` (see [`compound.md`](./compound.md)). |
| <kbd>→</kbd> | With a menu open, closes it and opens the **next** top-level menu (moves horizontally across the bar without needing to close-then-reopen manually). |
| <kbd>Esc</kbd> | Close the open submenu; focus returns to its `MenubarTrigger`. |
| <kbd>Tab</kbd> | Leaves the menubar entirely — moves focus to the next focusable element on the page, per the standard WAI-ARIA menubar pattern (arrow keys are for internal navigation; Tab exits). |
