# Component guidelines

Agent-facing usage docs for Inceptor's component library (Epic 26 of
`ROADMAP.md`) — modeled on Ant Design Pro's `guidelines/` folder. **The
audience is a coding agent** (Claude Code, `forja`, or any other MCP client
reading these files or calling `mcp-server`'s `get_component` tool) deciding
how to use a component, not a human skimming for the first time. Prefer
precision over prose: real prop names, real gotchas, no marketing copy.

## Format

One file per **gallery category** (matching `src/content/gallery.ts`'s
`category` field), not per individual component — a per-component split would
be ~70 files for a library this size. Within each file, one section per
component:

- **Purpose** — one line.
- **When to use** — the decision an agent needs to make before reaching for it.
- **API overview** — key props only, not exhaustive. Read the real source
  (linked at the top of each section) for the full surface.
- **Common mistakes** — the errors this repo's own commit history, ADRs, and
  `docs/COMPONENTS.md` have already paid for once. Don't repeat them.

## Coverage — partial, expanding

This library has ~70 gallery entries; these guidelines currently cover
**19 components across 10 categories** — the most-used and most-structurally-
complex ones (compound components, the two Cloudscape-gap controls, the
generic `DataTable`), plus (as of ROADMAP Epic 18) the five components with
a documented Keyboard subsection: `DataTable`, `Combobox`, `Command
palette`, `Tree view`, `Menubar`. Every prop name below was read directly
from the current `src/components/ui/*.tsx` / `src/components/ui/ai/*.tsx`
source, not guessed from the summary in `gallery.ts`; every Keyboard table
was verified against the installed `@base-ui-components/react` primitive
source (or the component's own hand-rolled event handlers) rather than
assumed from the general WAI-ARIA pattern. **Do not treat an uncovered
component as unsupported** — check `docs/COMPONENTS.md` and
`docs/component-catalog.md` first, then read the source directly. Extending
coverage here (new category files, or new sections in an existing file) is
welcome; follow the same four-heading format (add a `### Keyboard`
subsection too when the component has non-trivial keyboard interaction).

## Files

| File | Category (`gallery.ts`) | Components covered |
|---|---|---|
| [`primitives.md`](./primitives.md) | `primitives` | Button |
| [`forms.md`](./forms.md) | `forms` | Select, FileUpload |
| [`navmenu.md`](./navmenu.md) | `navmenu` | Combobox, Command palette, Menubar |
| [`compound.md`](./compound.md) | `compound` | Dialog, Form, DropdownMenu, Tabs, Toast |
| [`overlays.md`](./overlays.md) | `overlays` | Tooltip |
| [`disclosure.md`](./disclosure.md) | `disclosure` | Accordion |
| [`feedback.md`](./feedback.md) | `feedback` | Flashbar |
| [`data.md`](./data.md) | `data` | DataTable, PropertyFilter |
| [`extras.md`](./extras.md) | `extras` | Tree view |
| [`gen-ai.md`](./gen-ai.md) | `gen-ai` | PromptInput, ChatMessage / ChatThread |

## Machine-readable alternative

If you're an MCP client rather than reading files directly: `mcp-server/`
(sibling directory, also Epic 26) exposes `list_components` and
`get_component` tools over the same underlying `registry.json`. These
markdown files are the narrative "how to use it well" layer; the registry is
the structural "here are the exact files and dependencies" layer. They are
complementary, not duplicates.
