# Tauri desktop wrapper

Operator runbook for the opt-in Tauri v2 desktop shell added by
`scripts/add-tauri.mjs`. This wraps the existing static build
(`npm run build` → `dist/`) in a native window for Windows/macOS/Linux.
It does not touch the web build path — `npm run dev` / `npm run build`
work exactly as before.

## Prerequisites (local dev only — not required for CI)

1. **Rust toolchain** — GitHub Actions runners ship one preinstalled;
   locally, install via [rustup](https://rustup.rs/) if you don't have one:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. **Linux only** — Tauri's WebView needs system packages. Check
   [Tauri's official prerequisites doc](https://v2.tauri.app/start/prerequisites/)
   for your distro's current package names (these have changed between
   webkit2gtk versions before — don't assume a list here is still current).
3. **Tauri CLI** — installed as a `devDependency` by `npm install` once
   this scaffold has been added to your project.

## First run

```bash
npm install
npx tauri icon <path-to-a-512x512+-source.png>   # generates src-tauri/icons/*
npm run tauri:dev
```

Point `tauri icon` at any 512×512+ source PNG your project has — Inceptor's
own repo ships one at `public/icons/pwa-512.png`, but a
`create-inceptor-app`-generated project only writes `public/favicon.svg` by
default and has no `public/icons/` directory; you may need to add a source
PNG first (e.g. exported from your app's logo) before this command works.

## Production build

```bash
npm run build          # produces dist/, same as the web build
npm run tauri:build    # produces a native installer under
                        # src-tauri/target/release/bundle/
```

Build with a plain `npm run build` (no `ASTRO_BASE` set) — a subpath `base`
breaks asset resolution inside the desktop WebView; the desktop app is not
deployed under a URL subpath the way the web version is. (This repo's own
GitHub Pages deploy sets `ASTRO_BASE=/inceptor` — don't carry that env var
into a Tauri build.)

The bundle format Tauri produces is OS-dependent (`.dmg`/`.app` on macOS,
`.msi`/`.exe` on Windows, `.deb`/`.AppImage` on Linux) — `tauri.conf.json`
deliberately doesn't pin a specific target list, so Tauri builds whatever's
appropriate for the OS it's running on.

## No Content-Security-Policy is applied by default

`app.security.csp` is unset/null in the generated `tauri.conf.json` — the
`security` block isn't present at all. That means Tauri's IPC hardening and
page CSP are both off in the scaffold as shipped. Set a real policy (see
[Tauri's security docs](https://v2.tauri.app/security/csp/)) before shipping
this to real users; this needs care, since a wrong CSP can silently break
asset loading (styles, scripts, fonts) if the `style-src`/`script-src`/nonce
handling isn't verified against how the Astro build actually emits assets.

## What this scaffold does NOT do

- **No code signing.** Every build from this scaffold is unsigned. On
  macOS in particular, some OS permissions (e.g. Full Disk Access) bind to
  a signed bundle's identity — an unsigned app loses that permission on
  every rebuild. If your project needs this, set up a real Apple
  Developer / Windows code-signing certificate yourself; that's a
  per-project decision this template doesn't make for you.
- **No auto-update.** Tauri has an updater plugin; not wired in here.
- **No store distribution.** This is a local/direct-download desktop
  build, not a Mac App Store or Microsoft Store submission pipeline.
- **No mobile.** iOS/Android is a separate, not-yet-built addition
  (tracked in ROADMAP.md as Epic 29b).

## Capabilities

`src-tauri/capabilities/default.json` grants only `core:default` — no
shell execution, filesystem access, or system tray. If your project needs
more, extend this file deliberately; see
[Tauri's capabilities docs](https://v2.tauri.app/security/capabilities/).

## Cross-origin gotcha to watch for

A Tauri desktop WebView's origin is **not** your production domain (it's
typically `tauri://localhost` or `https://tauri.localhost`, depending on
platform — verify the exact value for your Tauri version if this matters
to you). If your project has any code that compares against a hardcoded
origin string — a service-worker scope guard, a CORS allowlist on an API
route — audit it before relying on that code path inside the desktop app.
Inceptor's own scaffold has no such code as of this writing (its PWA
manifest uses a relative `scope`/`start_url`, not a full origin), but
it's easy to introduce one later without realizing it only breaks inside
a wrapped WebView.

## Troubleshooting

- **Blank/white window** — the dev server (`npm run dev`) didn't finish
  starting before Tauri tried to load it. Wait for the local URL to print,
  then retry `npm run tauri:dev`.
- **Build fails on Linux with a webkit2gtk error** — see the
  prerequisites link above; package names shift between Tauri/webkit2gtk
  releases.
- **Icon errors** — re-run `npx tauri icon <path-to-your-source.png>` (see
  "First run" above for which source PNG to point it at); the generated
  files under `src-tauri/icons/` are gitignored and always regenerate from
  that one source PNG.
