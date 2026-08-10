# Navigation & menus

`gallery.ts` category: `navmenu` — Combobox, Command palette (⌘K),
Navigation menu, Menubar, Stepper, all under `src/components/ui/`.
**Coverage in this file: Combobox only.**

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
