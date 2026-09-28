# Design — Tauri mobile packaging, Android first (Epic 29b)

## What we're building

A second opt-in layer, on top of Epic 29a's desktop scaffold, that lets an
Inceptor-derived project produce a signed Android App Bundle and (via a
human-gated one-time setup) upload it to Google Play's internal testing
track. iOS is explicitly deferred — Epic 29c, not started, not designed
here — for the same reason the sibling `watchboard` reference plan
deferred it: it needs a Mac CI runner, a $99/year Apple Developer Program
membership, and a materially different signing/provisioning flow. Doing
both at once would double the human-gated setup surface for no shared
benefit; Android alone already delivers a real, installable mobile build.

## Why this is additive to Epic 29a, not a separate track

Tauri v2's mobile targets are **not** a separate app — `tauri android init`
generates `src-tauri/gen/android/` (a real Android Studio/Gradle project)
*inside* the same `src-tauri/` Cargo project Epic 29a's `add-tauri.mjs`
already scaffolds, driven by the same `tauri.conf.json`. A project must run
`npm run add-tauri` (Epic 29a) **before** anything here applies. This spec
adds a second generator, `scripts/add-tauri-android.mjs`, that:

- Refuses to run if `src-tauri/` doesn't exist yet (clear error pointing at
  `add-tauri.mjs`), mirroring Epic 29a's own `--force`/existing-guard
  pattern.
- Patches `tauri.conf.json`'s `bundle.android` block (`minSdkVersion`) —
  Android-specific config `add-tauri.mjs` has no reason to know about.
- Adds the `tauri:android:*` npm scripts and merges in nothing new to
  `package.json` dependencies (the Tauri CLI is already a devDependency
  from Epic 29a).

## What's different from the desktop epic, concretely

1. **Unsigned is not a shippable end state.** Desktop's "produces an
   unsigned binary, disclose it" pattern doesn't carry over: Google Play
   will not accept an unsigned (or debug-signed) AAB at all — there is no
   "sideload it and see" middle ground the way there is on desktop. A
   *local, unsigned* debug build (`tauri android build` without release
   signing) is still useful for `tauri android dev`/device testing, and
   this spec's generator supports that — but the CI pipeline's whole
   purpose is the signed, uploaded artifact, which categorically requires
   credentials only a human can create.
2. **The app identifier locks in at first upload, permanently.** Unlike
   desktop (where `--identifier` is a reverse-DNS string with no external
   consequence beyond the local build), a Play Store `packageName` cannot
   change after the first Console upload without abandoning the listing
   entirely. `add-tauri.mjs` already asks for `--identifier` at desktop-add
   time — this spec's generator reuses that **same** value (read back out
   of the existing `tauri.conf.json`, not re-prompted) rather than risking
   a second, possibly-different identifier landing in the same project.
3. **No dist-size problem here, unlike the watchboard precedent.**
   Watchboard's `dist/` was 1.8 GB — 9× over Play's 200 MB AAB
   base-module cap — forcing a remote-load-vs-curated-bundle decision.
   Checked directly against Inceptor's own build: `dist/` is **~10 MB**
   (`_astro` 2.4 MB, `docs` 2.7 MB, `gallery` 1.9 MB, `_pagefind` 1.2 MB,
   the rest small). The bundled-`dist/` strategy Epic 29a already uses for
   desktop (`frontendDist: "../dist"`) carries over directly — no
   remote-load fallback needed as a default. Since this is a *template*
   feature, though, a downstream project's `dist/` could genuinely be
   large (heavy media, many locales) — the runbook documents `du -sh dist`
   as a pre-flight check and remote-load as a documented escape hatch, per
   watchboard's own Option A, rather than assuming every project is small.
4. **`targetSdkVersion` isn't a `tauri.conf.json` field at all.** Tauri's
   schema only exposes `minSdkVersion`; Google Play's *rolling* minimum
   target API (the exact number moves over time) must be patched directly
   into the generated `src-tauri/gen/android/app/build.gradle.kts`, in CI,
   after `tauri android init` runs and before the build step — verified
   against the watchboard plan's own adversarial-review finding of this
   exact gap. The CI workflow must re-verify the current number at
   execution time, not hardcode one from this spec's writing date.
5. **`bundle.targets` stays correctly unset, for the same reason as
   desktop.** Android/iOS bundle format is CLI-flag-driven
   (`tauri android build --aab`), not config-driven — the desktop spec
   already established the discipline of not asserting unverified Tauri
   config schema facts; this spec makes the same choice deliberately, not
   by omission.

## Architecture

```
scripts/
  add-tauri-android.mjs        # new — requires src-tauri/ to already exist

.github/workflows/
  tauri-android.yml            # new — separate from tauri-desktop.yml;
                                # different trigger shape (see CI below)

docs/runbooks/
  tauri-android.md             # new — operator runbook, mirrors
                                # tauri-desktop.md's structure and voice
```

**`scripts/add-tauri-android.mjs`** (run after `add-tauri.mjs`):

```
node scripts/add-tauri-android.mjs
```

- No `--name`/`--identifier` flags — both are read back out of the
  existing `src-tauri/tauri.conf.json` (written by Epic 29a's generator),
  never re-prompted, per the identifier-lock-in reasoning above.
- Refuses to run if `src-tauri/tauri.conf.json` doesn't exist: prints
  `✗ Run "npm run add-tauri" first — no src-tauri/ project found.` and
  exits 1.
- Patches `tauri.conf.json` to add a `bundle.android.minSdkVersion: 24`
  key (Android 7.0+, matching the watchboard reference's pinned value —
  a reasonable, unopinionated floor, not this spec's invention).
- Adds npm scripts: `tauri:android:init`, `tauri:android:dev`,
  `tauri:android:build`.
- Copies `docs/runbooks/tauri-android.md` into the target project, same
  copy-forward mechanism Epic 29a already established.

**CI (`​.github/workflows/tauri-android.yml`)** differs from desktop's in
trigger shape, not just content:

- Desktop's smoke workflow is `workflow_dispatch`-only forever — desktop
  builds are cheap to re-verify and nobody's shipping them to a store.
- Android's workflow is **also** `workflow_dispatch`-only for build
  verification, but the actual "cut a release" path (build → sign →
  upload to Play internal track) triggers on **pushing a version tag**
  (`v*`), matching the watchboard reference's pattern — a deliberate,
  versioned release action, not something that fires on every push to a
  feature branch. A project that never tags a release never triggers a
  Play Store upload, keeping the "opt-in, zero footprint until used"
  property intact even for the release path.
- Requires four Actions secrets for signing
  (`ANDROID_KEYSTORE_BASE64`/`_KEY_ALIAS`/`_KEY_PASSWORD`/
  `_KEYSTORE_PASSWORD`) and one for the Play Store service account
  (`PLAY_SERVICE_ACCOUNT_JSON`) — the workflow **fails loudly and early**
  (a dedicated "validate secrets" step) if any are unset, rather than
  failing confusingly deep inside a signing step. Naming: prefixed
  generically (`ANDROID_*`/`PLAY_*`), not project-specific
  (`WATCHBOARD_*` in the reference) — this is a template, the prefix
  should read the same in every project it's copied into.
- Needs a Java 17 (Temurin) + Android SDK/NDK toolchain step the desktop
  workflow never required. The reference plan pins NDK `26.1.10909125`
  and validates it only by a real first CI run, not a doc reference
  (Tauri's own docs no longer publish a version table for these) —
  **this spec does not assert those pins as fact for Inceptor's own CI**;
  the implementation plan must re-derive and empirically validate the
  toolchain pins the same way, not copy the reference's numbers on faith.

## Human-gated tasks (cannot be automated, ever)

Mirrors the reference plan's Task 1 and Task 7 exactly — named explicitly
so an implementation plan routes them to a human, not a subagent:

1. **Confirm the app identifier** before first upload (already collected
   by Epic 29a's `add-tauri.mjs --identifier`, but the runbook must
   surface an explicit "this cannot change later" warning at the moment
   `add-tauri-android.mjs` runs, not bury it in prose).
2. **Generate and store the signing keystore** (`keytool -genkey`,
   generated *outside* the repo working tree, saved to a password
   manager) and set the four `ANDROID_*` GitHub secrets.
3. **Create the Play Console app listing + service account**, complete
   whatever "App content" declaration Play Console requires before
   allowing any release (watchboard's own finding: this is
   unverified-until-you-hit-it, not confirmed-absent for internal
   testing), set `PLAY_SERVICE_ACCOUNT_JSON`.
4. **Package name availability** cannot be checked ahead of time via any
   API — the first real upload attempt is the actual test. A collision
   (even with a previously-deleted app) means picking a new identifier
   and restarting from step 1.

These are documented in `docs/runbooks/tauri-android.md`'s own dedicated
section, in the same voice as `tauri-desktop.md`'s "What this scaffold
does NOT do."

## Testing

- **Generator**: same pure-function-plus-CLI-wrapper pattern as
  `add-tauri.mjs` — a `readTauriConfig()`/`patchAndroidConfig()` pure
  function pair, unit-tested directly; an end-to-end test that runs the
  full `add-tauri.mjs` → `add-tauri-android.mjs` sequence into a scratch
  directory and asserts the resulting `tauri.conf.json` has both the
  desktop and Android config present and consistent (same `identifier`
  string in both, no accidental drift).
- **CI YAML**: actionlint-clean (this repo's own `ci.yml` gate), no new
  third-party GitHub Actions beyond what's strictly necessary — unlike
  desktop, this workflow legitimately needs `android-actions/setup-android`
  (no first-party equivalent exists) and `r0adkll/upload-google-play`
  (same); both must be SHA-pinned, with the pin looked up for real at
  implementation time, not guessed.
- **Real verification**: same structural limit as desktop's CI-dispatch
  gap, but *deeper* — desktop's local-build substitute (this session ran
  a real `tauri build` on macOS) has no mobile equivalent without an
  Android device/emulator, a local Android SDK/NDK, and — for the signed
  path specifically — the actual keystore and Play credentials. The
  generator and config-patching logic can be verified locally (unit +
  integration tests, `tauri android init` succeeding against a real
  Android SDK if one happens to be available). The signed build → Play
  upload path can **only** be verified by a human running Task 8's
  equivalent (first real dispatch) after the human-gated setup above is
  complete — this is not a gap this spec can close, structurally.

## Non-goals

- iOS (Epic 29c, not started, needs its own spec).
- Deep links, native push (FCM) — same reasoning as the watchboard
  reference: out of scope for a v1 thin wrapper.
- Reducing a downstream project's `dist/` size at the source — the
  runbook documents the remote-load escape hatch; actually shrinking a
  bloated build is a separate, project-specific effort.
- Automating any of the four human-gated tasks above — structurally
  impossible, not merely deferred.

## Docs / ROADMAP

- `docs/runbooks/tauri-android.md` — new, copied into target projects by
  `add-tauri-android.mjs`.
- `ROADMAP.md`'s existing Epic 29b entry (added when Epic 29a shipped)
  gets checked off against this spec once implemented; a new Epic 29c
  line added for the deferred iOS work.

---

## Addendum 2026-09-27 — APK / GitHub Release path

*Additive. Nothing above is rewritten; where this addendum and the original
text disagree ("five required secrets", "unsigned is not a shippable end
state"), this addendum is current.*

### Decision

The pipeline now produces an **installable APK** as a first-class
deliverable, next to — not instead of — the Play-bound AAB:

- **An APK is the deliverable when there is no Play listing yet.** The
  original spec framed "signed AAB uploaded to Play" as the only useful end
  state, which made the whole Android layer inert for any project that had
  not yet done the human-gated Play Console setup (or never will: internal
  tools, tester groups, a "download for Android" link on the project's own
  site). An `.aab` cannot be installed on a device at all; an `.apk` can.
- **AAB stays for Play.** Play requires AABs for new apps; that path, its
  `jarsigner` signing and `r0adkll/upload-google-play` upload are unchanged.
- **Play upload becomes optional; keystore signing stays required on a tag
  push.** `PLAY_SERVICE_ACCOUNT_JSON` absent ⇒ `::notice` + Play steps
  skipped, run stays green. The four `ANDROID_*` keystore secrets remain a
  hard requirement on `v*` tags, because an unsigned release APK is as
  useless as an unsigned AAB. Since `secrets.*` cannot appear in `if:`, the
  validation step exposes a `play=true|false` output every Play step is
  gated on.
- **The signed APK and AAB are attached to a GitHub Release for the tag**
  (`softprops/action-gh-release`, SHA-pinned like every other third-party
  action here). That needs `contents: write`, which is granted **only to a
  separate `release` job** that does nothing but download the signed
  artifacts and publish them — the `build` job (keystore, Play credentials,
  `npm ci`, all toolchain actions) keeps the workflow's read-only default.
- **Zero-setup path:** `workflow_dispatch` additionally builds a
  `--debug` APK (Gradle signs it with the Android debug key, so it installs
  on any device) and uploads it as an artifact alongside the unsigned
  release APK. A project with no secrets configured at all can hand a
  tester an installable build.
- **Own icon:** the icon source is a repository *variable*
  (`vars.TAURI_ICON_SOURCE`, default `public/icons/pwa-512.png`), validated
  to exist with a `::error` otherwise. Square PNG, ≥ 512 px, 1024
  recommended.

### Facts verified at implementation time (not assumed)

- Tauri CLI `tauri android build` accepts `--apk`, `--aab` and `--debug`
  (`crates/tauri-cli/src/mobile/android/build.rs`, `Options.debug`); with
  neither format flag it builds both an APK and an AAB.
- The release APK's filename is **not stable**: cargo-mobile2's
  `Profile::Release.suffixes()` is `["release", "release-unsigned"]` and the
  CLI returns whichever exists. With no `signingConfig` in the generated
  Gradle project (the Tauri template only wires one when a
  `keystore.properties` is present), AGP emits
  `app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`.
  The workflow therefore locates the APK with `find … -path '*/release/*'
  -name '*.apk'` plus an exactly-one count check — the same discipline as
  the existing "Sign AAB" step — never a hardcoded filename.
- `apksigner` (from `build-tools;34.0.0`, already installed by the SDK
  setup step) is required for the APK: Android 11+ rejects v1-only (JAR)
  signatures on install. It takes passwords as `env:` references, so
  unlike the `jarsigner` AAB step no password is on the command line.
  `zipalign -c` is checked first and alignment repaired only if needed, as
  v2+ signatures must be applied post-alignment.
- Pins resolved via `git ls-remote --tags` on 2026-09-27:
  `softprops/action-gh-release` v2.0.5 =
  `69320dbe05506a9a39fc8ae11030b214ec2d1f87`;
  `actions/download-artifact` v8.0.1 =
  `3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c`.

### What did not change

Opt-in guard (`bundle.android` present or quiet skip), `tag == v<version>`
check, `umask 077` keystore decode + `always()` shred, service-account file
cleanup, `concurrency` without `cancel-in-progress`, identifier read back
from `tauri.conf.json`, `minSdkVersion: 24`, the `targetSdk` patch, and
`workflow_dispatch` never signing with the release key or publishing
anything.

### Testing added

- `src/tests/add-tauri-android.test.ts` — the generator now adds
  `tauri:android:apk` / `tauri:android:apk:debug` with the same
  never-clobber-a-differing-script semantics.
- `src/tests/workflow-tauri-android.test.ts` — text-level guards on the
  workflow: every `uses:` SHA-pinned with a version comment, `contents:
  write` present exactly once and only inside the `release` job, Play
  steps gated on the `play` output, keystore shredded after *both* signing
  steps, icon var + `::error`, find-based APK location, apksigner `env:`
  passwords.

