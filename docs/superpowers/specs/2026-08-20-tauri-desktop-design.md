# Design — Tauri desktop packaging (opt-in), Epic 29a

## What we're building

An opt-in way for any Inceptor-derived project to wrap its existing static
build in a Tauri v2 desktop shell (Windows/macOS/Linux) and get a real,
installable binary — without that capability existing (or costing anything)
in a project that never asks for it.

Concretely: a generator script (`scripts/add-tauri.mjs`) plus a checked-in
template (`templates/tauri-desktop/`) that, when run, scaffolds `src-tauri/`
into the target project, wires up npm scripts, and prints a runbook. Nothing
about the default `npm run dev` / `npm run build` path changes for projects
that never run it.

Mobile (iOS/Android) is an explicit non-goal here — separate spec, Epic 29b,
once this ships and once there's a concrete project that actually needs a
store listing (see "Why split" below).

## Why this shape, not another one

Three decisions already made in conversation, restated here so the spec is
self-contained:

1. **Opt-in, not core.** No project generated from Inceptor carries Tauri/Rust
   weight unless it asks for it.
2. **A layer-in script, not an init-time flag.** `docs/POSITIONING.md` §4
   explicitly rules out an interactive picker at `create-inceptor-app` time —
   "that question is meaningless four seconds after the command runs." Tauri
   support has to be something a project reaches for *later*, the same
   mechanism already described there for enabling governance/TDD tiers:
   present-and-documented, dormant until asked for.
3. **Desktop before mobile, as two specs.** Mobile needs store accounts,
   signing certs, and (for iOS) a Mac runner + Apple Developer account — none
   of which I can provision, and none of which block desktop. Splitting means
   80% of the value (a real desktop binary) ships without waiting on
   credentials only a human can create.

## What we're borrowing from two sibling projects' Tauri work

Two other repos (`Disk-Use-Analyzer`, a macOS tray app; `watchboard`, an
Android/Play Store wrapper) did adjacent Tauri integrations recently, each
adversarially reviewed. Lessons that transfer here:

- **Capabilities are deny-by-default in Tauri v2.** Nothing works — no tray,
  no shell access, no filesystem — until declared in a capabilities file.
  The generated scaffold ships the smallest capability set that makes a
  plain window work, and nothing more.
- **A wrapped WebView's origin is not your production origin.** Tauri serves
  the app from `https://tauri.localhost` (or a custom scheme), not the site's
  real domain. Any code that compares against a hardcoded origin string (a
  service-worker scope guard, a CORS allowlist on an API route) silently
  breaks once wrapped. Inceptor itself has no such code today (checked: the
  PWA manifest's `scope`/`start_url` already use the relative `BASE`, not a
  full origin) — but a downstream project easily could add one. The
  generator's printed runbook includes this as an explicit check.
- **Desktop `bundle.targets` (dmg/msi/nsis/deb/rpm/appimage) is a real,
  valid `tauri.conf.json` field** — the invalid-config trap the sibling
  projects hit was mobile-specific (bundle format there is a CLI flag, not
  config). Desktop can and should set this normally.
- **Icons: one source PNG, generated on demand, never committed.** Inceptor
  already has `public/icons/pwa-512.png` (512×512, existing PWA icon) — reuse
  it as the Tauri icon source instead of asking for a new asset.
- **Signing/credentials are a human-gated step, named as such.** The base
  template does not sign, notarize, or publish anything — that requires a
  per-project Apple/Microsoft/Linux-repo identity only the project owner can
  provision. The generator's runbook says so explicitly rather than silently
  producing an unsigned binary with no explanation.

## Architecture

```
templates/tauri-desktop/          # checked in, never executed directly
  src-tauri/
    Cargo.toml
    build.rs
    src/lib.rs
    src/main.rs
    capabilities/default.json     # minimal: core:default only
    tauri.conf.json.template      # placeholders: __NAME__, __IDENTIFIER__
  gitignore.snippet                # appended to target's .gitignore
  package.snippet.json             # devDependency + scripts to merge in

scripts/
  add-tauri.mjs                    # the generator — mirrors init.mjs's
                                    # copy-and-rewrite pattern

docs/
  runbooks/tauri-desktop.md        # printed/linked after the generator runs
```

**`scripts/add-tauri.mjs`** (run from a project root, whether that's Inceptor
itself for local verification or any `create-inceptor-app`-generated
project):

```
node scripts/add-tauri.mjs --name my-app --identifier com.example.myapp
```

- Copies `templates/tauri-desktop/src-tauri/` into `./src-tauri/`, replacing
  `__NAME__`/`__IDENTIFIER__` placeholders in `tauri.conf.json` and
  `Cargo.toml` (same substitution style `init.mjs` already uses for
  de-branding).
- Merges `templates/tauri-desktop/package.snippet.json`'s `devDependencies`
  (`@tauri-apps/cli@^2`) and `scripts` (`tauri`, `tauri:dev`, `tauri:build`)
  into the target's `package.json`, preserving whatever's already there
  (no destructive overwrite of an existing `scripts` block).
- Appends `templates/tauri-desktop/gitignore.snippet` to `.gitignore` if
  those patterns aren't already present.
- Prints a short "next steps" pointing at `docs/runbooks/tauri-desktop.md`
  (which is itself copied into the target project, not left only in
  Inceptor's own docs).
- Refuses to run twice into the same target without `--force` (checks for
  an existing `src-tauri/` first) — same guard style as `init.mjs`'s
  existing-destination check.

**`tauri.conf.json`** ships with:

- `build.frontendDist`: `"../dist"` (matches Inceptor's `output: 'static'`
  build target) and `devUrl`: `"http://localhost:4321"` (Astro's default
  dev port).
- `bundle.active: true`, plus a `bundle.targets` value selecting desktop
  formats (dmg/msi/nsis/deb/rpm/appimage per the sibling projects'
  findings) — **the exact accepted value/shape (a literal `"all"`, an
  array, or per-OS resolution) is asserted nowhere else in this doc and
  must be verified against the installed `@tauri-apps/cli`'s real schema
  during implementation**, not assumed from memory. This is the same class
  of mistake the sibling projects' adversarial reviews caught in their
  first drafts.
- `app.security.csp`: left at Tauri's default (not `null`) — the sibling
  projects' `csp: null` was an accepted trade-off for *their* specific
  needs; the base template has no reason to weaken IPC hardening by
  default, and a project that needs to loosen it can do so deliberately.
- `identifier`: placeholder, must be set by whoever runs the generator —
  this becomes permanent-ish (changing it after any real distribution is
  disruptive) so the generator prompts for it rather than defaulting to
  something like `com.example.app`.

**`capabilities/default.json`**: `core:default` only. No shell access, no
filesystem access, no tray. A project that needs more extends this
deliberately — the template's job is "a plain window shows the site," not
guessing at what a downstream project might eventually want.

## CI

A new, separate workflow, **not** part of the default `ci.yml` pipeline
(nothing in it runs on every push/PR — it would fail on every repo that
hasn't run the generator):

`.github/workflows/tauri-desktop.yml`:
- Trigger: `workflow_dispatch` only, for now — verifies the generator +
  scaffold actually build, on demand. (A future "build on tag" release
  workflow is a per-project decision, not something the base template
  should assume.)
- Matrix: `ubuntu-latest`, `macos-latest`, `windows-latest`.
- Steps: checkout → Node → Rust (`dtolnay/rust-toolchain@stable`) → run
  `scripts/add-tauri.mjs` into a scratch dir (or directly at repo root in a
  disposable CI checkout — TBD in the plan) → `npm run build` →
  `npx tauri build` (unsigned, debug-signed defaults are fine for CI
  verification) → upload the resulting binary/installer as a build
  artifact (short retention, e.g. 7 days — this is a "does it build," not
  a "ship this" artifact).
- No secrets, no signing, no publishing. This job's only job is proving the
  generated scaffold is buildable on all three desktop OSes.

## Testing

- **Generator itself**: a Vitest test that runs `add-tauri.mjs` into a
  temp directory and asserts the expected files exist, placeholders were
  substituted, and the merged `package.json` is valid JSON with the
  expected scripts present — mirrors how `scripts/init.mjs` would ideally
  be tested (check whether it already has coverage; if not, this is a
  chance to add it for both, not scope creep, since they share a pattern).
- **Config validity**: not just `JSON.parse` — actually invoke
  `npx tauri --version` and a config-parsing command (e.g. `tauri icon` or
  a dry-run) against the generated scaffold, since a `JSON.parse` check
  would have passed even the sibling projects' invalid-field mistakes.
- **CI**: the desktop build matrix above is the real end-to-end test —
  scaffold → build → artifact, on all three OSes, on demand.
- **Rust side**: the scaffold ships with zero custom Rust logic (a plain
  window, no commands) at this stage, so there's nothing to unit-test yet
  beyond `cargo check`/`cargo clippy` passing in the CI job. If a future
  project adds real Rust logic via this path, that project's own CI picks
  up `cargo test` the way the sibling projects' plans did.

## Error handling / guardrails

- Generator refuses to overwrite an existing `src-tauri/` without
  `--force` (data-loss guard, matches `init.mjs`'s existing-output check).
- Generator validates `--identifier` looks like a reverse-DNS string
  (`^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$`) before writing it — a malformed
  identifier is cheap to catch here and expensive to discover after a
  first real build/signing attempt downstream.
- The runbook explicitly calls out (not silently omits) that this template
  produces an **unsigned** binary — code signing, notarization, and any OS
  permission that binds to a signed identity (as the macOS sibling project
  hit) are per-project follow-ups, documented as "when you need this" not
  bundled in.

## Non-goals (this spec)

- Mobile (iOS/Android) — Epic 29b, separate spec, after this ships.
- Auto-update (Tauri's updater plugin) — not needed until a project ships
  past internal testing.
- Code signing / notarization / installer publishing — per-project,
  human-provisioned, documented but not implemented here.
- A system tray / menu-bar variant — the sibling macOS project's tray
  design doesn't generalize (GNOME's lack of a default tray, Linux's
  file-based tray icon mechanism) and isn't what a generic "wrap the site
  in a window" template needs. If a future project wants a tray, that's
  its own addition on top of this scaffold, not a base-template default.
- Changing `scripts/init.mjs`'s archetypes — Tauri is not a fourth
  archetype; it stays a separate, later, opt-in layer per the positioning
  decision above.

## Docs / ROADMAP

- New `docs/runbooks/tauri-desktop.md` (copied into target projects by the
  generator, and readable in Inceptor's own repo as the canonical source).
- `ROADMAP.md` gets a new **Epic 29 — Desktop packaging via Tauri
  (opt-in)** entry, checklist mirroring the pieces above, with a "See
  Epic 29b (mobile), not yet started" forward pointer.

## Open question for the implementation plan

Whether the CI verification job runs the generator against a **scratch
directory** (closer to simulating a real downstream project) or **directly
into this repo's own checkout in CI only, never committed** (simpler,
closer to what a contributor would do locally). Leaning scratch-directory
for fidelity, but this is a plan-level detail, not a design fork — noting
it here so the plan doesn't silently pick one without a reason.
