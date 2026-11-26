---
description: Run a design round before building a page — sketches of several directions, then a spec in docs/design/.
---

Dispatch the `dedalo` sub-agent for the scope the user names (a page, a flow
or "the brand"). If no scope is given, ask which page.

1. `dedalo` reads the product and the tests, then writes three to six
   self-contained sketches under `docs/design/sketches/<slug>/`.
2. Show the user where the sketches are and each direction's strength and
   cost. The user picks, mixes or asks for another round.
3. `dedalo` writes `docs/design/YYYY-MM-DD-<slug>.md` from
   `docs/design/TEMPLATE.md`, with `status: proposed`.
4. The user sets `status: approved`. Only then hand the spec to `prometeo`.

Never mark a spec approved on the user's behalf.
