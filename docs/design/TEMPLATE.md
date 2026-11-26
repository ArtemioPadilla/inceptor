---
# proposed | approved. Only a human sets `approved`; centinela reads this line.
status: proposed
date: YYYY-MM-DD
# The page, flow or surface this spec covers.
scope: …
# Folder with the sketches the decision was made on.
sketches: docs/design/sketches/…
---

# Design: …

<!--
Written by dedalo after the design round, approved by a human, read by
prometeo and forja. A builder should be able to build the page from this file
without asking what it should look like. Replace every "…" and delete these
comments.
-->

## Intent

<!-- What the product is, who lands here, and the one thing they should do. -->

## Directions considered

<!-- One row per sketch, including the ones that lost. -->

| Direction | Axis it explores | Strength | Cost |
| --------- | ---------------- | -------- | ---- |
| A · …     | …                | …        | …    |

## Chosen direction

<!-- Which one, what was taken from the others, and why. In the human's words where possible. -->

## Palette

<!-- Tokens, never hex in components. Say what each colour is for and which text goes on it.
     Say which colours are ruled out and why (docs/foundation/brand.md). -->

| Token | Light | Dark | Use |
| ----- | ----- | ---- | --- |
| `--primary` | … | … | … |

## Type

| Use | Family | Weight | Token |
| --- | ------ | ------ | ----- |
| Display | … | … | `--font-display` |
| Text | … | … | `--font-sans` |

## The product's own idea

<!-- The one thing on this page that only this product has (its data, its place, an
     object from its world), and how it is drawn. If there is none yet, say so. -->

## Layout

<!-- Section by section, at desktop and at phone width. What moves, what is hidden,
     what stays on the first screen. Light and dark. -->

## Requirements found in tests

<!-- What the existing tests assert about this page (headings, link targets, accessible
     names, request and print budgets, CSP). These are requirements, not obstacles. -->

- …

## Out of scope

- …

## Open items

<!-- Decisions still the human's, assets still missing, things not verified. -->

- …
