# Accessibility Baseline

## Purpose

This page defines the minimum accessibility requirements that every Inceptor
component and page **must** meet before shipping. These are enforceable — CI
runs `src/tests/ux-contrast.test.ts` and Playwright a11y checks on every PR.

## Requirements

### 1. Colour contrast

| Context | Required ratio | WCAG level |
|---|---|---|
| Body text (`text-sm` and up) | 4.5 : 1 | AA |
| Large text (`text-lg font-bold` and up) | 3 : 1 | AA |
| UI components (borders, icons conveying state) | 3 : 1 | AA |
| Focus ring against adjacent surface | 3 : 1 | AA |

Inceptor's brand primary (`--primary`) is tuned to clear AA on both
`--background` and `--card` in both light and dark modes. Verified in
`src/tests/ux-contrast.test.ts`.

**Never** communicate state through colour alone. Pair colour with a text
label, icon, or pattern.

### 2. Keyboard navigation

Every interactive element must be reachable and operable via keyboard:

| Key | Expected behaviour |
|---|---|
| `Tab` / `Shift+Tab` | Moves focus forward / backward through interactive elements |
| `Enter` / `Space` | Activates buttons, checkboxes, links |
| `Escape` | Closes modals, drawers, dropdowns |
| Arrow keys | Navigates within radio groups, tab lists, menus |
| `Home` / `End` | Jumps to first / last item in a list or menu |

Focus must always be **visible** — the `--ring` token drives the focus style.
Never use `outline: none` without a replacement visible indicator.

### 3. Focus management

- When a modal or drawer opens, focus must move to the first focusable element
  inside it.
- When it closes, focus must return to the trigger that opened it.
- Use `autoFocus` or `useEffect(() => ref.current?.focus())` — never
  `setTimeout` hacks.

### 4. Semantic HTML

| Element to use | Instead of |
|---|---|
| `<button>` | `<div onClick>` |
| `<a href>` | `<span onClick>` for navigation |
| `<nav>` | Generic `<div>` wrapping a link list |
| `<main>` | First `<div>` inside `<body>` |
| `<h1>`…`<h6>` in document order | Skipping levels for visual sizing |

### 5. ARIA

- Use ARIA roles and attributes only when native HTML cannot express the
  semantics (e.g., `role="tabpanel"`, `aria-selected`).
- Never use `aria-hidden="true"` on a focusable element.
- Provide `aria-label` or `aria-labelledby` for icon-only buttons.

```tsx
// ✅ Accessible icon button
<button aria-label="Close" onClick={onClose}>
  <X className="size-4" aria-hidden="true" />
</button>

// ❌ Missing accessible name
<button onClick={onClose}>
  <X className="size-4" />
</button>
```

### 6. Motion

Users who prefer reduced motion must not see auto-playing animations. All
motion utilities must be wrapped:

```css
/* ✅ Correct — defined in src/styles/global.css */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) { animation: none; }
}
```

For island-level motion, use `motion/react`'s `useReducedMotion()` hook.
Tests live in `src/tests/ux-motion.test.ts`.

## Practical example

An accessible dialog with focus trap and return focus:

```tsx
import { Dialog, DialogBackdrop, DialogPanel } from '@base-ui-components/react/dialog';

export function ConfirmDialog({ open, onClose, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogBackdrop className="fixed inset-0 bg-black/40" />
      <DialogPanel
        className="fixed inset-0 m-auto h-fit max-w-md rounded-lg bg-popover p-6 shadow-lg"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title" className="text-lg font-semibold">Confirm action</h2>
        <p className="mt-2 text-sm text-muted-foreground">This cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-destructive" onClick={onConfirm} autoFocus>
            Delete
          </button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}
```

Key points:
- `autoFocus` moves focus to the destructive action (most explicit choice).
- `aria-labelledby` links the dialog to its visible heading.
- `onOpenChange` restores focus to the trigger when the dialog closes (Base UI
  handles this internally).

## Enforcement

| Check | Where |
|---|---|
| Contrast ratios | `src/tests/ux-contrast.test.ts` (Vitest) |
| Motion preferences | `src/tests/ux-motion.test.ts` (Vitest) |
| Keyboard navigation | `tests/visual/keyboard-nav.spec.ts` (Playwright) |
| a11y audit | `tests/visual/a11y.spec.ts` (Playwright + axe-core) |

All four must pass before a PR can merge. Run locally:

```bash
npm test                  # Vitest (contrast + motion)
npm run a11y              # Playwright a11y audit
npm run keyboard-nav      # Playwright keyboard navigation
```

## See also

- [`docs/foundation/tokens.md`](./tokens.md) — token contrast values
- [`src/tests/ux-contrast.test.ts`](../../src/tests/ux-contrast.test.ts)
- [`src/tests/ux-motion.test.ts`](../../src/tests/ux-motion.test.ts)
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
