---
title: Persuasive-tech framework
description: Fogg's Functional Triad applied to this scaffold.
---

This scaffold ships persuasive technology — UI affordances that change what users
think and do. Per BJ Fogg's *Persuasive Technology* (2003), we classify every
persuasive feature by its Functional Triad corner before writing code.

## Fogg's Functional Triad

Every persuasive feature is classified by what role the computer plays:

| Role | Pattern | Example in this repo |
|---|---|---|
| **Tool** | Extends a user capability | FeedbackFAB reduces the ability cost of filing a bug report |
| **Medium** | Presents experience | ErrorBoundary narrates failure to the user |
| **Social actor** | Takes on persona / role | ThemeToggle's `aria-pressed` implies awareness; the sub-agent loop plans on your behalf |

`prometeo` classifies each `type:feat` issue by triad corner in its plan output
so `forja` sees the matching ethical risks before writing code.

## Persuasive patterns already in this repo

Named in Fogg's vocabulary so future contributors can reason about them:

- **FeedbackFAB** — persistent Tool + Suggestion technology + **Kairos** (right-time
  intervention — the badge surfaces *after* errors fire, exactly when motivation to
  report peaks). The silent diagnostics capture is borderline surveillance — tracked
  in Epic 12 (privacy toast).
- **ErrorBoundary fallback** — Social-Actor consolation + Reduction. It speaks
  ("Something went wrong in this island") and offers one-click recovery.
- **The sub-agent orchestrator** — **Tunneling** technology. Funnels you through
  *issue → branch → PR → merge* with the dependency chain pre-computed. Carries
  ethical concern #4 (asymmetric control: you can stop, but can't take a path the
  tunnel doesn't allow).
- **Issue templates** — ability-reducers lowering the cost of well-formed contributions.
- **ThemeToggle, PWA install prompts** — Social-Actor cues with surface credibility
  implications.

Naming these explicitly is half the discipline. Future features should declare their
triad corner in the PR description.

## Six unique ethical concerns of persuasive computing

Computers persuade differently from people. The six concerns the [8-item checklist](/docs/ethics-ux/checklist/) maps to:

1. **Novelty** masks intent — users haven't seen this pattern, can't read motivation
2. Computers borrow **undeserved credibility** — badges imply more authority than the system has
3. **Persistence** — software repeats persuasion indefinitely
4. Computers control **asymmetric affordances** — users opt out only along paths the system allows
5. Emotions are **one-way** — UI can express, users can't change the system back
6. Computers cannot **shoulder responsibility** — only the human who shipped them can

## Functional Triad → required-item promotion

`prometeo` classifies every `type:feat` issue by Functional Triad corner and that
classification promotes optional checklist items to required for the issue:

| Triad corner | Optional items auto-promoted to required |
|---|---|
| **Tool** (extends capability) | #3 (asymmetric persistence) |
| **Medium** (presents experience) | #5 (emotional reciprocity) |
| **Social actor** (takes persona / makes claims) | #4 (borrowed credibility), #5 (emotional reciprocity) |

## References

- Fogg, B.J. (2003). *Persuasive Technology: Using Computers to Change What We Think and Do.* Morgan Kaufmann.
- European Commission (2022). [Digital Services Act, Article 25.](https://eur-lex.europa.eu/eli/reg/2022/2065)
- Full framework → [`docs/ETHICS.md`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/ETHICS.md)
