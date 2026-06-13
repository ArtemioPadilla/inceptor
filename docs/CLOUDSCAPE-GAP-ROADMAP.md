# Cloudscape gap roadmap

How Inceptor reaches Cloudscape-grade robustness **without becoming Cloudscape.**

[AWS Cloudscape](https://cloudscape.design/) is the bar for a mature design
system: ~130 components, ~75 documented UX patterns, 15 generative-AI
patterns, a formal foundation layer, 30+ source-included demos, and a
per-component DOM test-utils package. It is built and maintained by a large
AWS team for AWS Console parity.

Inceptor is a different animal — a **methodology-first, solo-maintainable
template** (Astro islands + Base UI), where the component kit is *proof
material* for the issue→PR→merge loop, not the product (see
[`POSITIONING.md`](./POSITIONING.md)). So the goal here is **not** 130-component
parity. It's to close the gaps that make Inceptor *feel* as systematic as
Cloudscape on the surfaces that matter for its positioning — and to exploit the
one place Inceptor should obviously lead and currently doesn't.

## The one finding that matters

**Cloudscape ships 15 generative-AI UI patterns. Inceptor ships zero.** A
non-AI-native company documents chat, prompt input, streaming/"thinking"
states, output attribution, response regeneration, follow-up questions, and
user-authorized actions — while the template whose entire identity is
*agent-orchestrated development* has no AI-facing UI at all. This is the
highest-leverage, most on-brand gap in the whole comparison. Everything else is
table-stakes catch-up; this is the part where Inceptor should be ahead.

## Comparison at a glance (verified June 2026)

| Dimension | Cloudscape | Inceptor today | Verdict |
|---|---|---|---|
| Components | ~130 across ~15 categories | 68 UI primitives + 6 chart wrappers, 20 gallery categories | Lean-by-design; close *specific* high-value gaps, not the count |
| App shell | AppLayout, SplitPanel, SideNavigation, HelpPanel, Drawer, Flashbar, content-layout | BaseLayout + header/footer; no shell composition | **Real gap** — the single biggest "feels like a framework" lever |
| Collections | Table (sort/inline-edit/selection/sticky), Property filter, Collection preferences, Cards, Pagination | DataTable (sort, filter, virtual 50k, URL-state), `useListing`, EmptyState/ErrorState | Strong core; missing **property-filter** + saved views + bulk/inline-edit |
| Pattern catalog | ~75 patterns ("how to build X") cross-linked to components | Pattern *primitives* exist (EmptyState/ErrorState, useListing, disposer, client-preference) but **no pattern docs layer** | **Real gap** — the primitives are built; the "this is how you build a CRUD page" guidance isn't written |
| Foundation | Formal tokens system, density modes, motion, visual-refresh, i18n/RTL | 108 CSS custom properties (light+dark), motion, color-scheme, hreflang | Solid; needs a **foundation *doc*** (it exists as code, not as guidance) |
| Forms/input | Wizard, Attribute editor, File upload, Date/time pickers | Form (RHF+Zod), inputs, no wizard/file-upload/date-picker | Add **wizard** + **file-upload**; date-picker only if a demo needs it |
| Gen-AI UI | 15 patterns (chat, prompt input, streaming, attribution, feedback…) | **none** | **The flagship gap** — see above |
| Demos | 30+ reference demos, source included | dashboard, 50k table, settings, data island, backend API, /how-it-works | Good; add **service-shell** + **create-flow** + **AI-chat** demos |
| Engineering DX | per-component `test-utils`, SSR, theming API, playground, versioned releases | astro-check + vitest + axe/keyboard/mobile/visual gates, props tables, llms.txt, create-inceptor-app | Genuinely strong already; the gate story is arguably *tighter* than a docs-site playground |

## Roadmap

Organized as epics. Effort is solo-maintainer realistic: **S** ≈ a day, **M** ≈
a few days, **L** ≈ a week, **XL** ≈ multi-week.

### Epic A — Gen-AI UI kit (the on-brand flagship) · L

Inceptor's identity demands this. Build a small, honest set of AI-interaction
primitives — not all 15 Cloudscape patterns, but the spine of an AI surface.

- `ChatMessage` / `ChatThread` — user/assistant bubbles with role styling (S)
- `PromptInput` — auto-growing textarea + send, ⌘↵ submit, disabled-while-streaming (S)
- `StreamingText` / "thinking" indicator — token-stream + a working/awaiting state (M)
- `AIOutputLabel` — attribution + "AI-generated, verify before acting" disclaimer (S)
- `AIFeedback` — thumbs up/down + optional reason, wired to the FeedbackFAB issue flow (S)
- A `/demos/ai-chat` reference demo composing all of the above against a mock stream (M)
- A `docs/patterns/ai-surfaces.md` covering the ethics angle (disclosure, low-confidence comms) — ties to `ETHICS.md` (S)
- *Inspired by:* Cloudscape gen-AI patterns (chat, prompt input, thinking, output label, feedback).

### Epic B — The pattern-catalog layer · M

The primitives largely exist; the **guidance** doesn't. Cloudscape's real
multiplier is the patterns layer that says "here's how to build a listing / a
create flow / a details page" and cross-links to components.

- `docs/patterns/` index + per-pattern pages: **listing** (useListing + DataTable + EmptyState/ErrorState — already shipped, just document it), **create flow**, **details page** (+ tabbed variant), **delete with confirmation**, **empty/error/loading states** (S each, ~5–6 pages)
- Cross-link every pattern to its gallery components and to the live demo
- Surface `/docs/patterns/` in the sidebar and in `llms.txt`
- *Inspired by:* Cloudscape patterns catalog (general + resource-management).

### Epic C — App-shell composition · L

The biggest "feels like a framework" jump. One reusable shell, not a pile of parts.

- `AppShell` composition: top nav + collapsible `SideNavigation` + content slot + optional `SplitPanel`/`Drawer` + a `HelpPanel` slot (L)
- `Flashbar` — stacked dismissible page-level notifications (distinct from the toast we have) (S)
- A `/demos/console` reference demo: shell + a resource listing + details, the canonical "service console" shape (M)
- *Inspired by:* Cloudscape AppLayout / SplitPanel / SideNavigation / Flashbar.

### Epic D — Collection power-ups · M

Inceptor's DataTable is already strong (virtual 50k, URL-state). Close the
enterprise-collection gaps that actually recur.

- `PropertyFilter` — token-based structured filtering (the single most-missed Cloudscape control) (M)
- Inline-edit + bulk row actions on DataTable (M)
- Collection preferences (column visibility/density) — partly present via the Columns control; formalize + persist (S)
- *Inspired by:* Cloudscape Property filter, Collection preferences, inline edit.

### Epic E — Forms & foundation docs · M

- `Wizard` — multi-step create with step validation + the create-flow pattern doc (M)
- `FileUpload` (+ dropzone) — the one input gap real forms hit (S)
- `docs/foundation.md` — make the *existing* token/density/motion/theming system legible as guidance, not just code; auto-generate the token table from `global.css` (S)
- *Inspired by:* Cloudscape Wizard, File upload, Foundation layer.

### Epic F — Quality bar parity · S

Cloudscape's robustness is partly that nothing is advisory. Inceptor is already
close (the visual gate is strict). Finish the job.

- Per-component test-util helpers OR lean on the existing behavior tests + axe gate (decide; a full test-utils package is likely over-engineering for a solo template — **document the decision**)
- Promote any remaining advisory checks to blocking
- Add the new components to the gallery + drift-gated catalog (the gate already enforces this)

## Deliberately not doing (skip-with-reason)

These are real Cloudscape capabilities that would be **net-negative** to clone
at Inceptor's scale and positioning:

- **130-component parity** — the kit is proof material, not the product. Breadth dilutes the methodology message and is unmaintainable solo.
- **Attribute editor, S3 resource selector, Board/Items-palette drag-drop, Code editor** — deep enterprise/AWS-console-specific controls; build only if a real downstream project (e.g. FinSight) needs one, then extract upstream per the POSITIONING extraction rule.
- **Tutorial/Hotspot onboarding system** — heavy, rarely used outside large consoles; a good `/how-it-works` + docs covers the need.
- **A Figma kit / design-resource library** — Inceptor is code-first and solo; a design-tool source-of-truth has no maintainer.
- **A standalone `@inceptor/test-utils` package** — the axe + keyboard + visual + behavior-test gate stack already delivers the *outcome* test-utils exists for; a per-component wrapper API is ceremony without a team to amortize it. (Revisit if the component count ever doubles.)

## Definition of "robust" for Inceptor

Inceptor is Cloudscape-grade-robust *for its positioning* when:

- [ ] It ships a **gen-AI UI kit** — the agent-native template finally has agent-native UI (Epic A)
- [ ] Every shipped primitive has a **pattern doc** that says when/how to use it, cross-linked to a live demo (Epic B)
- [ ] A new project can scaffold a **full service console** (shell + listing + details + create) from documented compositions, not from scratch (Epics C–E)
- [ ] The **foundation** is legible as guidance, not just inferable from CSS (Epic E)
- [ ] No quality check is advisory; new components can't merge without gallery + a11y + visual coverage (Epic F) — *already true*
- [ ] Every addition stays **single-maintainer-legible** and traceable to the issue→PR→merge loop

## Next steps

1. File Epic A as the first wave — it's the differentiator, not catch-up, and it's the most fun proof of the loop.
2. File Epics B–F as issues with acceptance criteria; let the prometeo→forja→centinela loop run them.
3. Re-evaluate after Epic A + B ship: the pattern-catalog layer may turn out to deliver more perceived robustness per unit of work than any new component.
