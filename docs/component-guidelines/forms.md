# Forms

`gallery.ts` category: `forms` — Base UI-backed input primitives
(Select, Checkbox, Radio group, Switch, Slider, Textarea). **Coverage in this
file: Select and FileUpload.** FileUpload isn't yet linked into
`gallery.ts`'s manifest (it shipped after this category's entry was written —
see the file itself, `src/components/ui/file-upload.tsx`); it's documented
here as the best category fit (a form input control) pending that link-up.
For the compound `<Form>` wrapper (react-hook-form + Zod), see
[`compound.md`](./compound.md) — it's a different category because it's a
compound component, not a bare input.

---

## Select

Source: [`src/components/ui/select.tsx`](../../src/components/ui/select.tsx)

**Purpose**: A dropdown single-select built on `@base-ui-components/react/select`
(not Radix) — shadcn-API-compatible so it composes with `<Form>` the same way
the upstream shadcn Select does.

**When to use**: A small, closed set of mutually exclusive options where the
user picks exactly one. For a searchable/typeahead single-select over a large
or open-ended list, use `Combobox` instead (see
[`navmenu.md`](./navmenu.md)) — Select has no built-in filtering.

**API overview**: Compound — you compose the parts yourself, there is no
single `<Select options={...}>` convenience wrapper:

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Choose one…" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectGroupLabel>Group label</SelectGroupLabel>
      <SelectItem value="a">Option A</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

- `Select` = `BaseSelect.Root` — takes `value` / `onValueChange` (controlled)
  or `defaultValue` (uncontrolled).
- `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectGroup`,
  `SelectGroupLabel`, `SelectValue` — all forward `ref` and accept
  `className` for one-off overrides on top of the shadcn-styled defaults.
- `SelectItem`'s `value` prop is the option's identity; its children are the
  display label.

**Common mistakes**:

- Spreading `<Select>` and its children across two Astro `client:*` islands —
  it's a compound component with internal open/close + value state (Base UI
  Select context). It must live inside **one** island file, per CLAUDE.md's
  compound-component gotcha. (Currently bundled into the single
  `ShowcaseFormControls` island, along with Checkbox/RadioGroup/Switch/
  Slider/Textarea.)
- Reaching for `@radix-ui/react-select` docs/props verbatim — the Base UI
  data-attribute names differ (`data-[placeholder]`, not
  `data-[state=placeholder]`; enter/exit uses
  `data-[starting-style]`/`data-[ending-style]`, not `data-[state=open]`).
- Forgetting `SelectValue`'s `placeholder` prop — without it, an unselected
  Select renders empty instead of a hint.

---

## FileUpload

Source: [`src/components/ui/file-upload.tsx`](../../src/components/ui/file-upload.tsx)

**Purpose**: Drag-and-drop dropzone + hidden native `<input type="file">` +
a removable-token list of the currently selected files. Fully controlled —
the parent owns the `File[]` array.

**When to use**: Any form that needs file attachment (the "one input gap real
forms hit" per the file's own header comment — added to close a Cloudscape
parity gap). Not a general-purpose image cropper/previewer; it's the
selection + validation UI only, nothing renders a preview thumbnail.

**API overview**:

```tsx
interface FileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;         // native <input accept> MIME/extension filter
  multiple?: boolean;      // default false — single-file mode replaces on new selection
  maxSize?: number;        // bytes; oversized files are rejected via onError, not silently dropped
  onError?: (message: string) => void;
  className?: string;
}
```

- Fully controlled: there is no internal `files` state — you must call
  `onChange` and re-render with the new array, exactly like a controlled
  `<input>`.
- `multiple: false` (the default) **replaces** the current selection with the
  newly dropped/picked file(s), capped to one; `multiple: true` **appends**.
- Rejected-by-size files never reach `onChange` — they only fire `onError`
  with a formatted message (`"<name>" supera el límite de <size>.` — note:
  **this message is hardcoded in Spanish**, not localized; check before
  shipping to an English-only surface).

**Common mistakes**:

- Nesting the dropzone's `role="button"` div and the native `<input
  type="file">` as parent/child — the component deliberately keeps them as
  **siblings** (input is `sr-only` + `tabIndex={-1}`, dropzone `onClick`
  triggers `inputRef.current.click()`) specifically to avoid axe's
  nested-interactive-elements violation. Don't "simplify" this back into a
  wrapping `<label>`/`<input>` pair without re-checking a11y.
- Forgetting to reset `e.target.value = ''` if you fork this component — the
  original does it so re-selecting the *same* file fires `onChange` again
  (native `<input>` dedupes identical selections otherwise).
- Assuming `maxSize` validation happens per-batch — it's per-file; a batch of
  10 files with one oversized file drops only that one file and keeps the
  other 9.
