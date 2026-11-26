# Lessons log

A running log of non-obvious lessons learned while building Inceptor — the
kind of thing that should change how we work, not just a changelog.

`centinela` appends an entry here when it rejects the same issue twice (the
double-reject trigger): the second rejection means the first fix diagnosis was
wrong, which is exactly the signal worth capturing.

**Format:** newest first. Each entry: date · one-line lesson · why it bit us ·
the rule we adopted.

---

## 2026-11-26 · Images rendered from SVG text depend on the machine's fonts

`scripts/generate-og.mjs` (and any script that rasterizes SVG `<text>` with
sharp/librsvg) uses the fonts installed where it runs. Re-branding Buró del
Pueblo, the share image came out in a fallback face until the brand font was
installed locally, and its family name in fontconfig was not the CSS one.

**Rule:** a generated image that contains text names the exact font it needs
in the script header, and the PR says which font it was rendered with. If the
image must be reproducible, convert the text to paths or bundle the font.

---

## 2026-11-26 · `overflow-wrap: anywhere` on `body` breaks words inside an inline highlight

With `overflow-wrap: anywhere` on `body` (set so long words cannot force
sideways scrolling), a highlighted inline `<span>` that starts mid-line broke
its first word across two lines ("pregúntal" / "e") instead of wrapping whole.

**Rule:** a highlight block around a phrase is `inline-block`, so the phrase
wraps as a unit; check any decorated inline text at desktop and at 320 px.

---

## 2026-11-26 · Adding images can break the Lighthouse request budget, and it does not show locally

A hero built from three SVG layers took the landing from 12 to 13 requests.
`npm run check` and the Playwright suite were green; only Lighthouse CI failed,
after the push.

**Rule:** before adding an image, script or font file to a budgeted page,
count the requests it adds against the Lighthouse budget, and merge files that
can share one request.

---

## 2026-11-26 · Product rules live in dist tests that only run at the end of `npm run check`

A redesign added links from the landing to pages a dist test forbids linking
yet. Type-check, unit tests and the build were green; the rule only surfaced
when `test:dist` ran against the built HTML.

**Rule:** before redesigning a page, grep the dist and e2e tests for its
selectors and links, and treat what they assert (headings, link targets,
accessible names) as requirements, not as tests to update afterwards.

---

## 2026-06-01 · `astro check` is stricter than `astro build`

`astro build` tolerated island imports written with a `.tsx` extension; `astro
check` (which CI runs via `npm run check`) rejected them with `ts(5097)`. A
"build clean" claim that only ran build/tsc/test missed it.

**Rule:** validate with the full `npm run check` (which includes `check:astro`)
before claiming green — never just the sub-commands. Island imports in `.astro`
pages are extensionless.

---

<!-- Append new lessons above this line. -->
