# Positioning

How we talk about Inceptor, who it's for, and what it competes on. This is the
internal strategy doc — the narrative spine that README copy, the docs site, and
`create-inceptor-app`'s onboarding all derive from. It is opinionated on
purpose; when a positioning question comes up, it should be answered here once,
not re-litigated per surface.

This is a living document. Revisit it when the audience bet or the first-run
experience changes — both are decisions recorded below, not permanent facts.

---

## 1. The category problem (read this first)

On the surface Inceptor looks like another web starter: Astro 5 + React 19 +
Tailwind v4 + Base UI. **That stack is the least differentiated thing about it.**
Anyone can `npm create astro`. Positioning on the stack means competing with
`create-t3-app`, shadcn templates, and every Astro starter on GitHub — on their
terms, where they have mindshare and we don't.

The actual novel asset is the **governed, agent-orchestrated way of working**:

- issue → Claude triages → `prometeo` plans → `forja` implements →
  `centinela` validates → PR → merge → deploy
- the **FeedbackFAB** closing the loop from *real users* back into issues
- the non-code substrate: Shape Up cadence, TDD tiers, Spec-DD (Zod as the
  source of truth), the 8-item persuasive-design ethics checklist, mechanical
  `risk:high` labelling, ADRs for every irreversible decision

That is not a scaffold. **Inceptor is an opinionated operating system for
solo-dev-plus-AI software work, delivered as a runnable web repo.** The repo is
the proof and the carrier, not the product.

### The noun we claim

| Noun | What we'd be selling | Shelf reality |
|---|---|---|
| Starter template | files + a stack | crowded, low-defensibility |
| **Methodology, delivered as a repo** | **a way of working (the sub-agent loop + governance)** | **mostly empty shelf — ours to take** |
| Reference architecture | "here's how a serious solo+AI shop runs" | empty, but it's a *show*, not a *sell* |

**Decision: lead with the methodology, deliver it as the template.** The stack
is table stakes — mention it third.

---

## 2. The wedge

One line, true across every audience:

> **Governance that's mechanical, not aspirational.**

Quality and ethics are enforced by the repo, not by discipline. This is the
defensible center, and it's genuinely rare. It shows up concretely as:

- `centinela` gates every PR with routing tokens (`RETRY_FORJA`,
  `NEEDS_HUMAN`, `BLOCKED_UPSTREAM`) — a contract, not a vibe
- cooldown enforced by a git tag, not honor (`prometeo` refuses `type:feat`
  during cooldown)
- TDD enforced by commit trailers (`Tdd-Red: <sha>`), survives squash/rebase
- `risk:high` applied **mechanically** from the diff, not self-labelled
- the ethics checklist tiered by PR surface area and gated in CI

### Where we sit vs. the obvious comparisons

| Compared to… | They offer | Our wedge |
|---|---|---|
| Bolt / Lovable / v0 | generate UI fast, ungoverned | what *survives* a second month of maintenance |
| raw Claude Code / agent frameworks | one generic agent | three named roles with a contract between them, in a repo already shaped for them |
| Shape Up / methodology-as-PDF | a book, honor-system | the same methodology, executable and enforced structurally |

Do **not** compete on "generate faster." Compete on "governed by default."

---

## 3. The audience bet: multi-audience, unified by depth not kind

There are three plausible audiences:

1. **Solo / indie builders** — feel the "AI velocity vs. AI slop" pain acutely.
2. **Educators / academia** — want a repo that *teaches* Shape Up + TDD + ethics
   by embodying them (this is FinSight's origin).
3. **Orgs piloting agentic dev** — need the governance story to get AI past
   their risk people.

**Decision: stay multi-audience.** This is normally the answer that kills a
product, because it defers the category problem. It's the right call *here* for
one specific reason: **all three audiences want the same wedge — mechanical
governance — they just want it at different depths.** They differ in dosage, not
in kind.

The proof that this is the grain of the wood, not a cop-out: **Inceptor already
tiers everything.** `tdd-tier: strict|smoke|exempt`; ethics `Tier-0|1|2`;
`risk:high` applied mechanically. The product's DNA is already "one engine,
dialed by tier." Positioning mirrors the architecture: **one spine, progressive
disclosure.** We don't pick the audience — each audience picks its depth.

### One spine, four doors

| Layer | Door | Who walks through | Carrying asset |
|---|---|---|---|
| **L0 — Run it** | `npm create inceptor-app` → working app in minutes | indie builders | `create-inceptor-app` |
| **L1 — Work it** | the sub-agent loop + FeedbackFAB (user → issue) | indie + small teams | `.claude/agents/*`, the FAB |
| **L2 — Govern it** | tiered TDD / ethics / `risk:high` / ADRs | orgs + educators | `PRINCIPLES.md`, `ETHICS.md`, `decisions/` |
| **L3 — Teach it** | the whole repo as a worked example | academia | FinSight as reference impl |

The indie dev never has to read `ETHICS.md` to ship — but it's there,
mechanically enforced, the day their side-project becomes a real thing. The
educator gets all four layers as curriculum. The org gets L2 as its compliance
story. Nobody is disappointed; they're at different depths of the same artifact.

---

## 4. The first-run experience (the one fork multi-audience can't dodge)

"Stay multi-audience" doesn't let us skip the first decision everyone sees: what
does `create-inceptor-app` put in front of someone in the first 60 seconds?

**Decision: lean by default, differentiator *shown* not gated, depth *earned*
not asked.**

Two governing DX principles:

1. **Time-to-first-win ≈ zero.** A working app appears before any reading,
   config, or ceremony. (This rules out "full governed loop on by default.")
2. **The differentiator is *in* the first win, not behind it.** If the first
   impression is a clean Astro starter, we've taught the user we're a clean
   Astro starter. (This rules out "lean, governance dormant and hidden.")

### Why not an interactive picker at init

A "lean / governed / teaching?" prompt looks like the most multi-audience-
friendly option. It's the one to avoid: it **forces a decision before the user
has the context to make it.** That question is meaningless four seconds after
the command runs — it makes users self-segment before they know what the words
cost them. High cognitive load at the worst moment, plus three scaffold paths to
maintain. Pickers serve *returning* power users, not *first* runs.

### What the first 60 seconds should be

- `npm create inceptor-app` → working app on localhost, immediately (L0 win).
- Ships with **one pre-seeded example issue** and a **`/how-it-works`
  walkthrough** showing issue → `prometeo` → `forja` → `centinela` → PR on that
  seed. The user *watches the loop work* without authoring anything.
- The **FeedbackFAB is live from second one** — the cheapest, highest-impact
  differentiator demo we have, because it visibly closes user → issue.
- Governance (TDD tiers, ethics checklist, `risk:high`) is **present and
  documented but dormant** — visible-and-waiting, not off-and-hidden. A README
  one-liner and an `enable governance` path.

### The mechanism that replaces the picker: just-in-time disclosure

Surface each deeper layer **at the moment it becomes relevant**, instead of
interrogating upfront:

- first real bug filed → "want regression-test-first enforcement?
  `enable tdd-tier`."
- second contributor / first `risk:high`-ish change → surface the ethics
  checklist + ADR flow.
- used as coursework → a `TEACHING.md` door, not a runtime mode.

Progressive disclosure *earned by context* beats segmentation *demanded by
interrogation* — strictly better DX, and the only version of "multi-audience"
that doesn't fracture the first run. One scaffold to maintain, one narrative,
three depths.

---

## 5. The spine in one place

- **Category:** a methodology delivered as a runnable repo — not "a starter."
- **Wedge:** governance that's mechanical, not aspirational.
- **Audience:** multi-audience, unified by depth not kind.
- **First-run:** lean app + *shown* loop + live FAB; depth earned via
  just-in-time disclosure.

When you write copy for any surface (README hero, docs landing, the init
banner), it must trace back to these four lines. If it can't, it's off-message.

---

## 6. Open questions (not yet decided)

- The name of the live demo route (`/how-it-works` vs. folding it into
  `/showcase`).
- The exact `enable governance` / `enable tdd-tier` ergonomics (CLI subcommand
  vs. doc-driven manual step) — depends on how far `create-inceptor-app` grows.
- Whether `TEACHING.md` is a doc, a branch, or a separate template.

---

## 7. Inceptor ↔ FinSight (the reference implementation)

FinSight AI (the bank-statement reader) is **Inceptor's L3 "Teach it" layer made
real** — a production product built *on* the methodology, used as the worked
example. The relationship is deliberate and one-directional:

- **FinSight is downstream.** It consumes the template's way of working
  (sub-agent loop, Shape Up, TDD tiers, ethics checklist) and proves it survives
  contact with a real product, a real deadline, and real users.
- **Inceptor is upstream.** It owns the *generic* substrate. Anything in FinSight
  that is not product-specific is a candidate to **extract upstream** into the
  template.

### The extraction rule

When something is built in FinSight, ask: *is this about how we work, or about
bank statements?*

| Extract upstream to Inceptor | Stays in FinSight |
|---|---|
| sub-agent / workflow improvements | PDF parsing, transaction schemas |
| DX tooling (`doctor`, `monday`, `ship`) | Supabase + Edge Functions wiring |
| ethics / governance mechanics | CNBV / INAI domain rules |
| generic UI primitives + gallery entries | finance dashboards, categorization UI |
| recipes (auth, BYOK AI, CI/CD) | the specific BYOK provider choices |

The DX-improvement plan and the Ola 1–3 recipe work (PRs #113–#115) already ran
this loop — learnings from FinSight became generic template assets. That is the
intended cadence, not a one-off.

### The constellation

When the archetype constellation lands (`backend`, `decentralized`, `onion`),
each archetype **inherits `PRINCIPLES.md`** and overrides only stack/deploy
specifics in its own `archetype.md`. FinSight is the first such instance in all
but name — a product archetype. Inceptor stays the single source of *how we
work*; archetypes and products carry only what is genuinely theirs.

**Decision:** keep Inceptor product-agnostic; treat FinSight as the canonical
downstream proof; extract by the rule above, never couple upstream to a product's
domain.

---

## References

- Way of working: [`docs/PRINCIPLES.md`](./PRINCIPLES.md)
- Ethics framework: [`docs/ETHICS.md`](./ETHICS.md)
- Workflow + sub-agents: [`CLAUDE.md`](../CLAUDE.md)
- Lean instantiation: `create-inceptor-app` (Epic A)
- What to ship next: [`ROADMAP.md`](../ROADMAP.md)
