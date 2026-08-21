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
