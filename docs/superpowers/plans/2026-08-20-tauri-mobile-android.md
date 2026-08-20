# Tauri Android Packaging (Epic 29b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Tasks 5 and 6 are explicitly human-only — never dispatch a subagent for them; hand them to the user directly.**

**Goal:** Ship a second opt-in generator (`scripts/add-tauri-android.mjs`) that layers Android support onto a project that already ran Epic 29a's `add-tauri.mjs`, plus a CI pipeline that builds, signs, and uploads a signed AAB to Google Play's internal testing track on a version-tag push — with the credential-provisioning steps that make that pipeline actually usable explicitly routed to a human, not automated.

**Architecture:** Mobile targets share the same `src-tauri/` Cargo project Epic 29a already scaffolds — this generator patches `tauri.conf.json`'s `bundle.android` block and adds `tauri:android:*` npm scripts, it does not create a new project. The identifier is read back from the existing config, never re-prompted (a Play Store `packageName` cannot change after first upload). The CI workflow has two triggers: `workflow_dispatch` (build verification only) and `push: tags: ['v*']` (the real signed-and-uploaded release path, gated on 5 GitHub secrets the workflow validates and fails loudly on if missing).

**Tech Stack:** Tauri v2 Android target (`tauri android *` CLI, already available via Epic 29a's `@tauri-apps/cli@^2` devDependency), Android SDK + NDK + Java 17 (CI-only), GitHub Actions, `r0adkll/upload-google-play` for the Play Console upload step.

**Spec:** `docs/superpowers/specs/2026-08-20-tauri-mobile-android-design.md`

## Global Constraints

- **Requires Epic 29a's `src-tauri/` to already exist.** This generator refuses to run otherwise — it is not a standalone alternative to `add-tauri.mjs`.
- **Identifier is read from existing `tauri.conf.json`, never re-collected.** No `--identifier` flag on this generator.
- **`minSdkVersion: 24`** (Android 7.0+) — a reasonable floor, not this plan's invention; matches the sibling `watchboard` reference's pinned value.
- **No dist-size fallback needed for Inceptor's own build** (`dist/` is ~10 MB, Play's cap is 200 MB) — but the runbook must still document `du -sh dist` as a pre-flight check for downstream projects, since this is template code other projects will run against their own, possibly much larger, builds.
- **`bundle.targets` stays unset** — Android bundle format is CLI-flag-driven (`tauri android build --aab`), not config-driven, same discipline as the desktop scaffold.
- **No signing, no credentials, no Play Console account creation performed by any agent, ever.** Tasks 5 and 6 below are explicitly human-only.
- **Five required GitHub secrets, generically named** (not project-specific): `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `ANDROID_KEYSTORE_PASSWORD`, `PLAY_SERVICE_ACCOUNT_JSON`. The workflow must fail loudly and early if any are unset when the release trigger fires.
- **Toolchain pins (NDK `26.1.10909125`, Java 17/Temurin) are carried over from the sibling `watchboard` repo's already-working production pipeline as a strong starting point — not verified fresh against Tauri's current docs (which no longer publish a version table).** The plan's own Task 6 (human-executed, post-credential-setup) is the actual empirical validation; if that first real run fails on a toolchain mismatch, bump the pins there, not in this plan.
- **GitHub Action SHA pins for `android-actions/setup-android` and `r0adkll/upload-google-play` must be looked up for real at Task 3's execution time** — this repo's own `actionlint` CI job fails any third-party action ref that isn't SHA-pinned (see `.github/workflows/ci.yml`'s actionlint job), and no SHA is asserted as fact anywhere in this plan.

---

### Task 1: `scripts/add-tauri-android.mjs` generator + tests

**Files:**
- Create: `scripts/add-tauri-android.mjs`
- Create: `scripts/add-tauri-android.d.mts` (type declarations, matching the existing `scripts/add-tauri.d.mts`/`scripts/state.d.mts` convention — required for this repo's `tsc --noEmit` gate when the `.mjs` is imported from a `.ts` test file)
- Test: `src/tests/add-tauri-android.test.ts`

**Interfaces:**
- Consumes: `src-tauri/tauri.conf.json` as written by Epic 29a's `scripts/add-tauri.mjs` (has `productName`, `identifier`, `build`, `app`, `bundle.active`, `bundle.icon` — no `bundle.android` key yet).
- Produces (exported from `scripts/add-tauri-android.mjs`):
  - `readTauriConfig(cwd: string): object` — reads and JSON-parses `src-tauri/tauri.conf.json`, throws a specific `TauriConfigNotFoundError`-shaped error (a plain `Error` with a recognizable `.code` property, e.g. `'ENOTAURI'`) if the file doesn't exist, so `main()` can catch it and print the "run add-tauri first" message rather than a raw stack trace.
  - `patchAndroidConfig(config: object, minSdkVersion: number): object` — pure function, returns a new object (does not mutate the input) with `bundle.android.minSdkVersion` set; if `bundle.android` already exists with a *different* `minSdkVersion`, leaves it untouched and returns a `{ config, warning }`-shaped result instead (same "never silently clobber" discipline as Epic 29a's `mergePackageJson`) — **for this task, always call it as `patchAndroidConfig(config, 24)` and treat the return shape as `{ config, warning: string | null }`** so the CLI wrapper has one consistent contract to check.
  - CLI entry point: `node scripts/add-tauri-android.mjs`, run from a project root (operates on `process.cwd()`, no flags — same "layer into the current project" style as `add-tauri.mjs`, but with zero required arguments since everything comes from the existing config).

- [ ] **Step 1: Write the failing tests**

```ts
// src/tests/add-tauri-android.test.ts
import { describe, it, expect } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readTauriConfig, patchAndroidConfig, main } from '../../scripts/add-tauri-android.mjs';

const SAMPLE_DESKTOP_CONFIG = {
  $schema: 'https://schema.tauri.app/config/2',
  productName: 'Scratch App',
  version: '0.1.0',
  identifier: 'com.example.scratch',
  build: {
    frontendDist: '../dist',
    devUrl: 'http://localhost:4321',
    beforeDevCommand: 'npm run dev',
    beforeBuildCommand: 'npm run build',
  },
  app: { windows: [{ title: 'Scratch App', width: 1024, height: 768, resizable: true, fullscreen: false }] },
  bundle: {
    active: true,
    icon: ['icons/32x32.png', 'icons/128x128.png', 'icons/128x128@2x.png', 'icons/icon.icns', 'icons/icon.ico'],
  },
};

describe('readTauriConfig', () => {
  it('reads and parses an existing src-tauri/tauri.conf.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-android-'));
    try {
      mkdirSync(join(dir, 'src-tauri'), { recursive: true });
      writeFileSync(join(dir, 'src-tauri/tauri.conf.json'), JSON.stringify(SAMPLE_DESKTOP_CONFIG));
      const config = readTauriConfig(dir);
      expect(config.identifier).toBe('com.example.scratch');
      expect(config.productName).toBe('Scratch App');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('throws a recognizable error (.code === "ENOTAURI") when src-tauri/tauri.conf.json is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-android-'));
    try {
      expect(() => readTauriConfig(dir)).toThrow();
      try {
        readTauriConfig(dir);
      } catch (err) {
        expect(err.code).toBe('ENOTAURI');
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('patchAndroidConfig', () => {
  it('adds bundle.android.minSdkVersion cleanly with no warning when absent', () => {
    const { config, warning } = patchAndroidConfig(SAMPLE_DESKTOP_CONFIG, 24);
    expect(config.bundle.android).toEqual({ minSdkVersion: 24 });
    expect(warning).toBeNull();
  });

  it('does not mutate the input config', () => {
    patchAndroidConfig(SAMPLE_DESKTOP_CONFIG, 24);
    expect(SAMPLE_DESKTOP_CONFIG.bundle).not.toHaveProperty('android');
  });

  it('warns and preserves an existing different minSdkVersion instead of overwriting', () => {
    const existing = {
      ...SAMPLE_DESKTOP_CONFIG,
      bundle: { ...SAMPLE_DESKTOP_CONFIG.bundle, android: { minSdkVersion: 26 } },
    };
    const { config, warning } = patchAndroidConfig(existing, 24);
    expect(config.bundle.android.minSdkVersion).toBe(26);
    expect(warning).toMatch(/minSdkVersion/);
  });

  it('is a no-op (no warning) when the existing minSdkVersion already matches', () => {
    const existing = {
      ...SAMPLE_DESKTOP_CONFIG,
      bundle: { ...SAMPLE_DESKTOP_CONFIG.bundle, android: { minSdkVersion: 24 } },
    };
    const { config, warning } = patchAndroidConfig(existing, 24);
    expect(config.bundle.android.minSdkVersion).toBe(24);
    expect(warning).toBeNull();
  });
});

describe('add-tauri-android CLI (end-to-end)', () => {
  it('patches tauri.conf.json and adds npm scripts in a real target directory', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-android-'));
    try {
      mkdirSync(join(dir, 'src-tauri'), { recursive: true });
      writeFileSync(join(dir, 'src-tauri/tauri.conf.json'), JSON.stringify(SAMPLE_DESKTOP_CONFIG, null, 2));
      writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify({ name: 'scratch-app', scripts: { dev: 'astro dev' }, devDependencies: { '@tauri-apps/cli': '^2' } }),
      );

      const cwd = process.cwd();
      process.chdir(dir);
      try {
        main([]);
      } finally {
        process.chdir(cwd);
      }

      const tauriConf = JSON.parse(readFileSync(join(dir, 'src-tauri/tauri.conf.json'), 'utf8'));
      expect(tauriConf.bundle.android.minSdkVersion).toBe(24);
      expect(tauriConf.identifier).toBe('com.example.scratch'); // untouched

      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
      expect(pkg.scripts['tauri:android:init']).toBe('tauri android init');
      expect(pkg.scripts['tauri:android:dev']).toBe('tauri android dev');
      expect(pkg.scripts['tauri:android:build']).toBe('tauri android build --aab');

      expect(existsSync(join(dir, 'docs/runbooks/tauri-android.md'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits 1 with a clear message when src-tauri/tauri.conf.json does not exist', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-android-'));
    const originalExit = process.exit;
    let exitCode = null;
    // @ts-expect-error — test-only override
    process.exit = (code) => {
      exitCode = code;
      throw new Error('exit');
    };
    try {
      const cwd = process.cwd();
      process.chdir(dir);
      try {
        expect(() => main([])).toThrow();
      } finally {
        process.chdir(cwd);
      }
      expect(exitCode).toBe(1);
    } finally {
      process.exit = originalExit;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/tests/add-tauri-android.test.ts`
Expected: FAIL — `scripts/add-tauri-android.mjs` doesn't exist yet, import error.

- [ ] **Step 3: Implement `scripts/add-tauri-android.mjs`**

```js
#!/usr/bin/env node
/**
 * add-tauri-android — layers Android support onto a project that has
 * ALREADY run scripts/add-tauri.mjs (Epic 29a). Mobile targets share the
 * same src-tauri/ Cargo project desktop uses — this does not create a new
 * project, it patches tauri.conf.json's bundle.android block and adds
 * tauri:android:* npm scripts. See
 * docs/superpowers/specs/2026-08-20-tauri-mobile-android-design.md.
 *
 *   node scripts/add-tauri-android.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIN_SDK_VERSION = 24;

export function readTauriConfig(cwd) {
  const confPath = join(cwd, 'src-tauri/tauri.conf.json');
  if (!existsSync(confPath)) {
    const err = new Error(`No src-tauri/tauri.conf.json found in ${cwd}`);
    err.code = 'ENOTAURI';
    throw err;
  }
  return JSON.parse(readFileSync(confPath, 'utf8'));
}

export function patchAndroidConfig(config, minSdkVersion) {
  const next = JSON.parse(JSON.stringify(config));
  next.bundle = next.bundle || {};
  if (next.bundle.android && next.bundle.android.minSdkVersion !== minSdkVersion) {
    return {
      config: next,
      warning: `bundle.android.minSdkVersion already set to ${next.bundle.android.minSdkVersion}, leaving as-is (wanted ${minSdkVersion})`,
    };
  }
  next.bundle.android = { minSdkVersion };
  return { config: next, warning: null };
}

export function main(argv = process.argv.slice(2)) {
  const cwd = process.cwd();

  let existingConfig;
  try {
    existingConfig = readTauriConfig(cwd);
  } catch (err) {
    if (err.code === 'ENOTAURI') {
      console.error('✗ Run "npm run add-tauri" first — no src-tauri/ project found.');
      process.exit(1);
    }
    throw err;
  }

  const { config, warning } = patchAndroidConfig(existingConfig, MIN_SDK_VERSION);
  if (warning) console.warn(`⚠ ${warning}`);
  writeFileSync(join(cwd, 'src-tauri/tauri.conf.json'), JSON.stringify(config, null, 2) + '\n');

  const pkgPath = join(cwd, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.scripts = pkg.scripts || {};
  pkg.scripts['tauri:android:init'] = pkg.scripts['tauri:android:init'] || 'tauri android init';
  pkg.scripts['tauri:android:dev'] = pkg.scripts['tauri:android:dev'] || 'tauri android dev';
  pkg.scripts['tauri:android:build'] = pkg.scripts['tauri:android:build'] || 'tauri android build --aab';
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  const runbookSrc = join(ROOT, 'docs/runbooks/tauri-android.md');
  const runbookDestDir = join(cwd, 'docs/runbooks');
  mkdirSync(runbookDestDir, { recursive: true });
  writeFileSync(join(runbookDestDir, 'tauri-android.md'), readFileSync(runbookSrc, 'utf8'));

  console.log('✓ Android support added. Next: npm install, then see docs/runbooks/tauri-android.md.');
  console.log(`  App identifier (locked in at first Play Console upload): ${config.identifier}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
```

- [ ] **Step 4: Create `scripts/add-tauri-android.d.mts`**

```ts
/** Type declarations for add-tauri-android.mjs — consumed by tsc and astro check. */
export function readTauriConfig(cwd: string): Record<string, any>;
export function patchAndroidConfig(
  config: Record<string, any>,
  minSdkVersion: number,
): { config: Record<string, any>; warning: string | null };
export function main(argv?: string[]): void;
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/tests/add-tauri-android.test.ts`
Expected: PASS, all cases green.

- [ ] **Step 6: Run `tsc --noEmit` to confirm the `.d.mts` is correctly wired**

Run: `npx tsc --noEmit`
Expected: 0 errors. (Task 2 hasn't created `docs/runbooks/tauri-android.md` yet at this point in a strict sequential read of this plan, but that file is only read at runtime by `main()`, not at type-check time — `tsc` has nothing to say about a file path referenced inside a function body. If you're executing Task 1 before Task 2 exists, `npx vitest run src/tests/add-tauri-android.test.ts`'s end-to-end test would fail on the `docs/runbooks/tauri-android.md` existence check — reorder execution so Task 2 lands first, or stub the runbook file temporarily and let Task 2 supply the real content.)

- [ ] **Step 7: Commit**

```bash
git add scripts/add-tauri-android.mjs scripts/add-tauri-android.d.mts src/tests/add-tauri-android.test.ts
git commit -m "feat(tauri): add scripts/add-tauri-android.mjs generator + tests (Epic 29b)"
```

---

### Task 2: Operator runbook (`docs/runbooks/tauri-android.md`)

**Files:**
- Create: `docs/runbooks/tauri-android.md`

**Interfaces:**
- Produces: the file Task 1's generator copies into any project that runs it. **Must exist before Task 1's end-to-end test can pass** — execute this task first if following strict plan order, or write a placeholder stub for Task 1's test to find and replace it with real content here.

- [ ] **Step 1: Create `docs/runbooks/tauri-android.md`**

```markdown
# Tauri Android wrapper

Operator runbook for the opt-in Android build added by
`scripts/add-tauri-android.mjs`. **Requires `scripts/add-tauri.mjs`
(desktop) to have already been run in this project** — Android is a
target added to the same Tauri project, not a separate one. See
`docs/runbooks/tauri-desktop.md` first if you haven't run that yet.

Unlike the desktop build, an unsigned Android build cannot be uploaded to
Google Play at all — there's no "ship it unsigned and disclose that" path
here. This runbook's second half (signing, Play Console) is required, not
optional, if your goal is a real Play Store release. A local unsigned
build for testing on a device/emulator (`tauri:android:dev`) works
without any of that.

## The app identifier is now permanent

`src-tauri/tauri.conf.json`'s `identifier` — already set when you ran
`add-tauri.mjs` — becomes your Play Store `packageName` and **cannot
change after your first Console upload** without abandoning that app
listing entirely (losing all reviews, installs, and history). If you
haven't uploaded yet and want to change it, edit `identifier` in
`tauri.conf.json` now, before proceeding.

## Prerequisites (local dev only — not required for CI)

1. **Rust Android targets:**
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
   ```
2. **Java 17** — Android Gradle Plugin 8.x requires JDK 17.
   ```bash
   brew install --cask temurin@17     # macOS
   sudo apt install openjdk-17-jdk    # Debian/Ubuntu
   ```
3. **Android SDK + NDK** — via Android Studio's SDK Manager: SDK Platforms
   (whatever version `.github/workflows/tauri-android.yml` pins — check
   that file, it tracks Play's rolling target-SDK requirement so isn't
   repeated here), NDK (Side by side), Build-Tools, Command-line Tools.
4. **Environment variables:**
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk         # macOS default
   export NDK_HOME=$ANDROID_HOME/ndk/<version-from-CI-workflow>
   export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
   ```

## First run

```bash
npm install
npm run tauri:android:init
npm run tauri:android:dev   # plug in a USB-debugging device, or start an AVD emulator
```

Common gotchas:

- **`adb devices` empty** → enable USB debugging in Developer Options.
- **White screen** → the dev server didn't finish starting before Tauri
  loaded the URL; `Ctrl+C`, wait for `astro dev`'s local URL to print,
  retry.
- **App content is large / build feels slow** → run `du -sh dist` after
  `npm run build` before assuming a bundled build fits under Google
  Play's 200 MB AAB base-module cap. If your project's `dist/` is large
  (many locales, heavy media, a search index), consider setting
  `build.frontendDist` in `tauri.conf.json` to your production URL
  instead of `"../dist"`, so the WebView loads the real deployed site
  rather than embedding a copy — the AAB stays tiny, at the cost of
  needing network connectivity on first load.

## Production AAB build (local, unsigned)

```bash
npm run build                 # produces dist/, same as the web build
npm run tauri:android:build   # AAB under src-tauri/gen/android/app/build/outputs/bundle/
```

This is unsigned — fine for confirming the build works, not shippable to
Play. See "Signing and Play Store release" below for the real path.

## Signing and Play Store release

This is the part that genuinely requires you, personally — none of it can
be automated:

### 1. Generate and store the signing keystore

Generate this **outside the repository working tree**:

```bash
mkdir -p ~/secrets/<your-project>
keytool -genkey -v \
  -keystore ~/secrets/<your-project>/release.jks \
  -keyalg RSA -keysize 2048 \
  -validity 10000 \
  -alias <your-project>-upload
```

Save the `.jks` file to a password manager — if lost, every future AAB
must be uploaded under a brand-new app listing.

```bash
base64 < ~/secrets/<your-project>/release.jks | pbcopy
```

Set these as GitHub Actions secrets (`Settings → Secrets and variables → Actions`):

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | output of `base64 < release.jks` |
| `ANDROID_KEY_ALIAS` | the alias you chose above |
| `ANDROID_KEY_PASSWORD` | the key password |
| `ANDROID_KEYSTORE_PASSWORD` | the store password |

### 2. Create the Play Console app listing + service account

1. https://play.google.com/console → Setup → API access.
2. Link a Google Cloud project, click **Create new service account**.
3. Grant **Release manager** (or the finer-grained "Release to internal track" role).
4. Download the JSON key.
5. Set it as GitHub secret `PLAY_SERVICE_ACCOUNT_JSON` (the full JSON, not base64-encoded).

**Package name availability cannot be checked ahead of time** — your
first upload attempt is the real test. A collision (even with a
previously-deleted app) means picking a new identifier and starting over
from "The app identifier is now permanent" above.

Play Console has, at various points, required a minimum "App content"
declaration (privacy policy URL at minimum) before allowing **any**
release, including internal testing — verify directly in the Console UI
when creating your listing; don't assume internal-track releases are
exempt.

### 3. Cut a release

```bash
# Edit "version" in src-tauri/tauri.conf.json
git add src-tauri/tauri.conf.json
git commit -m "chore: bump version to 1.x.y"
git tag v1.x.y
git push origin v1.x.y
```

Pushing a `v*` tag triggers `.github/workflows/tauri-android.yml`
automatically: build → sign → upload to Play's internal track. Two
releases with the *same* version string produce the same Android
`versionCode` and the upload will hard-fail as a duplicate — always bump
`version` before tagging, even for a no-op rebuild.

Manual dispatch (`gh workflow run tauri-android.yml`) only runs the build
— it never uploads, regardless of what secrets are set. Only a tag push
uploads.

## Rollback / halt

- **Pause a release**: Play Console → Testing → Internal testing → find
  the release → three-dot menu → **Halt release**.
- **Re-upload after halt**: the same `versionCode` cannot be reused —
  bump `version` and re-tag.
- **Key rotation**: generate a new keystore, then contact Google Play
  support (no self-serve rotation) and update all four
  `ANDROID_KEYSTORE_*`/`ANDROID_KEY_*` secrets.
```

- [ ] **Step 2: Commit**

```bash
git add docs/runbooks/tauri-android.md
git commit -m "docs(tauri): add Android operator runbook (Epic 29b)"
```

---

### Task 3: GitHub Actions Android build/sign/upload workflow

**Files:**
- Create: `.github/workflows/tauri-android.yml`

**Interfaces:**
- Consumes: `src-tauri/tauri.conf.json` (as patched by Task 1), the five secrets named in Global Constraints.
- Produces: on `workflow_dispatch`, an unsigned build artifact (build verification only). On a `v*` tag push, a signed AAB uploaded to Play's `internal` track.

- [ ] **Step 1: Look up current SHA pins for the two new third-party actions**

This repo's `actionlint` CI job fails any third-party `uses:` ref that isn't SHA-pinned (see the "Scan for unpinned third-party action refs" step in `.github/workflows/ci.yml`). Two new third-party actions are needed here that the desktop workflow didn't require (no first-party equivalents exist):

```bash
# Get the current release SHA for each — do not proceed with a guessed value.
gh api repos/android-actions/setup-android/releases/latest --jq '.target_commitish, .tag_name'
gh api repos/android-actions/setup-android/commits/main --jq '.sha' # or the tag's commit, whichever the release step above points at
gh api repos/r0adkll/upload-google-play/releases/latest --jq '.target_commitish, .tag_name'
gh api repos/r0adkll/upload-google-play/commits/master --jq '.sha'
```

Record the two SHAs you find; use them in Step 2 below (replacing the `<SHA-...>` placeholders) with a `# vN` comment matching this repo's existing pin-comment style (see any `uses:` line in `ci.yml` for the exact format).

- [ ] **Step 2: Create `.github/workflows/tauri-android.yml`**

```yaml
name: Tauri Android build/sign/upload

# workflow_dispatch: build verification only, never uploads.
# push tags v*: the real release path — build, sign, upload to Play's
# internal track. A project that never tags a release never triggers an
# upload, keeping this opt-in until actually used.
# See docs/runbooks/tauri-android.md and
# docs/superpowers/specs/2026-08-20-tauri-mobile-android-design.md.
on:
  workflow_dispatch:
  push:
    tags:
      - 'v*'

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v6
        with:
          fetch-depth: 0

      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v6
        with:
          node-version: '22'
          cache: 'npm'

      - name: Setup Java 17
        uses: actions/setup-java@<SHA-look-up-if-not-already-in-ci.yml> # v4 — check ci.yml first, this repo may already pin one
        with:
          distribution: temurin
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@<SHA-from-Step-1> # vN
        with:
          # Two platform levels: one for the Gradle/AGP toolchain Tauri's
          # Android template expects, plus whatever satisfies Play's
          # CURRENT minimum targetSdkVersion — re-check
          # https://developer.android.com/google/play/requirements/target-sdk
          # at execution time; this number moves on a rolling basis.
          packages: 'platform-tools platforms;android-34 platforms;android-35 build-tools;34.0.0 ndk;26.1.10909125'

      - name: Confirm Rust toolchain and add Android targets
        run: |
          rustup show
          rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android

      - name: Cache Cargo registry
        uses: actions/cache@<check-if-already-pinned-in-this-repo> # v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            src-tauri/target
          key: ${{ runner.os }}-cargo-android-${{ hashFiles('src-tauri/Cargo.lock', 'src-tauri/Cargo.toml') }}
          restore-keys: |
            ${{ runner.os }}-cargo-android-

      - name: Install Node deps
        run: npm ci

      - name: Generate Tauri icons
        run: npx tauri icon public/icons/pwa-512.png

      - name: Build Astro frontend
        run: npm run build

      - name: Initialise Tauri Android project
        env:
          NDK_HOME: ${{ env.ANDROID_HOME }}/ndk/26.1.10909125
        run: |
          if [ ! -d src-tauri/gen/android ]; then
            npx tauri android init
          fi
          chmod +x src-tauri/gen/android/gradlew

      - name: Patch targetSdkVersion for current Play Store requirements
        # tauri.conf.json has no targetSdkVersion field (only
        # minSdkVersion) — the generated Gradle project's default may lag
        # Play's rolling minimum target API. Force it explicitly so a
        # Tauri CLI version bump can't silently regress this and get the
        # upload rejected. Re-verify "35" against Play's current
        # requirement (see the Setup Android SDK step's comment above)
        # before relying on this.
        run: |
          GRADLE_FILE=src-tauri/gen/android/app/build.gradle.kts
          if [ -f "$GRADLE_FILE" ]; then
            sed -i 's/targetSdk = [0-9]\+/targetSdk = 35/' "$GRADLE_FILE"
            grep -n "targetSdk" "$GRADLE_FILE"
          else
            echo "::error::$GRADLE_FILE not found — tauri android init layout may have changed."
            exit 1
          fi

      - name: Build AAB
        env:
          NDK_HOME: ${{ env.ANDROID_HOME }}/ndk/26.1.10909125
        run: npx tauri android build --aab

      - name: Upload unsigned build artifact (workflow_dispatch verification only)
        if: github.event_name == 'workflow_dispatch'
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7
        with:
          name: tauri-android-unsigned-aab
          path: src-tauri/gen/android/app/build/outputs/bundle/**/*.aab
          if-no-files-found: error
          retention-days: 7

      # Everything below only runs on a version-tag push — never on
      # workflow_dispatch, which stops at the unsigned-artifact upload
      # above.
      - name: Validate required signing secrets
        if: startsWith(github.ref, 'refs/tags/v')
        run: |
          missing=""
          [ -z "$ANDROID_KEYSTORE_BASE64" ] && missing="$missing ANDROID_KEYSTORE_BASE64"
          [ -z "$ANDROID_KEY_ALIAS" ] && missing="$missing ANDROID_KEY_ALIAS"
          [ -z "$ANDROID_KEY_PASSWORD" ] && missing="$missing ANDROID_KEY_PASSWORD"
          [ -z "$ANDROID_KEYSTORE_PASSWORD" ] && missing="$missing ANDROID_KEYSTORE_PASSWORD"
          [ -z "$PLAY_SERVICE_ACCOUNT_JSON" ] && missing="$missing PLAY_SERVICE_ACCOUNT_JSON"
          if [ -n "$missing" ]; then
            echo "::error::Missing required secrets for the release path:$missing"
            echo "::error::See docs/runbooks/tauri-android.md → 'Signing and Play Store release'."
            exit 1
          fi
        env:
          ANDROID_KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          PLAY_SERVICE_ACCOUNT_JSON: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}

      - name: Decode signing keystore
        if: startsWith(github.ref, 'refs/tags/v')
        id: keystore
        run: |
          echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > /tmp/release.jks
          echo "keystore_path=/tmp/release.jks" >> "$GITHUB_OUTPUT"
        env:
          ANDROID_KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}

      - name: Sign AAB
        if: startsWith(github.ref, 'refs/tags/v')
        id: sign
        env:
          KEYSTORE_PATH: ${{ steps.keystore.outputs.keystore_path }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
        run: |
          AAB=$(find src-tauri/gen/android/app/build/outputs/bundle -name '*-release.aab' | head -n 1)
          if [ -z "$AAB" ]; then
            echo "::error::No release AAB found under src-tauri/gen/android/app/build/outputs/bundle"
            exit 1
          fi
          # jarsigner (not apksigner) is correct here: unlike installable
          # .apk files, Play-bound .aab bundles don't require the
          # apksigner v2/v3 scheme — a standard JAR signature is
          # sufficient for bundletool/Play to accept.
          jarsigner -verbose \
            -sigalg SHA256withRSA -digestalg SHA-256 \
            -keystore "$KEYSTORE_PATH" \
            -storepass "$ANDROID_KEYSTORE_PASSWORD" \
            -keypass "$ANDROID_KEY_PASSWORD" \
            "$AAB" "$ANDROID_KEY_ALIAS"
          echo "aab_path=$AAB" >> "$GITHUB_OUTPUT"
          shred -u "$KEYSTORE_PATH" 2>/dev/null || rm -f "$KEYSTORE_PATH"

      - name: Write Play service account credentials to a temp file
        if: startsWith(github.ref, 'refs/tags/v')
        id: play-creds
        run: |
          CRED_FILE=$(mktemp)
          printf '%s' "$PLAY_SERVICE_ACCOUNT_JSON" > "$CRED_FILE"
          echo "cred_path=$CRED_FILE" >> "$GITHUB_OUTPUT"
        env:
          PLAY_SERVICE_ACCOUNT_JSON: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}

      - name: Upload to Play Store internal track
        if: startsWith(github.ref, 'refs/tags/v')
        uses: r0adkll/upload-google-play@<SHA-from-Step-1> # vN
        with:
          serviceAccountJson: ${{ steps.play-creds.outputs.cred_path }}
          packageName: ${{ steps.tauri-identifier.outputs.identifier }}
          releaseFiles: ${{ steps.sign.outputs.aab_path }}
          track: internal
          status: completed

      - name: Clean up Play service account credentials file
        if: always() && startsWith(github.ref, 'refs/tags/v')
        run: rm -f "${{ steps.play-creds.outputs.cred_path }}"

      - name: Upload signed AAB artifact (CI archive)
        if: startsWith(github.ref, 'refs/tags/v')
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7
        with:
          name: tauri-android-signed-aab
          path: ${{ steps.sign.outputs.aab_path }}
          if-no-files-found: error
          retention-days: 14
```

Note: the `packageName` input references `steps.tauri-identifier.outputs.identifier`, a step this draft doesn't define yet — add a small step right after "Build Astro frontend" that reads `src-tauri/tauri.conf.json`'s `identifier` field with `jq` and writes it to `$GITHUB_OUTPUT`, e.g.:

```yaml
      - name: Read app identifier from tauri.conf.json
        id: tauri-identifier
        run: echo "identifier=$(jq -r .identifier src-tauri/tauri.conf.json)" >> "$GITHUB_OUTPUT"
```

Insert this immediately before "Initialise Tauri Android project" — do this now as part of Step 2, don't leave the workflow with a dangling reference.

- [ ] **Step 3: Fill in the SHA pins from Step 1**

Replace every `<SHA-...>`/`<check-if-already-pinned-in-this-repo>` placeholder in the YAML above with the real values found in Step 1 (for `actions/setup-java` and `actions/cache`, first check whether `.github/workflows/ci.yml` or any other existing workflow in this repo already pins one — reuse that exact pin rather than looking up a new one, for consistency).

- [ ] **Step 4: Lint the workflow YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/tauri-android.yml'))"`
Expected: no error output.

- [ ] **Step 5: Run this repo's own unpinned-action check locally**

```bash
grep -rE "uses: [^/]+/[^@]+@(?!([0-9a-f]{40})|(\.github))" .github/workflows/tauri-android.yml | grep -v "uses: actions/" | grep -v "uses: github/" || echo "OK: no unpinned third-party actions"
```

Expected: `OK: no unpinned third-party actions`. If this prints anything else, a placeholder from Step 2 wasn't actually replaced with a real SHA — go back to Step 3.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/tauri-android.yml
git commit -m "ci(tauri): add Android build/sign/upload workflow (Epic 29b)"
```

---

### Task 4: ROADMAP.md update

**Files:**
- Modify: `ROADMAP.md`

**Interfaces:**
- None — documentation-only.

- [ ] **Step 1: Update the Epic 29b section**

Find the existing Epic 29b entry (added when Epic 29a shipped: `grep -n "^## Epic 29b" ROADMAP.md`) and replace its body to reflect what's now built, following the same `- [x]` / PR-reference style Epic 29a used (leave the PR number as a literal `#TODO-PR` placeholder if this task runs before a PR exists — replace it with the real number in the same follow-up commit pattern Epic 29a used once merged, do not leave `#TODO-PR` as final content):

```markdown
## Epic 29b — Mobile packaging via Tauri, Android — ✅ shipped (#TODO-PR)

Additive to Epic 29a — Android targets share the same `src-tauri/` Cargo
project the desktop scaffold creates. Unlike desktop, "ship unsigned" was
not viable here (Google Play rejects unsigned uploads outright), so the
signing/credential setup is a required, explicitly human-only follow-up,
not optional disclosure.

- [x] `scripts/add-tauri-android.mjs` — requires `add-tauri.mjs` to have
  already run; reads the existing `identifier` back out rather than
  re-prompting (a Play Store `packageName` locks in permanently at first
  upload) (#TODO-PR)
- [x] `docs/runbooks/tauri-android.md` — copied into every project that
  runs the generator, includes the full signing/Play Console setup
  walkthrough (#TODO-PR)
- [x] `.github/workflows/tauri-android.yml` — `workflow_dispatch` for
  build verification (never uploads); a `v*` tag push triggers the real
  signed release, failing loudly if any of 5 required secrets are unset
  (#TODO-PR)
- [ ] *(human-only, tracked but not "shippable" in the code sense)* One-time
  keystore generation + Play Console service account setup — see the
  runbook; this repo's own Play Store release (if any) needs this done
  once by a human before `tauri-android.yml`'s tag-push path can succeed

**Design spec:** `docs/superpowers/specs/2026-08-20-tauri-mobile-android-design.md`

## Epic 29c — iOS packaging via Tauri — not yet started

Follow-up to Epic 29b. Needs a Mac CI runner, a $99/year Apple Developer
Program membership, and a materially different signing/provisioning flow
(Xcode-based, not keytool/jarsigner) — deferred for the same reason the
sibling `watchboard` repo's reference plan deferred it.
```

- [ ] **Step 2: Commit**

```bash
git add ROADMAP.md
git commit -m "docs(roadmap): update Epic 29b (Android shipped) + add Epic 29c (iOS, not started)"
```

---

### Task 5 (HUMAN, NOT AGENT-EXECUTABLE): One-time credential and account setup

**Do not dispatch a subagent for this task. Hand it to the user directly, pointing at `docs/runbooks/tauri-android.md`'s "Signing and Play Store release" section.**

**Files:** none (external state: GitHub repo secrets, Play Console, a password manager).

- [ ] **Step 1: Generate and store the signing keystore**, set the four `ANDROID_*` secrets.
- [ ] **Step 2: Create the Play Console app listing + service account**, set `PLAY_SERVICE_ACCOUNT_JSON`, complete any required "App content" declaration the Console UI blocks on.
- [ ] **Step 3: Verify all five secrets are set**: `gh secret list | grep -E "ANDROID_|PLAY_"` should show 5 lines.

---

### Task 6 (HUMAN, NOT AGENT-EXECUTABLE): First real release dispatch

**Do not dispatch a subagent for this task.** Depends on Task 5 being complete and this plan's branch having merged to `main` (the same `workflow_dispatch`/tag-push platform constraint the desktop epic hit — a workflow can't fire until it exists on the default branch).

**Files:** none (verification-only).

- [ ] **Step 1: `workflow_dispatch` build-verification run first** — confirms the build/toolchain steps work before risking a real tag-triggered upload: `gh workflow run tauri-android.yml --ref main && gh run watch`. Expected: green, `tauri-android-unsigned-aab` artifact produced.
- [ ] **Step 2: Bump `version` in `src-tauri/tauri.conf.json`, tag, and push** per the runbook's "Cutting a release" section.
- [ ] **Step 3: Verify the tag-triggered run succeeds**, including the "Validate required signing secrets" step and the actual Play Console upload — read the real error if it fails, don't assume a specific fix.
- [ ] **Step 4: Confirm the release appears in Play Console** → Testing → Internal testing.
- [ ] **Step 5: Install and smoke-test on a real Android device** via the internal-testing opt-in link — confirm the app launches and the site renders.

---

## Self-Review

**1. Spec coverage:** Architecture (generator reads back identifier, patches `bundle.android`) → Task 1. Runbook → Task 2. Dual-trigger CI with secret validation → Task 3. Human-gated tasks named explicitly, matching the spec's own section → Tasks 5–6. ROADMAP/Epic 29c → Task 4. The spec's toolchain-pin caveat ("carried over as a starting point, not verified fresh") is reflected in both Global Constraints and Task 6's real-run requirement.

**2. Placeholder scan:** The `<SHA-...>` markers in Task 3's YAML draft are intentional — Task 3's own Steps 1 and 3 exist specifically to resolve them for real before the file is committed, not left as final content. The `#TODO-PR` markers in Task 4 are the same pattern Epic 29a used (a real PR number doesn't exist until this plan's branch opens one) and Task 4's own instruction says explicitly not to leave them as final content.

**3. Type/signature consistency:** `readTauriConfig(cwd)`, `patchAndroidConfig(config, minSdkVersion)` returning `{ config, warning }`, and `main(argv)` are used identically across Task 1's Steps 1, 3, and 4 (the `.d.mts`). npm script names (`tauri:android:init`/`:dev`/`:build`) match across Task 1's implementation, its test, and Task 2's runbook. The five secret names match identically across Task 3's YAML and Task 2's runbook table.
