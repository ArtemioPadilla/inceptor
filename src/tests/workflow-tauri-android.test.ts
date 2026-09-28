/**
 * Guards the safety properties of .github/workflows/tauri-android.yml —
 * the opt-in Android build/sign/release pipeline — including the APK /
 * GitHub Release path added 2026-09-27 (see the design spec's addendum).
 *
 * Tests read the workflow as text — no runtime GitHub Actions dependency,
 * same approach as the other workflow-*.test.ts files here.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const WF_PATH = resolve(process.cwd(), '.github/workflows/tauri-android.yml');
const wf = readFileSync(WF_PATH, 'utf-8');

/** Every `uses:` ref in the file, comments stripped. */
function usesRefs(): string[] {
  return wf
    .split('\n')
    .filter((l) => /^\s*-?\s*uses:\s+/.test(l))
    .map((l) =>
      l
        .replace(/#.*$/, '')
        .replace(/^\s*-?\s*uses:\s+/, '')
        .trim(),
    );
}

describe('tauri-android.yml — action pinning', () => {
  it('pins EVERY action (first- and third-party) to a full 40-hex commit SHA', () => {
    const refs = usesRefs();
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(ref, `unpinned ref: ${ref}`).toMatch(/@[0-9a-f]{40}$/);
    }
  });

  it('carries a trailing version comment on every pinned ref', () => {
    const lines = wf.split('\n').filter((l) => /^\s*-?\s*uses:\s+/.test(l));
    for (const line of lines) {
      expect(line, `missing version comment: ${line.trim()}`).toMatch(/#\s*v\d+(\.\d+)*\s*$/);
    }
  });

  it('uses the GitHub Release action and the artifact download action, both SHA-pinned', () => {
    expect(wf).toMatch(/uses:\s+softprops\/action-gh-release@[0-9a-f]{40}\s+#\s*v2/);
    expect(wf).toMatch(/uses:\s+actions\/download-artifact@[0-9a-f]{40}\s+#\s*v\d/);
  });
});

describe('tauri-android.yml — token scope', () => {
  it('keeps the workflow default at contents: read', () => {
    expect(wf).toMatch(/^permissions:\n\s+contents: read/m);
  });

  it('grants contents: write only inside the release job, never at workflow level', () => {
    // Count on code lines only — the explanatory comments mention the scope too.
    const codeLines = wf.split('\n').filter((l) => !/^\s*#/.test(l));
    const writeLines = codeLines.filter((l) => /contents: write/.test(l));
    expect(writeLines).toHaveLength(1);
    // The single grant is indented under a job's permissions block (6
    // spaces), never at column 0 like the workflow default.
    expect(writeLines[0]).toMatch(/^ {6}contents: write$/);
    // And that job is the release job, which needs the build job first.
    const releaseIdx = wf.indexOf('\n  release:');
    expect(releaseIdx).toBeGreaterThan(-1);
    const releaseBlock = wf.slice(releaseIdx);
    expect(releaseBlock).toContain('needs: build');
    expect(releaseBlock).toContain('contents: write');
    expect(releaseBlock).toContain('softprops/action-gh-release');
  });

  it('release job is gated on a v* tag push and on the opt-in guard', () => {
    const releaseBlock = wf.slice(wf.indexOf('\n  release:'));
    expect(releaseBlock).toMatch(
      /if:\s+needs\.build\.outputs\.skip != 'true' && github\.event_name == 'push' && startsWith\(github\.ref, 'refs\/tags\/v'\)/,
    );
    // (comment lines allowed between `outputs:` and the `skip:` key)
    expect(wf).toMatch(/outputs:\n(\s*#.*\n)*\s+skip: \$\{\{ steps\.guard\.outputs\.skip \}\}/);
  });
});

describe('tauri-android.yml — opt-in guard, concurrency, tag check (pre-existing invariants)', () => {
  it('still has the opt-in guard step that emits skip=true when bundle.android is absent', () => {
    expect(wf).toContain('id: guard');
    expect(wf).toContain("jq -e '.bundle.android'");
    expect(wf).toContain('echo "skip=true" >> "$GITHUB_OUTPUT"');
  });

  it('still refuses to release when the tag does not match tauri.conf.json version', () => {
    expect(wf).toContain('Verify tag matches tauri.conf.json version');
    expect(wf).toMatch(/\[ "\$TAG" = "v\$VER" \] \|\|/);
  });

  it('still never cancels an in-flight run', () => {
    expect(wf).toMatch(
      /concurrency:\n\s+group: tauri-android-\$\{\{ github\.ref \}\}\n(\s+#.*\n)*\s+cancel-in-progress: false/,
    );
  });

  it('only triggers on workflow_dispatch and v[0-9]* tag pushes', () => {
    expect(wf).toMatch(/on:\n\s+workflow_dispatch:\n\s+push:\n\s+tags:\n\s+- 'v\[0-9\]\*'/);
    expect(wf).not.toMatch(/\n\s+branches:/);
  });
});

describe('tauri-android.yml — icon source', () => {
  it('reads TAURI_ICON_SOURCE from the vars context with the PWA icon as default', () => {
    expect(wf).toMatch(
      /TAURI_ICON_SOURCE: \$\{\{ vars\.TAURI_ICON_SOURCE \|\| 'public\/icons\/pwa-512\.png' \}\}/,
    );
  });

  it('fails with ::error when the icon source file is missing, and never hardcodes the icon path in the command', () => {
    expect(wf).toContain('if [ ! -f "$TAURI_ICON_SOURCE" ]');
    expect(wf).toMatch(/::error::TAURI_ICON_SOURCE=/);
    expect(wf).toContain('npx tauri icon "$TAURI_ICON_SOURCE"');
    expect(wf).not.toContain('npx tauri icon public/icons/pwa-512.png');
  });
});

describe('tauri-android.yml — APK path', () => {
  it('builds a release APK after the AAB and a debug APK on workflow_dispatch', () => {
    const aab = wf.indexOf('run: npx tauri android build --aab');
    const apk = wf.indexOf('run: npx tauri android build --apk\n');
    const dbg = wf.indexOf('run: npx tauri android build --apk --debug');
    expect(aab).toBeGreaterThan(-1);
    expect(apk).toBeGreaterThan(aab);
    expect(dbg).toBeGreaterThan(apk);
    // Debug build is dispatch-only (a tag push produces a signed release APK).
    const dbgStep = wf.slice(wf.lastIndexOf('- name:', dbg), dbg);
    expect(dbgStep).toContain("github.event_name == 'workflow_dispatch'");
  });

  it('locates the release APK with find + an exactly-one count check, not a hardcoded filename', () => {
    expect(wf).toMatch(
      /find src-tauri\/gen\/android\/app\/build\/outputs\/apk -path '\*\/release\/\*' -name '\*\.apk'/,
    );
    expect(wf).not.toContain('app-universal-release-unsigned.apk"');
    const locate = wf.slice(
      wf.indexOf('- name: Locate release APK'),
      wf.indexOf('- name: Build debug APK'),
    );
    expect(locate).toContain('if [ "$COUNT" -ne 1 ]');
    expect(locate).toContain('unsigned_path=');
  });

  it('uploads the unsigned release APK and the debug APK as workflow_dispatch artifacts', () => {
    expect(wf).toContain('name: tauri-android-unsigned-apk');
    expect(wf).toContain('name: tauri-android-debug-apk');
    expect(wf).toContain('path: src-tauri/gen/android/app/build/outputs/apk/**/debug/*.apk');
  });

  it('signs the release APK with apksigner using env: password references, then verifies it', () => {
    const sign = wf.slice(
      wf.indexOf('- name: Sign APK'),
      wf.indexOf('- name: Clean up decoded signing keystore'),
    );
    expect(sign).toContain('apksigner" sign');
    expect(sign).toContain('--ks "$KEYSTORE_PATH"');
    expect(sign).toContain('--ks-key-alias "$ANDROID_KEY_ALIAS"');
    expect(sign).toContain('--ks-pass env:ANDROID_KEYSTORE_PASSWORD');
    expect(sign).toContain('--key-pass env:ANDROID_KEY_PASSWORD');
    expect(sign).toContain('--out "$SIGNED"');
    expect(sign).toContain('apksigner" verify');
    // Passwords never on the apksigner command line.
    expect(sign).not.toMatch(/--ks-pass pass:/);
    expect(sign).not.toMatch(/--key-pass pass:/);
    // Tag-push only.
    expect(sign).toContain("github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')");
  });

  it('keeps the build-tools version used for apksigner in sync with the SDK setup packages', () => {
    const m = wf.match(/BUILD_TOOLS_VERSION: ([\d.]+)/);
    expect(m).not.toBeNull();
    expect(wf).toContain(`build-tools;${m![1]}`);
  });

  it('attaches the signed APK and AAB to a GitHub Release and fails on unmatched files', () => {
    const rel = wf.slice(wf.indexOf('softprops/action-gh-release'));
    expect(rel).toMatch(/files: \|\n\s+release-assets\/\*\.apk\n\s+release-assets\/\*\.aab/);
    expect(rel).toContain('fail_on_unmatched_files: true');
  });
});

describe('tauri-android.yml — secrets handling', () => {
  it('requires the four keystore secrets on tag push but treats PLAY_SERVICE_ACCOUNT_JSON as optional', () => {
    const step = wf.slice(
      wf.indexOf('- name: Validate required signing secrets'),
      wf.indexOf('- name: Setup Java 17'),
    );
    for (const s of [
      'ANDROID_KEYSTORE_BASE64',
      'ANDROID_KEY_ALIAS',
      'ANDROID_KEY_PASSWORD',
      'ANDROID_KEYSTORE_PASSWORD',
    ]) {
      expect(step).toContain(`[ -z "$${s}" ] && missing="$missing ${s}"`);
    }
    // Play is no longer in the hard-fail list …
    expect(step).not.toContain('missing="$missing PLAY_SERVICE_ACCOUNT_JSON"');
    // … it emits a ::notice and a play=false output instead.
    expect(step).toContain('id: secrets');
    expect(step).toMatch(/::notice::PLAY_SERVICE_ACCOUNT_JSON is not set/);
    expect(step).toContain('echo "play=false" >> "$GITHUB_OUTPUT"');
    expect(step).toContain('echo "play=true" >> "$GITHUB_OUTPUT"');
  });

  it("gates every Play step on steps.secrets.outputs.play == 'true' (secrets can't be used in if: directly)", () => {
    const playSteps = [
      '- name: Write Play service account credentials to a temp file',
      '- name: Upload to Play Store internal track',
    ];
    for (const name of playSteps) {
      const idx = wf.indexOf(name);
      expect(idx, `${name} missing`).toBeGreaterThan(-1);
      const block = wf.slice(idx, wf.indexOf('- name:', idx + name.length));
      expect(block, `${name} not gated on play output`).toContain(
        "steps.secrets.outputs.play == 'true'",
      );
    }
    // Never `if: secrets.X` — GitHub does not allow it. (`steps.secrets.`
    // is the validation step's id, which is exactly the allowed indirection.)
    expect(wf).not.toMatch(/if:.*(?<!steps\.)secrets\./);
  });

  it('decodes the keystore under umask 077 and shreds it in an always() step', () => {
    expect(wf).toContain(
      '(umask 077; echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > /tmp/release.jks)',
    );
    const cleanup = wf.slice(wf.indexOf('- name: Clean up decoded signing keystore'));
    expect(cleanup).toMatch(/if: always\(\) && steps\.guard\.outputs\.skip != 'true'/);
    expect(cleanup).toContain('shred -u /tmp/release.jks');
  });

  it('shreds the keystore AFTER both signing steps, so the APK signer still has it', () => {
    const signAab = wf.indexOf('- name: Sign AAB');
    const signApk = wf.indexOf('- name: Sign APK');
    const cleanup = wf.indexOf('- name: Clean up decoded signing keystore');
    expect(signAab).toBeGreaterThan(-1);
    expect(signApk).toBeGreaterThan(signAab);
    expect(cleanup).toBeGreaterThan(signApk);
  });

  it('cleans up the Play service account file in an always() step', () => {
    const cleanup = wf.slice(wf.indexOf('- name: Clean up Play service account credentials file'));
    expect(cleanup).toMatch(/if: always\(\)/);
    expect(cleanup).toContain('rm -f /tmp/play-service-account.json');
  });
});

describe('tauri-android.yml — runner disk budget (regression: TradePilot run 2026-09-27)', () => {
  // The first real run built the AAB and the release APK, then died in the
  // debug build with "No space left on device" — and because the artifact
  // uploads came after that step, both finished binaries were discarded.
  it('frees runner disk before any toolchain/build step', () => {
    const free = wf.indexOf('- name: Free runner disk space');
    expect(free).toBeGreaterThan(-1);
    expect(free).toBeLessThan(wf.indexOf('- name: Setup Java 17'));
    const block = wf.slice(free, wf.indexOf('- name:', free + 10));
    expect(block).toContain('sudo rm -rf /usr/share/dotnet');
    expect(block).toContain('docker image prune --all --force');
  });

  it('uploads the unsigned AAB and release APK BEFORE building the debug APK', () => {
    const dbg = wf.indexOf('- name: Build debug APK');
    expect(wf.indexOf('name: tauri-android-unsigned-aab')).toBeLessThan(dbg);
    expect(wf.indexOf('name: tauri-android-unsigned-apk')).toBeLessThan(dbg);
    expect(wf.indexOf('name: tauri-android-debug-apk')).toBeGreaterThan(dbg);
  });

  it('builds the debug APK for arm64 only with line-table debuginfo', () => {
    expect(wf).toContain('run: npx tauri android build --apk --debug --target aarch64');
    const dbg = wf.indexOf('- name: Build debug APK');
    const block = wf.slice(dbg, wf.indexOf('- name:', dbg + 10));
    expect(block).toContain('CARGO_PROFILE_DEV_DEBUG: line-tables-only');
  });

  it('does not put src-tauri/target in the Cargo cache (exceeds the 10 GB entry limit)', () => {
    const cache = wf.slice(
      wf.indexOf('- name: Cache Cargo registry'),
      wf.indexOf('- name: Install Node deps'),
    );
    expect(cache).toContain('~/.cargo/registry');
    expect(cache).not.toMatch(/^\s+src-tauri\/target\s*$/m);
  });
});
