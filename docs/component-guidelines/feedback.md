# Navigation & feedback

`gallery.ts` category: `feedback` — Breadcrumb, Pagination, Alert, Spinner,
Meter, Kbd, Description list, Empty state, Error state. **Coverage in this
file: Flashbar.** Flashbar isn't yet linked into `gallery.ts`'s manifest (it
shipped after this category's entry summary was written — see
`src/components/ui/flashbar.tsx`); it's documented here as the best category
fit (page-level status/notification) pending that link-up. For the empty/
error-state pattern used across data-fetching islands (a related but
distinct concept from Flashbar), see `docs/COMPONENTS.md` §13 ("List state
normalization with `useListing`").

---

## Flashbar

Source: [`src/components/ui/flashbar.tsx`](../../src/components/ui/flashbar.tsx)

**Purpose**: Stacked, dismissible **page-level** notifications that persist
until dismissed or resolved — not auto-expiring like `Toast`. Pure
presentational component (plain `<div>`s, no Base UI primitive underneath;
no portal, no focus trap).

**When to use**: "Save failed, here's why" / "3 items deleted, [Undo]" —
anything that needs to stay visible and readable until the user acts on it
or dismisses it. For a fire-and-forget confirmation that should
auto-disappear, use `Toast` instead (see [`compound.md`](./compound.md)) —
this is the exact distinction the component's own header comment draws.

**API overview**:

```tsx
type FlashType = 'info' | 'success' | 'warning' | 'error';

interface FlashItem {
  id: string;
  type: FlashType;
  content: React.ReactNode;
  dismissible?: boolean;   // default true
  action?: { label: string; onClick: () => void };
}

interface FlashbarProps {
  items: FlashItem[];
  onDismiss?: (id: string) => void;
  className?: string;
}
```

- Fully controlled and stateless — the parent owns the `items` array
  (there's no internal add/remove state); `onDismiss(id)` is called on
  click, but **you** must remove the item from `items` in response.
- `warning`/`error` types render with `role="alert"` (announced immediately
  to screen readers); `info`/`success` render with `role="status"` (polite,
  non-interrupting) — this maps directly from the `ROLE` lookup table in the
  source, matching the `ErrorState`/`EmptyState` a11y convention documented
  in `docs/COMPONENTS.md` §13.
- `action` renders one optional inline text-button (e.g. "Retry", "Undo")
  per flash item — there is no slot for more than one action button.
- Returns `null` when `items` is empty — safe to always render
  `<Flashbar items={items} />` unconditionally rather than guarding with
  `items.length > 0 &&`.

**Common mistakes**:

- Expecting Flashbar to auto-remove items after a timeout — it never does;
  if you want that behavior, implement the timer yourself in the parent that
  owns `items` (or use `Toast` instead, which the design deliberately
  reserves for exactly that use case).
- Forgetting `onDismiss` doesn't mutate `items` for you — the button fires
  the callback with the id; your state update (`setItems(items.filter(...))`)
  is your responsibility.
- Using `content: string` when the message needs formatting — `content` is
  `React.ReactNode`, so pass JSX directly for links/emphasis rather than
  trying to cram markup into a plain string.
