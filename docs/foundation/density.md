# Density

## Purpose

Density controls the information-to-space ratio of the UI. Inceptor supports
two modes: **compact** (high density — more data per viewport) and
**comfortable** (standard density — breathing room, relaxed reading). The mode
is not a global toggle today; it is applied per-component through Tailwind
utility classes derived from the token ramp.

## Modes

### Comfortable (default)

- Padding: `p-4` / `px-4 py-3` for cards and rows
- Font size: `text-sm` for body, `text-xs` for metadata
- Row height: `h-12` for table rows, `h-10` for inputs
- Gap between items: `gap-4`

### Compact

- Padding: `p-2` / `px-3 py-1.5` for cards and rows
- Font size: `text-xs` throughout
- Row height: `h-8` for table rows, `h-8` for inputs
- Gap between items: `gap-2`

## When to use each

| Mode | Use when… |
|---|---|
| Comfortable | Consumer-facing pages, onboarding, forms, modals |
| Compact | Admin dashboards, data tables, monitoring views, toolbars |

Do not mix modes within a single logical region (e.g. a table row should not
have comfortable padding while its header uses compact). Inconsistent density
creates visual noise and hurts scannability.

## Component-level implications

### DataTable

Compact density is the default for `DataTable` because tabular data benefits
from more rows per viewport. Pass `density="comfortable"` to switch:

```tsx
// ✅ Compact (default) — maximum rows visible
<DataTable columns={columns} data={rows} />

// ✅ Comfortable — suits detail-heavy rows with multiple lines of text
<DataTable columns={columns} data={rows} density="comfortable" />
```

### Cards

Cards default to comfortable. Use compact for dashboard KPI grids:

```tsx
// ✅ KPI grid — tight layout
<div className="grid grid-cols-4 gap-2">
  <KpiCard title="Revenue" value="$12.4k" className="p-2" />
  {/* … */}
</div>
```

### Forms

Always use comfortable density for input forms. Touch targets must be at least
44 × 44 px — compact inputs (h-8 = 32 px) must not be used for primary form
flows.

## Practical example

Sidebar navigation compact mode vs. comfortable:

```tsx
// Compact sidebar item
<li className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md
               hover:bg-accent hover:text-accent-foreground">
  <Icon className="size-4 shrink-0" />
  {label}
</li>

// Comfortable sidebar item
<li className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-md
               hover:bg-accent hover:text-accent-foreground">
  <Icon className="size-5 shrink-0" />
  {label}
</li>
```

## Anti-patterns

| Anti-pattern | Why it's wrong |
|---|---|
| Mixing compact rows and comfortable headers | Visual dissonance; users misread alignment |
| Using compact on primary forms | Touch targets too small; fails WCAG 2.5.5 |
| Hardcoding `py-1` inside a shared component | Locks density; use a prop instead |

## See also

- [`docs/foundation/layout.md`](./layout.md) — spacing rhythm across page regions
- [`docs/foundation/accessibility.md`](./accessibility.md) — touch-target minimums
