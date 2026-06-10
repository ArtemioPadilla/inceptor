---
title: The 8-item ethics checklist
description: Tiered ethics gate every UI PR passes.
---

Every UI-affecting PR passes this checklist before merge. The checklist is tiered
by PR surface area so docs-only and typo PRs don't get bogged down.

## Tiers

| Tier | Triggers when the diff touches… | Required items |
|---|---|---|
| **Tier-0** (skip) | Only `docs/**`, `*.md`, `*.mdx`, `tests/**`, or typo-shaped changes | (none) |
| **Tier-1** (UI tweak) | `src/components/**`, `src/pages/**`, `.github/ISSUE_TEMPLATE/**` without new affordances / telemetry | **#1, #7, #8** |
| **Tier-2** (new persuasive surface) | Same paths *with* new affordances, new flows, new telemetry, new network calls, new persistent state | **#1, #2, #6, #7, #8** (Functional Triad may promote #3, #4, #5) |

See the [Functional Triad page](/docs/ethics-ux/framework/) for how `prometeo` promotes optional items to required.

## The 8 items

### 1. Intent declared *(required at every non-zero tier)*

**Q:** What behaviour change does this PR push the user toward, and whose benefit does it serve?

Without explicit intent, persuasion happens by accident.

- "Dark-mode toggle persists preference to reduce eye strain — user comfort" ✓
- "Auto-opens upsell modal after 3 page views — drives plan upgrades" ⚠ (not
  necessarily wrong, but must be acknowledged so the rest of the checklist can
  be applied honestly)

### 2. No deception, no coercion *(required at tier 2)*

**Q:** Does any copy, default, or affordance mislead about consequences or remove a reasonable opt-out?

Patterns to flag: pre-checked subscribe boxes, "Cancel" buttons that confirm,
confirmshaming, disguised ads, roach-motel signups, false hierarchy (where a
destructive action has greater visual weight than the privacy-preserving alternative).

### 3. Asymmetric persistence justified

**Q:** If the UI nags, retries, or auto-reopens, is the user clearly in control of stopping it?

Covers: PWA install prompts (must respect dismissal ≥ 7 days), update toasts with
"later" option, cookie banners defaulting to least invasive, modals dismissible by
ESC and outside click, scroll-jacking, `beforeunload` traps.

### 4. Borrowed credibility honest

**Q:** Do badges, charts, or "AI-powered" labels imply more authority than the system actually has?

Examples: confidence bars need "based on N samples" caveat; "Trusted by 10,000
developers" needs a real source; star ratings need sample size disclosure.

### 5. Emotional cues are reciprocal or disclosed

**Q:** Does the UI express feelings without a way for the user's emotion to alter the system?

Examples to flag: streak-shaming UI, "We're sad to see you go" cancellation flows,
notification badges that count explicitly muted items.

### 6. Surveillance is overt and supportive *(required at tier 2)*

**Q:** Is any telemetry visible to the user at the moment of capture, and used for help, not punishment?

**Current status:** FeedbackFAB passes (capture is overt — user clicks send).
HydrationCanary's silent error capture is borderline — Epic 12 privacy-toast
follow-up tracks this.

### 7. Vulnerable-group impact considered *(required at every non-zero tier)*

**Q:** Could a child, non-native reader, anxious / low-vision / motor-impaired user be harmed by this pattern?

Examples: motion ignoring `prefers-reduced-motion`, time-pressured CTAs, dense text
without summary, sole reliance on color, tap targets < 44×44 px.

### 8. Unintended-but-predictable outcomes named *(required at every non-zero tier)*

**Q:** List at least one foreseeable misuse and the mitigation.

Examples:
- "Showcase confetti could trigger seizures → gated behind `prefers-reduced-motion`"
- "Public IssuesList could expose contributor email addresses → mask email field"
- "FeedbackFAB could be abused for spam → rate-limited at the GH issue API layer"

## Enforcement

1. **`.github/PULL_REQUEST_TEMPLATE.md`** — checklist questions as PR body sections
2. **`npm run ux:check`** — mechanical checks: axe-core, Lighthouse-CI, `prefers-reduced-motion` lint, contrast audit *(Epic 12)*
3. **centinela** — greps for required-item answers before APPROVED verdict

A failing ethics gate returns `ETHICS_OR_UX_FAIL` (distinct from `BUILD_FAIL`) so
the orchestrator routes back to `forja` with a different prompt.

Full framework → [`docs/ETHICS.md`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/ETHICS.md)
