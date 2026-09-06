# Lessons log

A running log of non-obvious lessons learned while building Inceptor — the
kind of thing that should change how we work, not just a changelog.

`centinela` appends an entry here when it rejects the same issue twice (the
double-reject trigger): the second rejection means the first fix diagnosis was
wrong, which is exactly the signal worth capturing.

**Format:** newest first. Each entry: date · one-line lesson · why it bit us ·
the rule we adopted.

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
