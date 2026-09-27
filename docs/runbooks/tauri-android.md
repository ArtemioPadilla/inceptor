# Tauri Android wrapper

Operator runbook for the opt-in Android build added by
`scripts/add-tauri-android.mjs`. **Requires `scripts/add-tauri.mjs`
(desktop) to have already been run in this project** — Android is a
target added to the same Tauri project, not a separate one. See
`docs/runbooks/tauri-desktop.md` first if you haven't run that yet.

Unlike the desktop build, an unsigned Android build cannot be uploaded to
Google Play at all — there's no "ship it unsigned and disclose that" path
here. If your goal is a real Play Store release, the signing **and** Play
Console halves of this runbook are both required. If you just need an
**installable APK** (testers, sideloading, a GitHub Release download link,
no Play listing yet), you need the signing half only — or nothing at all
for a debug APK. See "Installable APK without Google Play" below. A local
unsigned build for testing on a device/emulator (`tauri:android:dev`)
works without any of that.

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
npm run add-tauri-android    # or: node scripts/add-tauri-android.mjs
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

The generator also adds two APK scripts (see the next section for when to
use which):

```bash
npm run tauri:android:apk         # release APK, UNSIGNED — must be apksigner-signed before it installs
npm run tauri:android:apk:debug   # debug APK, signed with the Android debug key — installs as-is
```

Both land under `src-tauri/gen/android/app/build/outputs/apk/`.

## Installable APK without Google Play

An `.aab` is only useful to Google Play. When there is no Play listing yet
(or never will be — internal tools, a tester group, a "download for
Android" button on your own site), the deliverable is an **APK**, and
`.github/workflows/tauri-android.yml` produces one on both of its triggers.
The AAB/Play path is unchanged and still runs alongside; this is additive.

### Zero setup: debug APK from a manual run

```bash
gh workflow run tauri-android.yml --ref main
gh run watch
gh run download --name tauri-android-debug-apk
```

Every `workflow_dispatch` run uploads two APK artifacts (7-day retention),
alongside the pre-existing `tauri-android-unsigned-aab`:

| Artifact | What it is | Installs? |
|---|---|---|
| `tauri-android-debug-apk` | `tauri android build --apk --debug`, signed by Gradle with the standard Android **debug key** | **Yes**, on any device — no secrets needed |
| `tauri-android-unsigned-apk` | `tauri android build --apk` (release profile), emitted by Gradle as `app-universal-release-unsigned.apk` | No — Android refuses unsigned APKs; sign it yourself with `apksigner` if you need a release-profile test build |

The debug APK is the right thing to hand a tester today. It is **not** a
release: it carries the debug key (so it cannot later be updated in place
by a release-signed build — the user must uninstall first), and debug
builds are larger and slower.

### Signed APK on a tag push → GitHub Release

Pushing a `v*` tag (see "3. Cut a release" below) now also:

1. builds the release APK next to the AAB,
2. signs it with **`apksigner`** (the v2/v3 signature scheme Android 11+
   requires for installation — `jarsigner`, which is what the AAB uses,
   is not sufficient for an APK) from the same keystore secrets,
3. runs `apksigner verify`, and
4. attaches `<product>-<version>-android.apk`, `<product>-<version>-android.aab`
   and a `SHA256SUMS.txt` to a **GitHub Release** for the tag (created if
   the tag has none yet).

Only the four `ANDROID_*` keystore secrets are required for this;
`PLAY_SERVICE_ACCOUNT_JSON` may be left unset and the run still goes
green, with a `::notice` that the Play upload was skipped. The Release
page's `.apk` link is your public download URL.

The signed APK and the signed AAB share one upload key, so a Play listing
can be added later without breaking installed users: Play's own app
signing key is what devices see for Play installs either way, and
sideloaded users keep updating from your Releases page.

### Installing an APK

```bash
# USB (Developer options → USB debugging enabled on the device)
adb install -r path/to/app.apk          # -r = keep data if already installed

# Or: open the .apk on the device (downloaded from the Release page /
# shared via any file transfer) and confirm "Install unknown apps" for
# the browser/file manager when Android asks.
```

`adb install` fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE` when the
device already has the same app under a different signing key (typically
a debug APK, or a build signed with a rotated keystore) — `adb uninstall
<identifier>` first; the identifier is `identifier` in
`src-tauri/tauri.conf.json`.

### Your own icon: `TAURI_ICON_SOURCE`

The workflow regenerates every Android icon size (launcher, adaptive
icon layers, Play listing icon) from a single PNG via `npx tauri icon`.
By default that is `public/icons/pwa-512.png` — the PWA icon every
Inceptor project already ships — so an unconfigured project still gets a
real, project-specific icon rather than Tauri's placeholder.

To use a different file, set the **repository variable** (not a secret)
`TAURI_ICON_SOURCE` under `Settings → Secrets and variables → Actions →
Variables` to a path relative to the checkout, e.g.
`public/icons/app-icon-1024.png`. The workflow reads it as
`vars.TAURI_ICON_SOURCE` and fails with an explicit `::error` if the file
does not exist. Requirements:

- **PNG, square.** `tauri icon` rejects non-square input.
- **At least 512 × 512 px; 1024 × 1024 recommended.** The largest
  generated assets (xxxhdpi launcher tier, Play's 512 px listing icon,
  the store feature graphic you'll be asked for separately) are upscaled
  from anything smaller.
- **Committed to the repo** — the workflow runs against a fresh checkout.
- Keep the important part of the artwork inside the central ~66 %:
  Android's adaptive icons mask the outer edge to a circle/squircle.

Locally the equivalent is `npx tauri icon path/to/icon.png` before
`npm run tauri:android:apk`.

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

| Secret | Required? | Value |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` | **Required** on every `v*` tag push | output of `base64 < release.jks` |
| `ANDROID_KEY_ALIAS` | **Required** | the alias you chose above |
| `ANDROID_KEY_PASSWORD` | **Required** | the key password |
| `ANDROID_KEYSTORE_PASSWORD` | **Required** | the store password |
| `PLAY_SERVICE_ACCOUNT_JSON` | *Optional* — set it only once you have a Play listing (step 2 below). Absent ⇒ Play upload skipped with a `::notice`, signed APK + AAB still go to the GitHub Release | the service-account JSON key, verbatim |

And one optional repository **variable** (`Settings → Secrets and
variables → Actions → Variables`, not a secret):

| Variable | Default | Purpose |
|---|---|---|
| `TAURI_ICON_SOURCE` | `public/icons/pwa-512.png` | square PNG (≥ 512 px, 1024 recommended) all Android icons are generated from — see "Your own icon" above |

The workflow's "Validate required signing secrets" step fails the run,
before anything is built, if any of the four required ones is missing.

### 2. (Optional — Play Store only) Create the Play Console app listing + service account

Skip this section entirely if you are shipping the APK via GitHub
Releases and have no Play listing yet; come back when you do.

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
automatically: build → sign (AAB with `jarsigner`, APK with `apksigner`)
→ GitHub Release with the signed APK + AAB attached → upload the AAB to
Play's internal track **if** `PLAY_SERVICE_ACCOUNT_JSON` is set (otherwise
that last step is skipped with a `::notice`). Two releases with the *same*
version string produce the same Android `versionCode` and the Play upload
will hard-fail as a duplicate — always bump `version` before tagging, even
for a no-op rebuild. (The workflow also refuses outright when the tag does
not equal `v` + `tauri.conf.json`'s `version`.)

Manual dispatch (`gh workflow run tauri-android.yml`) only runs the build
— it never signs with the release key, never creates a Release and never
uploads, regardless of what secrets are set; it produces the unsigned AAB,
the unsigned release APK and the installable debug APK as run artifacts.
Only a tag push signs and publishes.

## Rollback / halt

- **Pull a GitHub Release APK**: `gh release delete v1.x.y --yes`
  (or edit the Release and remove the asset). Devices that already
  installed it keep it — there is no remote kill switch for sideloaded
  APKs; ship a fixed version and tell users to update.
- **Pause a release**: Play Console → Testing → Internal testing → find
  the release → three-dot menu → **Halt release**.
- **Re-upload after halt**: the same `versionCode` cannot be reused —
  bump `version` and re-tag.
- **Key rotation**: generate a new keystore, then contact Google Play
  support (no self-serve rotation) and update all four
  `ANDROID_KEYSTORE_*`/`ANDROID_KEY_*` secrets.
