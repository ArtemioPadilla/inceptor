# Component catalog & roadmap

A complete inventory of Inceptor's UI surface: what ships today and what's
intentionally left to per-project decisions. Every implemented component is
rendered live at [`/gallery`](https://artemiop.com/inceptor/gallery/).

**Legend**

- ✅ **Implemented** — ships today, shown in `/gallery`
- ⬜ **Not built** — needs a dependency or is explicitly on-demand
- 🔵 Base UI primitive · 🛠 markup/CSS · 📦 needs a dependency

> As of 2026-06: **~44 components across 13 gallery categories.** Every catalog
> component that doesn't require an external dependency (or isn't explicitly
> niche) now ships. Validated against the full shadcn/ui catalog (47) — 100%
> covered, plus extras.

---

## 1. Implemented (live in `/gallery`)

### Primitives — `/gallery/primitives`
Button · Input · Label · Card · Table · Badge

### Form controls — `/gallery/form-controls`
Select · Checkbox · Radio group · Switch · Slider · Textarea  *(all Base UI)*

### Advanced inputs — `/gallery/advanced`
Toggle · Toggle group · Number field · Toolbar · Sheet (drawer) · Rating · Tag input · Input OTP

### Navigation & menus — `/gallery/navigation`
Combobox · Command palette (⌘K) · Navigation menu · Menubar · Stepper

### Compound components — `/gallery/{dialog,dropdown-menu,tabs,toast,form}`
Dialog · Dropdown menu · Tabs · Toast · Form (RHF + Zod)

### Overlays — `/gallery/overlays`
Tooltip · Popover · Alert dialog · Hover card · Context menu  *(Base UI portals)*

### Disclosure & layout — `/gallery/disclosure`
Accordion · Collapsible · Avatar · Skeleton · Separator · Scroll area · Aspect ratio

### Feedback & status — `/gallery/feedback`
Breadcrumb · Pagination · Alert · Spinner · Meter · Kbd · Description list · Empty state

### Data — `/gallery/data-table`
DataTable (TanStack Table + Virtual — sort, filter, column visibility, resize, virtualization, URL-state)

### KPIs & charts — `/gallery/{kpis,charts}`
KpiCard · Metric · ProgressBar · Tracker · Callout · Divider · LineChart · BarChart · AreaChart · DonutChart

### Extras & data-viz — `/gallery/extras`
Tree view · Timeline · Bar list · Sparkline · Gauge

### Features
Motion (lazy) · PWA prompts · ErrorBoundary · FeedbackFAB · SiteHeader · ThemeToggle · OfflineBanner

> All Base UI wrappers are shadcn-compatible and emerald-themed; markup/CSS
> components are dependency-free. Each lands as: `ui/<name>.tsx` → showcase
> island → `src/content/gallery.ts` entry → test → CI → deploy.

---

## 2. Coverage scorecard

| Category | Status |
|---|---|
| Actions & buttons | ✅ Button, Toggle, Toggle group, Toolbar |
| Form controls | ✅ Input, Label, Textarea, Select, Checkbox, Radio, Switch, Slider, Number field, Combobox |
| Overlays & popups | ✅ Dialog, Alert dialog, Dropdown, Context menu, Popover, Tooltip, Hover card, Sheet, Command palette |
| Navigation | ✅ Tabs, Breadcrumb, Pagination, Navigation menu, Menubar, Stepper, SiteHeader |
| Data display | ✅ Table, DataTable, Card, Badge, Avatar, Accordion, Collapsible, Skeleton, Tree view, Timeline, Description list |
| Feedback & status | ✅ Toast, Alert, Callout, ProgressBar, Meter, Spinner, Tracker, Empty state |
| Layout & structure | ✅ Divider, Separator, Scroll area, Aspect ratio |
| Charts & data-viz | ✅ Line/Bar/Area/Donut, Sparkline, Bar list, Gauge · ⬜ Radar/Scatter/Heatmap |

**No remaining gap among dependency-free components.**

---

## 3. Remaining — needs an external dependency (per-project decision)

The scaffold's zero-cost / minimal-dep stance means these aren't bundled by
default. Add per project; each is worth an ADR if it ships in the template.

| Component | Candidate dependency |
|---|---|
| Date picker / Calendar / Date-range | `react-day-picker` |
| Time picker | custom on `react-day-picker` |
| Color picker | `react-colorful` |
| Rich text editor | `tiptap` / `lexical` |
| Resizable panels | `react-resizable-panels` |
| Carousel | `embla-carousel-react` |
| Image / Lightbox | `yet-another-react-lightbox` |
| Code block (syntax highlight) | `shiki` (planned for gallery `CodeSnippet`) |
| Drag & drop / sortable | `@dnd-kit/core` |
| Advanced charts (radar, scatter, heatmap) | `visx` / `nivo` |

## 4. Remaining — niche / situational (add only on demand)

From Ant Design / MUI / Chakra; rarely needed in a general scaffold.

Product tour (`driver.js`) · Mentions · Cascader · Transfer list · QR code
(`qrcode.react`) · Watermark · Result/status page (an Empty-state variant)

---

## 5. Intentionally out of scope (per CLAUDE.md)

- `@radix-ui/*` — Base UI is the chosen primitive layer
- `@tremor/react` package — Tremor *Raw* (copy-paste) only
- `framer-motion` — use `motion/react`
- `@astrojs/tailwind` — Tailwind v4 via `@tailwindcss/vite`

---

## 6. How to add a component

1. `npx shadcn@latest add <name>` **or** hand-write a Base UI wrapper in `src/components/ui/<name>.tsx`.
2. Compound/stateful? wrap the composition in **one** island under `src/components/islands/` (compound-component gotcha — see CLAUDE.md).
3. Add a showcase island + an entry in `src/content/gallery.ts`, and wire the island into `src/pages/gallery/{index,[component]}.astro` (static imports — Astro can't do dynamic `client:*` lookups).
4. Add a test under `src/components/ui/`.
5. `npm run check` green → PR → CI → deploy.

---

_Maintained alongside [`ROADMAP.md`](../ROADMAP.md). Cross-referenced against
shadcn/ui, Radix, MUI and Ant Design (web, June 2026). Last reviewed: 2026-06-01._
