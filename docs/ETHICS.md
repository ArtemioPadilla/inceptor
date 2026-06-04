# Ethics — Persuasive technology guardrails

This project ships persuasive technology — UI affordances that change what users
think and do. Per BJ Fogg's *Persuasive Technology* (2003) and modern
dark-patterns guidance (EU Digital Services Act, Article 25; W3C; Brignull's
deceptive.design), we encode the following framework so persuasive features can
ship intentionally and dark patterns can't ship by accident.

This document is the **rationale**. The **enforcement** lives in:

- `.claude/checklists/ethics.md` — machine-readable for centinela *(Epic 13)*
- `.github/PULL_REQUEST_TEMPLATE.md` — visible to humans *(Epic 11)*
- `npm run ux:check` — mechanical scans *(Epic 12)*

---

## Fogg's Functional Triad

Every persuasive feature is classified by what role the computer plays:

| Role | Pattern | Example in this repo |
|---|---|---|
| **Tool** | Extends a user capability | FeedbackFAB reduces the ability cost of filing a bug report |
| **Medium** | Presents experience | ErrorBoundary narrates failure to the user |
| **Social actor** | Takes on persona / role | ThemeToggle's `aria-pressed` implies awareness; the sub-agent loop plans on your behalf |

`prometeo` classifies each `type:feat` issue by triad corner in its plan output
so `forja` sees the matching ethical risks before writing code.

---

## Persuasive patterns already in this repo (named in Fogg's vocabulary)

We were doing captology without realising it:

- **FeedbackFAB** = persistent Tool + Suggestion technology + **Kairos**
  (right-time intervention — the badge surfaces *after* errors fire, exactly
  when motivation to report peaks). The capture itself is borderline
  surveillance (silent diagnostics from page load) — fix tracked in
  [`ROADMAP.md`](../ROADMAP.md) Epic 12 (privacy toast).
- **ErrorBoundary fallback** = Social-Actor consolation + Reduction. It speaks
  ("Something went wrong in this island") and offers one-click recovery.
- **The sub-agent orchestrator** = **Tunneling** technology (Fogg Ch. 3). Funnels you
  through *issue → branch → PR → merge* with the dependency chain pre-computed.
  Carries ethical concern #4 (asymmetric control: you can stop, but can't take a
  path the tunnel doesn't allow).
- **Issue templates** = ability-reducers — lowering the cost of well-formed
  contributions.
- **ThemeToggle, PWA install prompts** = Social-Actor cues with surface
  credibility implications (a flash on toggle erodes credibility).

Naming these explicitly is half the discipline. Future features should declare
their triad corner in the PR description.

---

## Six unique ethical concerns of persuasive computing (Fogg Ch. 9)

Computers persuade differently from people. The six concerns the checklist below
maps to:

1. **Novelty** masks intent — users haven't seen this pattern, can't read
   motivation
2. Computers borrow **undeserved credibility** — badges imply more authority
   than the system has
3. **Persistence** — software repeats persuasion indefinitely
4. Computers control **asymmetric affordances** — users opt out only along paths
   the system allows
5. Emotions are **one-way** — UI can express, users can't change the system back
6. Computers cannot **shoulder responsibility** — only the human who shipped
   them can

---

## Checklist tiers

The 8-item checklist applies in **three tiers** by PR surface area. `centinela`
picks the tier from the PR diff using path globs:

| Tier | Triggers when the diff touches… | Required items |
|---|---|---|
| **Tier-0** (skip) | Only `docs/**`, `*.md`, `*.mdx`, `tests/**`, or typo-shaped changes | (none — gate skipped) |
| **Tier-1** (UI tweak) | `src/components/**`, `src/pages/**`, or `.github/ISSUE_TEMPLATE/**` *without* introducing new affordances, new telemetry, or new behavior | **#1, #7, #8** |
| **Tier-2** (new persuasive surface) | Same paths *with* new affordances, new flows, new telemetry, new network calls, new persistent state | **#1, #2, #6, #7, #8** (+ items promoted by Functional Triad — see below) |

Items not in the required set may be answered "N/A" with a one-line
justification.

### Functional Triad → required-item promotion

`prometeo` classifies every `type:feat` issue by Functional Triad corner
(`tool` / `medium` / `social-actor`) and *that classification promotes
optional checklist items to required* for the issue:

| Triad corner | Optional items auto-promoted to required |
|---|---|
| **Tool** (extends capability) | #3 (asymmetric persistence) |
| **Medium** (presents experience) | #5 (emotional reciprocity) |
| **Social actor** (takes persona / makes claims) | #4 (borrowed credibility), #5 (emotional reciprocity) |

`prometeo`'s plan output declares the resulting required-set for the issue;
`centinela` enforces against the declared set, not the global default.

### `risk:high` triggers mechanical Stakeholder Analysis

The `risk:high` label is **auto-applied by `prometeo`**, never self-labelled,
when the proposed changes match any of:

- New network request to a non-same-origin endpoint
- New `localStorage` / `IndexedDB` / cookie write of user input
- Routes under `/learn`, `/kids`, `/payments`, `/auth`
- Any change to `src/lib/diagnostics.*` or telemetry surfaces

If any trigger fires, `risk:high` is auto-applied and `centinela` blocks merge
until the Stakeholder Analysis ADR exists in `docs/decisions/`. See the
"Stakeholder Analysis" section below for the 7-step procedure.

## The 8-item ethics checklist

Per the tier rubric above. Required items have non-empty answers; others may be
"N/A" with a one-line justification.

### 1. Intent declared *(required at every non-zero tier)*

**Q:** What behaviour change does this PR push the user toward, and whose
benefit does it serve?

Without explicit intent, persuasion happens by accident. Maps to Fogg Concern #1.

- ✅ "Dark-mode toggle persists preference to reduce eye strain — user comfort"
- ⚠️ "Auto-opens upsell modal after 3 page views — drives plan upgrades"

The second isn't necessarily wrong, but it must be acknowledged so the rest of
the checklist can be applied honestly.

### 2. No deception, no coercion *(required at tier 2)*

**Q:** Does any copy, default, or affordance mislead about consequences or
remove a reasonable opt-out?

Deception and coercion are **always unethical** per Fogg Ch. 9
(Methods-Always-Unethical).

Patterns to flag:

- Pre-checked subscribe boxes
- "Cancel" buttons that confirm
- Confirmshaming ("No thanks, I prefer to pay full price")
- Disguised ads
- Roach-motel signups (easy to enter, painful to leave)
- **False hierarchy** — when a destructive / privacy-reducing action and a
  privacy-preserving action sit side-by-side, the privacy-preserving option
  must have *equal or greater* visual weight (size, contrast against
  background, position in reading order). axe-core will pass a cookie
  banner where "Accept all" is `bg-primary` and "Reject all" is a low-contrast
  text link — both technically WCAG AA. The rule must reject anyway.

### 3. Asymmetric persistence justified

**Q:** If the UI nags, retries, or auto-reopens, is the user clearly in control
of stopping it?

Concern #3 (persistence) + #4 (asymmetric control). Broader than install
prompts — covers any UI that resists dismissal or commandeers user agency.
Examples:

- PWA install prompts must respect dismissal for ≥ 7 days, not re-prompt every reload
- Update toasts include a "later" option, not just "reload now"
- Cookie banners default to the *least* privacy-invasive option, not "Accept all"
- **Modal dialogs** must be dismissible by ESC and by clicking outside
- **Tooltips** that explicitly dismiss must stay dismissed for the session
- **Scroll-jacking** marketing sections that block native browser scroll
- **`beforeunload` traps** ("are you sure?") on any flow that hasn't accumulated user input
- **Sticky CTAs** that cover content on mobile without a close affordance

### 4. Borrowed credibility honest

**Q:** Do badges, charts, or "AI-powered" labels imply more authority than the
system actually has?

Concern #2. Examples:

- A confidence bar on triage labels needs a "based on N samples" caveat
- "Trusted by 10,000 developers" needs a real source
- Star ratings need disclosure of sample size

### 5. Emotional cues are reciprocal or disclosed

**Q:** Does the UI express feelings ("Great job!", anxiety-inducing red counters)
without a way for the user's emotion to alter the system?

Concern #5. Examples to flag:

- Streak-shaming UI
- "We're sad to see you go" cancellation flows
- Notification badges that count unread items the user has explicitly muted

### 6. Surveillance is overt and supportive *(required at tier 2)*

**Q:** Is any telemetry visible to the user at the moment of capture, and used
for help, not punishment?

Fogg's rule: surveillance is ethical only if **overt and supportive**.

**Status of current repo:** FeedbackFAB passes (capture is overt — user clicks
send). HydrationCanary's silent error capture is borderline — see Epic 12
privacy-toast follow-up.

### 7. Vulnerable-group impact considered *(required at every non-zero tier)*

**Q:** Could a child, non-native reader, anxious / low-vision / motor-impaired
user be harmed by this pattern?

Fogg Ch. 9 §"When Persuasion Targets Vulnerable Groups". This is the most
common real-harm vector — items #1, #2, #6, #8 cover intent and overt
deception/surveillance, but harm by *quiet exclusion* lives here. Promoted
from "optional" to "required" (F3 from the multi-agent review).

Examples:

- Motion that ignores `prefers-reduced-motion` fails here
- Time-pressured CTAs ("Only 2 minutes left!") prey on anxiety
- Dense text without summary or TL;DR excludes non-native readers
- Sole reliance on color to convey state excludes color-blind users
- Tap targets < 44 × 44 px exclude motor-impaired users
- Read-the-label-or-die copy in modal dialogs excludes anxious / cognitively
  fatigued users

### 8. Unintended-but-predictable outcomes named *(required at every non-zero tier)*

**Q:** List at least one foreseeable misuse and the mitigation.

Per Fogg Fig. 9.5, the designer is "responsible and at fault" for predictable
unintended harms.

Examples:

- "Showcase confetti could trigger seizures → gated behind `prefers-reduced-motion`"
- "Public IssuesList could expose contributor email addresses → mask email field"
- "FeedbackFAB could be abused for spam → rate-limited at the GH issue API layer"

---

## Stakeholder Analysis (deep-dive for `risk:high`)

For high-risk issues (label `risk:high` — new data capture, kids' UX, finance,
decentralized identity, anything regulated), perform the 7-step Stakeholder
Analysis from Fogg Ch. 9:

1. List direct stakeholders
2. List indirect stakeholders
3. List intended values (what the system optimises for)
4. List excluded values (what it explicitly does not optimise for)
5. Identify conflicts between values
6. Identify mitigations for each conflict
7. Document trade-offs accepted

Output goes in `docs/decisions/<NNNN>-stakeholder-<short-name>.md` as an ADR
variant. The output is required before merge for `risk:high` issues. For
normal PRs, this is optional.

---

## How this is enforced (defence in depth)

1. **`.claude/checklists/ethics.md`** — the 8 questions in greppable form for
   centinela *(deferred to Epic 13)*
2. **`.github/PULL_REQUEST_TEMPLATE.md`** — same questions as PR body sections
   *(deferred to Epic 11)*
3. **`npm run ux:check`** — mechanical checks: axe-core, Lighthouse-CI,
   `prefers-reduced-motion` lint, contrast audit *(deferred to Epic 12)*

A failing ethics gate is classified as `ETHICS_OR_UX_FAIL` (distinct from
`BUILD_FAIL`) so the orchestrator routes back to forja with a different prompt
— "you shipped a dark pattern" needs different remediation than "you broke the
build".

---

## What centinela *can't* enforce

Presence of an answer is greppable. *Substance* of the answer is not. The
orchestrator (human or a future `etico` sub-agent) is responsible for catching
rubber-stamp "this serves the user" answers that don't survive scrutiny.

Per Concern #6 — only the human who shipped a feature can shoulder
responsibility for it. The `Closes #N` convention + `git blame` is the
identifier of record.

---

## References

- Fogg, B.J. (2003). *Persuasive Technology: Using Computers to Change What We
  Think and Do.* Morgan Kaufmann.
- European Commission (2022). [Digital Services Act, Article 25 — Online
  interface design and organisation.](https://eur-lex.europa.eu/eli/reg/2022/2065)
- W3C (2024). [Dark Patterns Group.](https://www.w3.org/community/dark-patterns/)
- Brignull, H. [deceptive.design](https://deceptive.design/) — taxonomy of dark
  patterns
- Reeves, B. & Nass, C. (1996). *The Media Equation.* CSLI Publications.
  Background on the social-actor framing.
