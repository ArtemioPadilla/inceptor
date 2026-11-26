---
title: "From the template's landing to its own: the design round behind Buró del Pueblo"
description: What changed when a project instanced from Inceptor stopped at the design before the code, and what came back into the scaffold.
pubDate: 2026-11-26
tags:
  - design
  - case-study
  - changelog
author: artemiopadilla
---

Buró del Pueblo was instanced from Inceptor. For months its landing was what
the generator writes: a centred title, a paragraph, cards in the template's
emerald. It worked, it passed every check, and it looked like every other
project that starts here.

This is what it took to change that, and what the scaffold learned from it.

## The round

The founder asked for something "more modern, more elegant, with more impact
at first sight". The first answer was not code. It was three sketches of the
landing in three different directions: a dark editorial one, a loud graphic
one and a clean product-first one. Then three more that mixed the two he
liked. Six directions before a line of the real page.

He picked the mix of the loud one and the clean one. From there the round
kept narrowing: the whole page, then at phone width, then light and dark.

## The idea that belonged to the product

A palette and a font pairing did not make the page specific. What did was a
question: what does this product have that no other does? It launches in
fifteen colonias of one borough of Mexico City. So the hero became a street
map of those colonias, drawn from OpenStreetMap, with one pin per colonia in
its real position.

The same question gave it a mark. The product's promise is "ask the
neighbourhood before you open the door", so the logo is a door ajar.

Neither came from the template, and neither could have.

## What the tests already knew

Three times the design ran into a rule nobody had mentioned, written only in
a test: the page title must be the first clause of the H1; the landing must
not link to pages that are not public yet; the landing may make twelve
requests, not thirteen. Each one surfaced late. They were requirements all
along.

## The colours it could not use

The first palette was blue with yellow. The founder noticed it was the
palette of a credit bureau the product must not be confused with. Green was
out too: in that market a green badge reads as "approved", which the product
must never claim. The brand that came out of it, rosa mexicano with amber, is
defined as much by what it avoids as by what it uses.

## What came back into Inceptor

- **A design round in the loop.** A fourth sub-agent, `dedalo`, runs before
  planning: it sketches several directions, the human picks, and the decision
  is written down. `centinela` rejects page work with no approved spec.
- **`--accent`**, so a project chooses its action colour at generation
  instead of inheriting the template's green.
- **A highlight and two supporting fills**, derived from the accent and
  tested for contrast.
- **Marketing blocks**, generalised from that landing: the hero with a
  masked graphic, the highlight headline, paired cards, a level ladder.
- **[Three starting looks](/looks/)**, so the first page is not a centred
  title.
- **Fonts served by the site**, with a script that computes their fallbacks.
- A brand page template, a recipe for theme-aware graphics, and the lessons
  above in `docs/lessons.md`.

## What it does not fix

A scaffold can raise the floor. It cannot decide what a product should look
like. The blocks and the looks, used as they come, will make projects look
alike in a new way. The part that mattered was the round, and the question
about what only this product has. That part is now a step the scaffold asks
for, and the rest is up to whoever builds.

This post has no screenshots: the redesigned site is still in its beta stage.
